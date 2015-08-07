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
  SUBSCRIBE
} from './lib/constants.js';

const EMPTY = 'BICYCLE_EMPTY';

export const actionTypes = [
  SET_ITEM,
  REQUEST_RANGE,
  REQUEST_COUNT,
  BATCH,
  SUBSCRIBE
];
export default function (api) {
  var subscriptions = [];
  function getSubscription({user, session}) {
    return {
      subscribe: function (fn) {
        var subscription = {fn, user, session};
        subscriptions.push(subscription);
        return function () {
          subscriptions = subscriptions.filter(s => s !== subscription);
        };
      }
    };
  }
  return function handleRequest(action, req) {
    switch (action.type) {
      case SUBSCRIBE:
        return getSubscription(req);
      case BATCH:
        return Promise.all(
          action.actions.map(
            childAction => handleRequest(childAction, req)
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
          api.getCount(
            action.collection,
            {filter: action.filter},
            req
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
          api.getRange(
            action.collection,
            {
              filter: action.filter,
              sort: action.sort,
              from: action.from,
              offset: action.offset,
              limit: action.limit
            },
            req
          )
        ).then(
          records => (
            {
              type: REQUEST_RANGE_RESPONSE,
              collection: action.collection,
              container: action.container,
              offset: action.offset,
              records: records.map(
                item => action.existingKeys.indexOf(item.id) === -1 ? item : item.id
              )
            }
          )
        );
      case SET_ITEM:
        if (action.item) {
          action.item.id = action.id;
        } else {
          action.item = undefined;
        }
        return Promise.resolve(
          api.setItem(
            action.collection,
            action.id,
            action.item,
            req
          )
        ).then(
          () => {
            subscriptions.forEach(function (subscription) {
              subscription.fn(action);
            });
            return {type: EMPTY}
          }
        );
      default:
        return Promise.resolve({type: EMPTY});
    }
  };
};
