import {connect as redux} from 'react-redux';
import {request} from './actions';

export default function (query, mutate) {
  var c = redux(
    query.length
    ? function (state, props) { return selectState(state.bicycle, query(props)); }
    : function (state) { return selectState(state.bicycle, query()); },
    function (dispatch) {
      return {dispatch};
    },
    function ({props, pending, nextTokens, status}, {dispatch}, ownProps) {
      var nextPageMethods = {};
      pending.forEach(function (q) {
        dispatch(request('read', q));
      });
      Object.keys(nextTokens).forEach(function (key) {
        nextPageMethods[key + 'Next'] = dispatch.bind(
          null,
          request(
            'read',
            nextTokens[key][0],
            {bicycle_page_token: nextTokens[key][1]}
          )
        );
      });
      var fullProps = {
        ...ownProps,
        ...props,
        ...nextPageMethods,
      };
      var m = mutate(
        (method, path, input, qs) => dispatch(request(method, path, input, qs)),
        fullProps
      );
      var mLoading = mutate(
        (method, path) => status[method][path] && status[method][path].loading,
        fullProps
      );
      var finalProps = {...fullProps, ...m};
      Object.keys(mLoading).forEach(function (key) {
        finalProps[key + 'Loading'] = mLoading[key];
      });
      return finalProps;
    }
  );
  return c;
};

function selectState(state, query) {
  if (!query) return {};
  var props = {};
  var nextTokens = {};
  var pending = [];
  Object.keys(query).forEach(function (key) {
    var q = query[key];
    props[key + 'Loaded'] = !!(state.status.read[q] && state.status.read[q].loaded);
    props[key + 'Loading'] = !!(state.status.read[q] && state.status.read[q].loading);
    props[key + 'Error'] = state.status.read[q] && state.status.read[q].error;
    props[key + 'Count'] = state.cache[q] && state.cache[q].count;
    props[key] = (state.cache[q] && state.cache[q].data) ? reconstruct(
      state.cache[q].data,
      state.cache[q].format,
      state.objects
    ) : null;
    if (!props[key + 'Loaded'] && !props[key + 'Loading'] && !props[key + 'Error']) {
      pending.push(q);
      props[key + 'Loading'] = true;
    }
    if (state.cache[q] && state.cache[q].nextToken) {
      nextTokens[key] = [q, state.cache[q].nextToken];
    }
  });
  return {props, pending, nextTokens, status: state.status};
}

function reconstruct(data, format, objects) {
  if (typeof format === 'string' && format !== 'string' && typeof data === 'string') {
    return objects[data];
  } else if (Array.isArray(format) && data) {
    return data.map(d => reconstruct(d, format[0], objects));
  } else if (format && typeof format === 'object' && data && typeof data === 'object') {
    let result = {};
    Object.keys(data).forEach(function (key) {
      result[key] = reconstruct(data[key], format[key], objects);
    });
  } else {
    return data;
  }
}
