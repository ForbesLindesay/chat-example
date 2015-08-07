'use strict';

// RUN_SERVER_SIDE

import bicycle from '../bicycle/server';
import {applyFilter, applySort} from '../bicycle/utils';

let database = {
  channels: [
    {id: 'react', name: 'React'},
    {id: 'redux', name: 'Redux'},
  ],
  messages: []
};

function getCount(collectionName, query, {user, session}) {
  var collection = database[collectionName];
  if (collectionName === 'channels' && user) {
    collection = collection.concat([{id: 'private:' + user.id, name: user.name || user.id}]);
  }
  return collection.filter(function (record) {
    return applyFilter(query.filter, record);
  }).length
}

function getRange(collectionName, query, {user, session}) {
  var collection = database[collectionName];
  if (collectionName === 'channels' && user) {
    collection = collection.concat([{id: 'private:' + user.id, name: user.name || user.id}]);
  }
  return collection.filter(function (record) {
    return applyFilter(query.filter, record);
  }).sort(applySort.bind(null, query.sort)).slice(query.offset || 0, query.limit === -1 ? Infinity : (query.offset + query.limit));
}

var subscriptions = [];
function setItem(collectionName, id, value, {user, session}) {
  let found = false;
  let collection = database[collectionName].map(
    item => {
      if (item.id === id) {
        found = true;
        return value;
      }
      return item
    }
  ).filter(Boolean);
  if (!found) collection.push(value);
  database = {
    ...database,
    [collectionName]: collection
  };
}

export default bicycle({getCount, getRange, setItem});