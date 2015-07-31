'use strict';

import React, { PropTypes } from 'react';
import { connect as reduxConnect } from 'react-redux';
import { getData, generateAction } from './lib/reducer.js';

export default function connect(query) {
  return DecoratedComponent => reduxConnect(state => ({db: state.db}))(React.createClass({
    displayName: 'BicycleConnector',

    contextTypes: {
      bicycleServer: PropTypes.func.isRequired
    },

    componentWillMount() {
      this.runQuery(this.props);
    },
    componentWillReceiveProps(props) {
      this.runQuery(props);
    },
    runQuery(props) {
      const q = query(props);
      let action = q ? generateAction(props.db, q) : null;
      if (action) {
        props.dispatch(action);
        props.dispatch(this.context.bicycleServer(action));
      }
    }
    },
    
    renderDecoratedComponent() {
      const q = query(this.props);
      let result = q ? getData(this.props.db, q) : {};

      return React.createElement(
        DecoratedComponent,
        {...result, ...this.props}
      );
    },
    render() {
      return this.renderDecoratedComponent();
    }
  }));
}
