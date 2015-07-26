'use strict';

import React, { Component } from 'react';
import connect from '../../bicycle/connect';

@connect(
  props => undefined,
  write => (
    {
      createChannel(id, name) {
        write([
          {collection: 'channels', id: id, value: {id, name}}
        ]);
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
    this.setState({name: e.target.name});
  }
  create(e) {
    e.preventDefault();
    this.props.createChannel(id, name).done(function () {
    });
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
            <input className="form-control" value={this.state.name} onChange={this.onChange}/>
          </div>
          <button className="btn btn-default" onClick={this.create}>Create</button>
        </form>
      </div>
    );
  }
};
