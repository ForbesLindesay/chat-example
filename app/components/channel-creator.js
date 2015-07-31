'use strict';

import React, { Component } from 'react';
import connect from '../../bicycle/connect';

@connect(
  props => undefined,
  ({set, remove}) => (
    {
      createChannel(id, name) {
        set('channels', id, {id, name});
      }
    }
  )
)
export default class ChannelSelector extends Component{
  constructor(props, context) {
    super(props, context);
    this.state = {
      name: ''
    };
  }
  onChange(e) {
    this.setState({name: e.target.value});
  }
  create(e) {
    e.preventDefault();
    let name = this.state.name;
    let id = name.toLowerCase().replace(/[^a-z]/g, '');
    this.props.createChannel(id, name);
  }
  render() {
    return (
      <div>
        <h1>Welcome</h1>
        <p>
          To get started, either select a channel from the menue on the right hand side,
          or use the form below to create a new channel.
        </p>
        <form>
          <h2>New Channel</h2>
          <div className="form-group">
            <label>Channel Name</label>
            <input className="form-control" value={this.state.name} onChange={this.onChange.bind(this)}/>
          </div>
          <button className="btn btn-default" onClick={this.create.bind(this)}>Create</button>
        </form>
      </div>
    );
  }
};
