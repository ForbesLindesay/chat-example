'use strict';

import React from 'react';
import connect from '../../bicycle/connect';

@connect(props => ({
  channels: {}
}))
export default class App {
  render() {
    if (this.props.channels) {
      return (
        <ul>
          {
            this.props.channels.map(channel => (
              <li key={channel.id}>{channel.name}</li>
            ))
          }
        </ul>
      );
    } else {
      return (<div>Loading Channels...</div>);
    }
  }
};
