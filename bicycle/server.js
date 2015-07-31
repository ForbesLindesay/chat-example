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

export default function handleRequest(action, {getCount, getRange}) {
  switch (action.type) {
    case BATCH:
      return Promise.all(
        action.actions.map(action => handleRequest(action, {getCount, getRange}))
      ).then(
        actions => ({type: BATCH, actions: actions.filter(Boolean)})
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
    default:
      return {type: 'BICYCLE_EMPTY'};
  }
};
