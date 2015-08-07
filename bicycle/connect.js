'use strict';

import React, { PropTypes } from 'react';
import { connect as reduxConnect } from 'react-redux';
import { SUBSCRIBE } from './lib/constants.js';
import { getData, generateAction } from './lib/reducer.js';
import { set, remove } from './lib/writers';

export default function connect(query, write) {
  return DecoratedComponent => reduxConnect(state => ({db: state.db}))(React.createClass({
    displayName: 'BicycleConnector',

    componentWillMount() {
      this.runQuery(this.props);
    },
    componentWillReceiveProps(props) {
      this.runQuery(props);
    },
    runQuery(props) {
      if (!props.db.get('subscribed')) {
        props.dispatch({type: SUBSCRIBE});
      }
      const q = query(props);
      let action = q ? generateAction(props.db, q) : null;
      if (action) {
        props.dispatch(action);
      }
    },
    
    set(collection, id, value) {
      let action = set(collection, id, value);
      this.props.dispatch(action);
    },
    remove(collection, id) {
      let action = remove(collection, id);
      this.props.dispatch(action);
    },
    
    renderDecoratedComponent() {
      const q = query(this.props);
      let result = q ? getData(this.props.db, q) : {};
      let writers = {
        set: this.set,
        remove: this.remove
      };
      let customWriters = write && write(writers, this.props);
      customWriters = customWriters || {};

      return React.createElement(
        DecoratedComponent,
        {...writers, ...customWriters, ...result, ...this.props}
      );
    },
    render() {
      return this.renderDecoratedComponent();
    }
  }));
}
