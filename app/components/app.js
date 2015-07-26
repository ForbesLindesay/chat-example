'use strict';

import React from 'react';
import { Link } from 'react-router';
import ChannelSelector from './channel-selector';

export default class App {
  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-2">
            <ul>
              <li><Link to="/">New Channel</Link></li>
            </ul>
            <ChannelSelector />
          </div>
          <div className="col-md-10">
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
};
