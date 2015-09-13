import React from 'react';
import connect from '../../bicycle/src/connect';

export default connect(
  () => {
    return {user: '/users/ForbesLindesay'};
  }
)(React.createClass({
  render() {
    return React.createElement('pre', {}, JSON.stringify(this.props.user, null, '  '));
  }
}));
