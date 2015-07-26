'use strict';

import React, { PropTypes } from 'react';
import { Connector } from 'react-redux';
import { getState } from './client';

export default function connect(query) {
  return DecoratedComponent => React.createClass({
    displayName: 'BicycleConnector',

    contextTypes: {
      bicycleServer: PropTypes.func.isRequired
    },

    renderDecoratedComponent({dispatch, db}) {
      var q = query(this.props);
      var state = q ? getState(dispatch, db, q, this.context.bicycleServer) : {};
      return React.createElement(
        DecoratedComponent,
        {...state, ...this.props}
      );
    },
    render() {
      return (
        React.createElement(
          Connector,
          {select: state => ({db: state.db})},
          this.renderDecoratedComponent
        )
      );
    }
  });
}
