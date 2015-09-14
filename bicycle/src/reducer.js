import { BICYCLE_REQUEST, BICYCLE_SUCCESS, BICYCLE_FAILURE} from './actions.js';

const INITIAL_STATE = {status: {create: {}, read: {}, update: {}, remove: {}}, cache: {}, objects: {}};
const INITIAL_STATUS = {loaded: false, loading: 0, error: null};

export default function (state = INITIAL_STATE, action) {
  if (
    action.type === BICYCLE_REQUEST ||
    action.type === BICYCLE_SUCCESS ||
    action.type === BICYCLE_FAILURE
  ) {
    let payload = action.payload;
    return {
      cache: updateCache(state.cache, action),
      objects: updateObjects(state.objects, action),
      status: updateStatus(state.status, action),
    };
  }

  return state;
};

function updateCache(state, action) {
  if (action.type !== BICYCLE_SUCCESS) return state;
  if (action.payload.method === 'read') {
    function walk(format, data) {
      if (typeof format === 'string' && format in action.payload.schema.idsByType) {
        return format + ':' + data[action.payload.schema.idsByType[format]];
      } else if (Array.isArray(format) && data) {
        return data.map(d => walk(format[0], d));
      } else if (format && typeof format === 'object' && data && typeof data === 'object') {
        let result = {};
        Object.keys(data).forEach(function (key) {
          result[key] = walk(format[key], data[key]);
        });
      } else {
        return data;
      }
    }
    var data = walk(action.payload.schema.format, action.payload.data);
    var format = action.payload.schema.format;
    var nextToken, count;
    if (action.payload.paged) {
      if (action.payload.paged.currentToken) {
        if (
          !(
            state[action.payload.path] &&
            state[action.payload.path].nextToken === action.payload.paged.currentToken
          )
        ) {
          console.error('Invalid page recieved, ignoring');
          return state;
        }
        data = state[action.payload.path].data.concat(data);
      }
      nextToken = action.payload.paged.nextToken;
      count = action.payload.paged.count;
    }
    return {
      ...state,
      [action.payload.path]: {data, format, nextToken, count}
    };
  } else {
    return state;
  }
}
function updateObjects(state, action) {
  if (action.type !== BICYCLE_SUCCESS) return state;
  var objects = {...state};
  function walk(format, data) {
    if (typeof format === 'string' && format in action.payload.schema.idsByType) {
      let id = format + ':' + data[action.payload.schema.idsByType[format]];
      objects[id] = {...objects[id], ...data};
    } else if (Array.isArray(format) && data) {
      data.forEach(d => walk(format[0], d));
    } else if (format && typeof format === 'object' && data && typeof data === 'object') {
      Object.keys(data).forEach(function (key) {
        walk(format[key], data[key]);
      });
    }
  }
  walk(action.payload.schema.format, action.payload.data);
  return objects;
}

function updateStatus(status, action) {
  let payload = action.payload;
  return {
    ...status,
    [payload.method]: {
      ...status[payload.method],
      [payload.path]: updatePathStatus(status[payload.method][payload.path], action)
    }
  };
}
function updatePathStatus(status = INITIAL_STATUS, action) {
  if (action.type === BICYCLE_REQUEST) {
    return {...status, loading: status.loading + 1};
  }
  if (action.type === BICYCLE_SUCCESS) {
    return {...status, loaded: true, loading: status.loading - 1, error: null};
  }
  if (action.type === BICYCLE_FAILURE) {
    return {...status, loading: status.loading - 1, error: action.error};
  }
  return status;
}
