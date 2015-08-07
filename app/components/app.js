'use strict';

import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import ChannelSelector from './channel-selector';
import LogIn from './log-in';

@connect(state => ({user: state.user}))
export default class App {
  render() {
    if (!this.props.user) {
      return <LogIn onLogIn={name => this.props.dispatch({type: 'LOG_IN', name: name})} />;
    }
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
