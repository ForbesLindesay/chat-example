
import { SET_ITEM } from './constants.js';

export function set(collection, id, value) {
  value.id = id;
  return {
    type: SET_ITEM,
    collection: collection,
    id: id,
    item: value
  };
};
export function remove(collection, id) {
  value.id = id;
  return {
    type: SET_ITEM,
    collection: collection,
    id: id,
    item: undefined
  };
};