'use strict';

import React, {Component} from 'react';
import {connect} from 'react-redux';

export default class LogIn extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {name: ''};
  }
  onChange(e) {
    this.setState({name: e.target.value});
  }
  logIn(e) {
    e.preventDefault();
    this.props.onLogIn(this.state.name);
  }
  render() {
    return (
      <form onSubmit={this.logIn.bind(this)}>
        <div className="form-group">
          <label>Channel Name</label>
          <input
            className="form-control"
            value={this.state.name}
            onChange={this.onChange.bind(this)}
            placeholder="Enter your name"
          />
        </div>
        <button className="btn btn-default">Log In</button>
      </form>
    );
  }
};
