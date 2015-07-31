'use strict';

import React from 'react';
import connect from '../../bicycle/connect';

@connect(props => ({channels: {filter: {id: props.params.channel}}}))
export default class ChannelSelector {
  render() {
    if (!this.props.loaded) {
      return <div>Loading...</div>;
    }
    if (!this.props.channels.length) {
      this.props.dispatch({type: 'SET_STATUS_CODE', statusCode: 404});
      return <div>Channel not found</div>;
    }
    return (
      <h1>{this.props.channels[0].name}</h1>
    );
  }
};
