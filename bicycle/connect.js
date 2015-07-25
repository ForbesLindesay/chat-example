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

      return React.createElement(
        DecoratedComponent,
        {...getState(dispatch, db, q, this.context.bicycleServer), ...this.props}
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
