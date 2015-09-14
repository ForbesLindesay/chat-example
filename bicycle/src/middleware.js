import {BICYCLE_REQUEST, BICYCLE_SUCCESS, BICYCLE_FAILURE} from './actions.js';

export default function createMiddleware(handle, getContext) {
  return store => next => action => {
    if (action.type !== BICYCLE_REQUEST) return next(action);
    next(action);
    return handle({...action.payload, context: getContext ? getContext(store) : store}).then(
      payload => {
        if (payload.status === 200) next({type: BICYCLE_SUCCESS, payload});
        else next({type: BICYCLE_FAILURE, payload, error: payload.error});
      }
    );
  };
};
