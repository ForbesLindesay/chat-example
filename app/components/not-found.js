'use strict';

import React, {Component} from 'react';
import {connect} from 'react-redux';

import App from './app';

@connect(() => ({}))
export default class NotFound extends Component {
  constructor (props, context) {
    super(props, context);

    this.props.dispatch({type: 'SET_STATUS_CODE', statusCode: 404});
  }

  render() {
    return <App {...this.props} />;
  }
};
