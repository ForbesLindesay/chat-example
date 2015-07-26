'use strict';

import React from 'react';
import connect from '../../bicycle/connect';

@connect(props => ({channels: {id: props.params.channel}}))
export default class ChannelSelector {
  render() {
    if (this.props.loading) {
      return <div>Loading...</div>;
    }
    return (
      <h1>{this.props.channels[0].name}</h1>
    );
  }
};
