import reducer from '../../bicycle/src/reducer';
import * as ActionTypes from '../actions';

export const bicycle = reducer;

// Updates error message to notify about the failed fetches.
export function errorMessage(state = null, action) {
  console.log(action);
  const { type, error } = action;

  if (type === ActionTypes.RESET_ERROR_MESSAGE) {
    return null;
  } else if (error) {
    return action.error.message || action.error;
  }

  return state;
}
