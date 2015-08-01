'use strict';

import Promise from 'promise';

import {
  SET_ITEM,
  REQUEST_RANGE,
  REQUEST_RANGE_RESPONSE,
  REQUEST_COUNT,
  REQUEST_COUNT_RESPONSE,
  REQUEST_RESPONSE_ERROR,
  BATCH,
} from './lib/constants.js';

const EMPTY = 'BICYCLE_EMPTY';

export default function handleRequest(action, {getCount, getRange, setItem}) {
  switch (action.type) {
    case BATCH:
      return Promise.all(
        action.actions.map(
          action => handleRequest(action, {getCount, getRange})
        )
      ).then(
        actions => (
          {
            type: BATCH,
            actions: actions.filter(
              action => action.type !== EMPTY
            )
          }
        )
      );
    case REQUEST_COUNT:
      return Promise.resolve(
        getCount(
          action.collection,
          {filter: action.filter}
        )
      ).then(
        count => (
          {
            type: REQUEST_COUNT_RESPONSE,
            collection: action.collection,
            container: action.container,
            count: count
          }
        )
      );
    case REQUEST_RANGE:
      return Promise.resolve(
        getRange(
          action.collection,
          {
            filter: action.filter,
            sort: action.sort,
            from: action.from,
            offset: action.offset,
            limit: action.limit
          }
        )
      ).then(
        records => (
          {
            type: REQUEST_RANGE_RESPONSE,
            collection: action.collection,
            container: action.container,
            offset: action.offset,
            records: records
          }
        )
      );
    case SET_ITEM:
      return Promise.resolve(
        setItem(action.collection, action.id, action.item)
      ).then(
        () => ({type: EMPTY})
      );
    default:
      return Promise.resolve({type: EMPTY});
  }
};
