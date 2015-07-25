'use strict';

import React from 'react';
import { Connector } from 'react-redux';
import { getState } from './client';
import server from '../api';

export default function connect(query) {
  return DecoratedComponent => React.createClass({
    displayName: 'BicycleConnector',
    renderDecoratedComponent({dispatch, db}) {
      var q = query(this.props);

      return React.createElement(
        DecoratedComponent,
        {...getState(dispatch, db, q, server), ...this.props}
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
