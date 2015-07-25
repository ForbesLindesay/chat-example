'use strict';

import bicycle from '../bicycle/server';

const database = {
  channels: [
    {id: '0', name: 'React'},
    {id: '1', name: 'Redux'},
  ]
};

function queryCollection(collectionName, query) {
  return database[collectionName].map(
    item => item.id
  );
}

function getRecord(collectionName, id) {
  return database[collectionName].filter(
    item => item.id === id
  )[0];
}

export default function (request) {
  return bicycle(request, {queryCollection, getRecord});
}
