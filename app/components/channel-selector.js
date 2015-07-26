'use strict';

import React from 'react';
import connect from '../../bicycle/connect';
import { Link } from 'react-router';

@connect(props => ({
  channels: {}
}))
export default class ChannelSelector {
  render() {
    if (this.props.channels) {
      return (
        <ul>
          {
            this.props.channels.map(channel => (
              <li key={channel.id}>
                <Link to={"/" + channel.id}>{channel.name}</Link>
              </li>
            ))
          }
        </ul>
      );
    } else {
      return (<div>Loading Channels...</div>);
    }
  }
};
