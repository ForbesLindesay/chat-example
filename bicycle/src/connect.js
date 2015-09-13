import {connect as redux} from 'react-redux';
import {request} from './actions';

export default function (query) {
  function walk(data, format, state) {
    if (typeof format === 'string' && format !== 'string' && typeof data === 'string') {
      return state.objects[data];
    } else if (Array.isArray(format) && data) {
      return data.map(d => walk(d, format[0], state));
    } else if (format && typeof format === 'object' && data && typeof data === 'object') {
      let result = {};
      Object.keys(data).forEach(function (key) {
        result[key] = walk(data[key], format[key], state);
      });
    } else {
      return data;
    }
  }
  function selectData(state, query) {
    if (!state.status.read[query] || !state.status.read[query].loaded) {
      return {
        loaded: false,
        loading: state.status.read[query] && state.status.read[query].loading,
        error: state.status.read[query] && state.status.read[query].error
      };
    } else {
      return {
        loaded: true,
        data: walk(state.cache[query].data, state.cache[query].format, state)
      };
    }
  }
  function selectState(state, query) {
    if (!query) return {};
    var result = {};
    Object.keys(query).forEach(function (key) {
      result[key] = selectData(state.bicycle, query[key]);
    });
    return result;
  }
  var c = redux(
    query.length
    ? function (state, props) { return selectState(state, query(props)); }
    : function (state) { return selectState(state, query()); },
    function (dispatch) { return {bicycleRead: query => dispatch(request('read', query))}; },
    function (stateProps, dispatchProps, ownProps) {
      var q = query(ownProps);
      var output = {};
      if (q) {
        Object.keys(q).forEach(function (key) {
          if (stateProps[key].loaded) {
            output[key] = stateProps[key].data;
          } else if (!stateProps[key].loading && !stateProps[key].error) {
            dispatchProps.bicycleRead(q[key]);
          }
        });
      }
      return {
        ...ownProps,
        ...output,
        ...dispatchProps
      };
    }
  );
  return c;
};
