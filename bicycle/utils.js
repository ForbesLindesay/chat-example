
export function applyFilter(filter, object) {
  return Object.keys(filter || {}).every(key => object[key] === filter[key]);
}
export function applySort(sort, a, b) {
  // TODO: implement this
  return a.id > b.id ? 1 : -1;
}