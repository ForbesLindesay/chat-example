export const BICYCLE_REQUEST = 'BICYCLE_REQUEST';
export const BICYCLE_SUCCESS = 'BICYCLE_SUCCESS';
export const BICYCLE_FAILURE = 'BICYCLE_FAILURE';
export function request(method, path, input, qs) {
  if ((method === 'remove' || method === 'read') && input && !qs) {
    qs = input;
    input = null;
  }
  return {type: BICYCLE_REQUEST, payload: {method, path, input, qs}};
};
