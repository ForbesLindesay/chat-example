import assert from 'assert';
import Promise from 'promise';

export default function createApi(schema) {
  assert(schema && typeof schema === 'object', 'You must provide a valid schema');
  Object.keys(schema).forEach(function (key) {
    if (isBuiltInType(key)) {
      throw new Error('You are attempting to redefine the built in type "' + key + '"');
    }
    if (!typeof schema[key]._id === 'string') {
      throw new Error(key + ' does not specify an id.');
    }
    if (!validateType(schema[key], schema)) {
      throw new Error(key + ' is not a valid type definition');
    }
  });
  var paths = {
    create: {},
    read: {},
    update: {},
    remove: {},
  };
  function addHandler(options) {
    assert(typeof options.path === 'string', 'path should be a string');
    assert(options.path[0] === '/', 'paths should always start with a "/"');
    if ('inputType' in options && !validateType(options.inputType, schema)) {
      throw new Error('Invalid input type');
    }
    if (!validateType(options.outputType, schema)) {
      throw new Error('Invalid output type');
    }
    if (typeof options.handler !== 'function') {
      throw new TypeError('handler should be a function');
    }
    var path = options.path.split('/').slice(1);
    let {selectedLocation, ambiguousLocations} =
      path.reduce(function ({selectedLocation, ambiguousLocations}, segment) {
        if (!/^(\:[a-zA-Z]+|[a-z\-]+)$/.test(segment)) {
          throw new Error('Invalid path segment "' + segment + '"');
        }
        if (segment === ':qs') {
          throw new Error('qs is a reserved name, you cannot use it as a path segment');
        }
        if (segment[0] === ':') {
          segment = '$';
          ambiguousLocations = ambiguousLocations.map(
            al => Object.keys(al).map(k => al[k])
          ).reduce((a, b) => a.concat(b), []);
        } else {
          ambiguousLocations = ambiguousLocations.map(
            al => (al[segment] ? [al[segment]] : []).concat(al['$'] ? [al['$']] : [])
          ).reduce((a, b) => a.concat(b), []);
        }
        return {
          selectedLocation: selectedLocation[segment] || (selectedLocation[segment] = {}),
          ambiguousLocations
        };
      }, {selectedLocation: paths[options.method], ambiguousLocations: [paths[options.method]]});
    ambiguousLocations = ambiguousLocations.filter(
      l => '_data' in l
    );
    if (ambiguousLocations.length) {
      throw new Error('"' + options.path + '" is ambiguous with "' + ambiguousLocations[0]._data.path + '"');
    }
    options.pattern = path.map(
      segment => segment[0] === ':' ? segment.substr(1) : '_'
    );
    options.schema = {
      format: options.outputType,
      idsByType: getAllTypes(options.outputType).filter(
        name => !isBuiltInType(name)
      ).reduce(
        (acc, name) => ({...acc, [name]: schema[name]._id}),
        {}
      )
    };
    selectedLocation._data = options;
  }
  return {
    handle({method, context, path, input, qs}) {
      assert(typeof method === 'string', 'Method must be a string');
      assert(method in paths, '"' + method + '" is not a valid method');
      assert(typeof path === 'string' && path[0] === '/');
      let pathSegments = path.split('/').slice(1);
      let locations =
        pathSegments.reduce(function (locations, segment) {
          return locations.map(
            l => (l[segment] ? [l[segment]] : []).concat(l['$'] ? [l['$']] : [])
          ).reduce((a, b) => a.concat(b), []);
        }, [paths[method]]);
      if (locations.length !== 1 || !locations[0]._data) {
        return Promise.resolve({status: 404, error: 'Path Not Found', method, path, input, qs});
      }
      var params = {qs}
      locations[0]._data.pattern.forEach(
        (segment, i) => {
          if (segment !== '_') params[segment] = pathSegments[i];
        }
      );
      return Promise.resolve(locations[0]._data.handler(context, params, input)).then(
        data => ({status: 200, schema: locations[0]._data.schema, data, method, path, input, qs})
      );
    },
    create(path, inputType, outputType, handler) {
      addHandler({
        method: 'create',
        path,
        inputType,
        outputType,
        handler
      });
    },
    read(path, outputType, handler) {
      addHandler({
        method: 'read',
        path,
        outputType,
        handler
      });
    },
    update(path, inputType, outputType, handler) {
      addHandler({
        method: 'update',
        path,
        inputType,
        outputType,
        handler
      });
    },
    remove(path, outputType, handler) {
      addHandler({
        method: 'remove',
        path,
        outputType,
        handler
      });
    },
  };
}

function getAllTypes(typeDef) {
  if (typeof typeDef === 'string') {
    return [typeDef];
  }
  if (Array.isArray(typeDef)) {
    return getAllTypes(typeDef[0]);
  }
  if (typeDef && typeof typeDef === 'object') {
    return Object.keys(typeDef).map(function (key) {
      if (key === '_id') return [];
      return getAllTypes(typeDef[key]);
    }).reduce((a, b) => a.concat(b), []);
  }
  return [];
}
function validateType(typeDef, schema) {
  if (typeof typeDef === 'string') {
    return isBuiltInType(typeDef) || typeDef in schema;
  }
  if (Array.isArray(typeDef)) {
    return typeDef.length === 1 && validateType(typeDef[0], schema);
  }
  if (typeDef && typeof typeDef === 'object') {
    return Object.keys(typeDef).every(function (key) {
      if (key === '_id') return true;
      return /^[a-zA-Z]+$/.test(key) && validateType(typeDef[key], schema);
    });
  }
  return false;
}

function isBuiltInType(name) {
  return [
    'string',
    'number',
    'boolean'
  ].indexOf(name) !== -1;
}
