'use strict';

import assert from 'assert';
import {Map, List, fromJS} from 'immutable';
import sha from 'stable-sha1';
import {applyFilter, applySort} from '../utils';

import {
  SET_ITEM,
  REQUEST_RANGE,
  REQUEST_RANGE_RESPONSE,
  REQUEST_COUNT,
  REQUEST_COUNT_RESPONSE,
  REQUEST_RESPONSE_ERROR,
  BATCH,

  CONTAINERS,
  RECORDS,
  COUNT,
  REQUESTED_COUNT,
  ERROR,
  FILTER,
  SORT
} from './constants.js';

function initialContainer({filter, sort}) {
  return new Map({
    [RECORDS]: new List(),
    [COUNT]: -1,
    [REQUESTED_COUNT]: 0,
    [ERROR]: false,
    [FILTER]: filter,
    [SORT]: sort
  });
}

function updateContainer(container, action, oldRecordValues) {
  const filter = container.get(FILTER);
  const sort = container.get(SORT);
  
  // {type: String, count: Number}
  if (action.type === REQUEST_COUNT_RESPONSE) {
    return container.set(COUNT, action.count);
  }
  // {type: String, id: String, item: Object}
  if (action.type === SET_ITEM) {
    let oldContainer = container;
    let serverCount = container.get(COUNT);
    let itemId = action.id;
    let item = action.item;
    var records = container.get(RECORDS);

    let localCount = records.size;
    let maxItemId = records.get(localCount - 1);
    let maxItem = records.get(maxItemId);
    
    let oldIndex = records.indexOf(itemId);
    if (oldIndex !== -1) {
      records = records.remove(oldIndex);
      container = container.set(RECORDS, records);
    }

    if (!item || !applyFilter(filter, item)) {
      if (serverCount !== -1 && oldRecordValues.get(itemId) && applyFilter(filter, oldRecordValues.get(itemId))) {
        container = container.set(COUNT, serverCount - 1)
      }
      return container;
    } else {
      if (serverCount !== -1 && !(oldRecordValues.get(itemId) && applyFilter(filter, oldRecordValues.get(itemId)))) {
        container = container.set(COUNT, serverCount + 1);
      }
    }
    if (applySort(sort, item, maxItem) > 0) return container; // if (item > maxItem)
    
    let newIndex = 0;
    records.some(existingItemId => {
      let existingItem = oldRecordValues.get(existingItemId);
      if (applySort(sort, existingItem, item) > 0) { // if (existingItem > item)
        return true;
      } else {
        newIndex++;
      }
    });
    if (newIndex === oldIndex) return oldContainer;
    return container.set(RECORDS, records.splice(newIndex, 0, itemId));
  }
  // {type: String, records: Array<String|{id: String}>, offset: Number}
  if (action.type === REQUEST_RANGE_RESPONSE) {
    let localCount = container.get(RECORDS).size;
    assert(action.offset <= localCount);
    return container.set(
      RECORDS,
      container.get(
        RECORDS
      ).concat(
        action.records.slice(
          localCount - action.offset
        ).map(
          item => typeof item === 'string' ? item : item.id
        )
      )
    );
  }
  // {type: String, filter: Object, sort: Object, from: String, offset: Number, limit: Number}
  if (action.type === REQUEST_RANGE) {
    var newRequestedCount = (
      (container.get(REQUESTED_COUNT) === -1 || action.limit === -1) ?
      -1 :
      Math.max(container.get(REQUESTED_COUNT), action.offset + action.limit)
    );
    assert(!isNaN(newRequestedCount));
    return container.set(
      REQUESTED_COUNT,
      newRequestedCount
    ).set(ERROR, false);
  }
  // {type: String, err: Error}
  if (action.type === REQUEST_RESPONSE_ERROR) {
    let localCount = container.get(RECORDS).size;
    assert(!isNaN(localCount));
    return container.set(REQUESTED_COUNT, localCount).set(ERROR, action.err);
  }
  return container;
}

const INITIAL_COLLECTION_STATE = new Map({
  [CONTAINERS]: new Map(),
  [RECORDS]: new Map()
});
function updateCollection(collection = INITIAL_COLLECTION_STATE, action) {
  if (typeof collection.get !== 'function') {
    collection[CONTAINERS] = new Map(collection[CONTAINERS]).map(
      value => new Map(value).map(
        (value, key) => key === RECORDS ? new List(value) : value
      )
    );
    collection[RECORDS] = new Map(collection[RECORDS]);
    collection = new Map(collection);
  }
  let records = collection.get(RECORDS);
  switch (action.type) {
    case REQUEST_COUNT_RESPONSE:
    case REQUEST_RANGE_RESPONSE:
    case REQUEST_RANGE:
    case REQUEST_COUNT:
    case REQUEST_RESPONSE_ERROR:
      let key = [CONTAINERS, action.container];
      let container = collection.getIn(key);
      if (!container && (action.type === REQUEST_RANGE || action.type === REQUEST_COUNT)) {
        container = initialContainer(action);
      }
      if (!container) {
        return collection;
      }
      collection = collection.setIn(key, updateContainer(container, action, records));
      if (action.type === REQUEST_RANGE_RESPONSE) {
        action.records.forEach(record => {
          if (typeof record === 'object') {
            records = records.set(record.id, record);
          }
        });
        collection = collection.set(RECORDS, records);
      }
      break;
    case SET_ITEM:
      // TODO: remove item if it no longer matches any queries?
      collection = collection.set(
        CONTAINERS,
        collection.get(CONTAINERS).map(container =>
          updateContainer(container, action, records)
        )
      );
      if (action.item) {
        collection = collection.setIn([RECORDS, action.id], action.item);
      } else {
        collection = collection.removeIn([RECORDS, action.id]);
      }
      break;
  }
  return collection;
}

export function reducer(state = new Map(), action) {
  if (typeof state.get !== 'function') {
    state = (new Map(state)).map(collection => updateCollection(collection, {type: '@@init'}));
  }
  if (action.type === BATCH) {
    action.actions.forEach(childAction => state = reducer(state, childAction));
    return state;
  }
  if (
    typeof action.type === 'string' &&
    /^BICYCLE\_/.test(action.type) &&
    typeof action.collection === 'string'
  ) {
    return state.set(action.collection, updateCollection(state.get(action.collection), action));
  }
  return state;
};


function generateActionsForCollection(state, collectionName, query) {
  let queryKey = sha({filter: query.filter, sort: query.sort});
  let collection = state && state.get(collectionName);
  let container = collection && collection.get(CONTAINERS).get(queryKey);
  if (!container) {
    return [
      {
        type: REQUEST_COUNT,
        collection: collectionName,
        container: queryKey,
        filter: query.filter,
        sort: query.sort
      },
      {
        type: REQUEST_RANGE,
        collection: collectionName,
        container: queryKey,
        filter: query.filter,
        sort: query.sort,
        from: null,
        offset: 0,
        limit: query.count || -1
      }
    ];
  } else {
    let requestedCount = container.get(REQUESTED_COUNT);
    let count = query.count || -1;
    assert(!isNaN(requestedCount));
    if (container.get(COUNT) !== -1) count = (count === -1 ? container.get(COUNT) : Math.min(count, container.get(COUNT)));
    if (requestedCount >= count || requestedCount === -1) {
      return [];
    }
    let actions = [];
    if (container.get(ERROR)) {
      actions.push(
        {
          type: REQUEST_COUNT,
          collection: collectionName,
          container: queryKey,
          filter: query.filter
        }
      );
    }
    let localSize = container.get(RECORDS).size;
    actions.push(
      {
        type: REQUEST_RANGE,
        collection: collectionName,
        container: queryKey,
        filter: query.filter,
        sort: query.sort,
        from: container.get(RECORDS).get(localSize - 1),
        offset: localSize,
        limit: query.count ? query.count - localSize : -1
      }
    );
    return actions;
  }
}
function getDataForCollection(state, collectionName, query) {
  let queryKey = sha({filter: query.filter, sort: query.sort});
  let count = query.count || -1;
  let collection = state && state.get(collectionName);
  let container = collection && collection.get(CONTAINERS).get(queryKey);
  if (!container) {
    return {loaded: false};
  }
  assert(!isNaN(count));
  if (container.get(COUNT) !== -1) count = (count === -1 ? container.get(COUNT) : Math.min(count, container.get(COUNT)));
  assert(!isNaN(count));
  let localSize = container.get(RECORDS).size;
  let loaded = count === -1 ? localSize === container.get(COUNT) : localSize >= count;
  let countToFetch = count === -1 ? localSize : Math.min(localSize, count);
  let records = container.get(RECORDS).slice(0, countToFetch).map(id => collection.get(RECORDS).get(id)).toArray();
  return {loaded, records};
}

export function generateAction(state, query) {
  let actions = [];
  Object.keys(query).forEach(function (collectionName) {
    actions = actions.concat(
      generateActionsForCollection(
        state,
        collectionName,
        query[collectionName]
      )
    );
  });
  if (actions.length > 1) {
    return {type: BATCH, actions: actions};
  } else if (actions.length === 1) {
    return actions[0];
  } else {
    return null;
  }
};

export function getData(state, query) {
  let result = {loaded: true, action: null};
  Object.keys(query).forEach(function (collectionName) {
    let {loaded, records} = getDataForCollection(
      state,
      collectionName,
      query[collectionName]
    );
    result[collectionName + 'Loaded'] = loaded;
    result[collectionName] = records;
    result.loaded = result.loaded && loaded;
  });
  return result;
};