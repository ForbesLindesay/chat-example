import React, { PropTypes } from 'react';

export default React.createClass({
  displayName: 'BicycleProvider',

  childContextTypes: {
    bicycleServer: PropTypes.func.isRequired
  },
  propTypes: {
    server: PropTypes.func.isRequired,
    children: PropTypes.func.isRequired
  },
  getChildContext() {
    return { bicycleServer: this.props.server };
  },
  render() {
    return this.props.children();
  }
});
