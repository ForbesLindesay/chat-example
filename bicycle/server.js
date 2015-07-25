'use strict';

import Promise from 'promise';

export default function (request, {queryCollection, getRecord}) {
  var response = {};
  var pending = [];
  if (request.queries) {
    pending.push(
      getQueries(
        request.queries,
        queryCollection
      ).then(
        queries => response.queries = queries
      )
    );
  }
  if (request.records) {
    pending.push(
      getRecords(
        request.records,
        getRecord
      ).then(
        records => response.records = records
      )
    );
  }
  return Promise.all(pending).then(() => {
    return response;
  });
}

function getQueries(queries, queryCollection) {
  var results = {};
  return Promise.all(Object.keys(queries).map(collectionName => {
    return Promise.all(queries[collectionName].map(query =>
      Promise.resolve(queryCollection(collectionName, query.query)).then(ids => {
        return {key: query.key, ids: ids.map(id => id + '')};
      })
    )).then(res => results[collectionName] = res);
  })).then(() => results);
}
function getRecords(records, getRecord) {
  var results = {};
  return Promise.all(Object.keys(records).map(collectionName => {
    return Promise.all(records[collectionName].map(id =>
      Promise.resolve(getRecord(collectionName, id)).then(record =>
        record ? record : {id, notFound: true}
      )
    )).then(res => results[collectionName] = res);
  })).then(() => results);
}
