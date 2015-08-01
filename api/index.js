'use strict';

import bicycle from '../bicycle/server';
import {applyFilter, applySort} from '../bicycle/utils';

export const RUN_SERVER_SIDE = true;

let database = {
  channels: [
    {id: 'react', name: 'React'},
    {id: 'redux', name: 'Redux'},
  ]
};

function getCount(collectionName, query) {
  return database[collectionName].filter(function (record) {
    return applyFilter(query.filter, record);
  }).length
}

function getRange(collectionName, query) {
  return database[collectionName].filter(function (record) {
    return applyFilter(query.filter, record);
  }).slice(query.offset || 0, query.limit === -1 ? Infinity : (query.offset + query.limit));
}

function setItem(collectionName, id, value) {
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
  console.log('Database:');
  console.dir(database);
}

export default function (request) {
  return bicycle(request, {getCount, getRange, setItem});
}
