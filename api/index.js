'use strict';

import bicycle from '../bicycle/server';
import {applyFilter, applySort} from '../bicycle/utils';

const database = {
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


export default function (request) {
  return bicycle(request, {getCount, getRange});
}
