'use strict';

import sha from 'stable-sha1';
import React from 'react';
import {Connector} from 'react-redux';
import {Map as ImmutableMap} from 'immutable';

const LOAD_DB_RECORDS = 'LOAD_DB_RECORDS';
const LOADED_DB_RECORDS = 'LOADED_DB_RECORDS';

const initialState = {
  queries: new ImmutableMap(),
  records: new ImmutableMap()
};

export default reducer;
export function reducer(state = initialState, action) {
  if (action.type === LOAD_DB_RECORDS) {
    var queries = state.queries;
    var records = state.records;
    if (action.queries) {
      Object.keys(action.queries).forEach(collectionName => {
        action.queries[collectionName].forEach(query => {
          queries = queries.setIn([collectionName, query.key], {loaded: false});
        });
      });
    }
    if (action.records) {
      Object.keys(action.records).forEach(collectionName => {
        action.records[collectionName].forEach(id => {
          records = records.setIn([collectionName, id], {loaded: false});
        });
      });
    }
    return { queries, records };
  }
  if (action.type === LOADED_DB_RECORDS) {
    var queries = state.queries;
    var records = state.records;
    if (action.queries) {
      Object.keys(action.queries).forEach(collectionName => {
        action.queries[collectionName].forEach(results => {
          queries = queries.setIn([collectionName, results.key], {loaded: true, ids: results.ids});
        });
      });
    }
    if (action.records) {
      Object.keys(action.records).forEach(collectionName => {
        action.records[collectionName].forEach(record => {
          records = records.setIn([collectionName, record.id], {loaded: true, id: record.id, value: record});
        });
      });
    }
    return { queries, records };
  }
  return state;
}

function runQuery(db, collectionName, query) {
  if (typeof query.id === 'string' || typeof query.id === 'number') {
    return {
      ids: [query.id],
      newQuery: null
    };
  }
  var key = sha(query);
  var results;
  if (results = db.queries.get(collectionName) && db.queries.get(collectionName).get(key)) {
    if (results.loaded) {
      return {
        ids: results.ids,
        newQuery: null
      };
    } else {
      return {
        ids: null,
        newQuery: null
      };
    }
  } else {
    return {
      ids: null,
      newQuery: {key: key, query: query}
    };
  }
}

function getIds(db, collectionName, ids) {
  if (!db.records.get(collectionName)) {
    return {
      loaded: false,
      records: ids.map(id => ({loaded: false, id})),
      newRecords: ids.length ? ids : null
    };
  }
  var loaded = true;
  var newRecords = [];
  var records = ids.map(id => {
    var record = db.records.get(collectionName).get(id);
    if (record) {
      if (record.loaded) {
        return {loaded: true, id, value: record.value};
      } else {
        loaded = false;
        return {loaded: false, id};
      }
    } else {
      loaded = false;
      newRecords.push(id);
      return {loaded: false, id};
    }
  });
  return {
    loaded,
    records,
    newRecords: newRecords.length ? newRecords : null
  };
}

function runQueries(db, collectionName, queries) {
  if (!Array.isArray(queries)) queries = [queries];
  var loaded = true;
  var ids = [];
  var newQueries = [];
  queries.forEach((query) => {
    var res = runQuery(db, collectionName, query);
    if (res.ids) {
      res.ids.forEach(function (id) {
        if (ids.indexOf(id) === -1) {
          ids.push(id);
        }
      });
    } else {
      loaded = false;
    }
    if (res.newQuery) {
      newQueries.push(res.newQuery);
    }
  });
  var res = getIds(db, collectionName, ids);
  return {
    loadedIds: loaded,
    loaded: loaded && res.loaded,
    ids,
    records: loaded ? res.records : null,
    newQueries: (newQueries.length ? newQueries : null),
    newRecords: res.newRecords
  };
}

export function getState(dispatch, db, q, server) {
    var loaded = true;
  var newQueries = null, newRecords = null;

  var results = {};

  Object.keys(q).forEach((collectionName) => {
    if (!q[collectionName]) return;
    var res = runQueries(db, collectionName, q[collectionName]);
    if (!res.loaded) loaded = false;
    results[collectionName + 'Loaded'] = res.loaded;
    results[collectionName + 'Progressive'] = res.records;
    var loadedResults = null;
    if (res.records) {
      loadedResults = [];
      for (var i = 0; i < res.records.length; i++) {
        if (!res.records[i].loaded) break;
        loadedResults.push(res.records[i].value);
      }
    }
    results[collectionName] = loadedResults;
    if (res.newQueries) {
      newQueries = newQueries || {};
      newQueries[collectionName] = res.newQueries;
    }
    if (res.newRecords) {
      newRecords = newRecords || {};
      newRecords[collectionName] = res.newRecords;
    }
  });

  if (newQueries || newRecords) {
    dispatch({type: LOAD_DB_RECORDS, queries: newQueries, records: newRecords});
    dispatch(server({queries: newQueries, records: newRecords}).then(response => {
      return {type: LOADED_DB_RECORDS, queries: response.queries, records: response.records};
    }));
  }
  return {loaded, ...results};
}
