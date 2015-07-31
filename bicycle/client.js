import {reducer, getData, generateAction} from './lib/reducer.js';

export default Client;
function Client(sendMessage) {
  this.sendMessage = sendMessage;
  this.state = undefined;
}
Client.prototype.receiveMessage = function (action) {
  this.state = reducer(this.state, action);
};
Client.prototype.getData = function (query) {
  let action = generateAction(this.state, query);
  if (action) {
    this.state = reducer(this.state, action);
    this.sendMessage(action);
  }
  return getData(this.state, query);
};