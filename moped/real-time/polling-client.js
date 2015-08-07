import request from 'then-request';

var errDelay = 1;
export default function (store, sessionKey) {
  function poll() {
    console.log('poll');
    request('POST', MOPED_LONG_POLL ? '/long-poll' : '/poll', {qs: {session: sessionKey}}).getBody().then(JSON.parse).then(function (actions) {
      errDelay = 1;
      actions.forEach(function (action) {
        store.dispatch(action);
      });
      setTimeout(poll, MOPED_LONG_POLL ? 0 : MOPED_POLL_DELAY);
    }).then(null, function (err) {
      errDelay = errDelay * 2;
      setTimeout(poll, 2000 * errDelay);
    });
  }
  poll();
};