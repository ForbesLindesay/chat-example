'use strict';

import React, {Component} from 'react';
import connect from '../../bicycle/connect';

@connect(
  (props) => (
    {
      channels: {filter: {id: props.params.channel}},
      messages: {filter: {channel: props.channel}}
    }
  ),
  ({set, remove}, props) => (
    {
      sendMessage(message) {
        var id = (new Date()).toISOString();
        return set('messages', id, {id, body: message, channel: props.channel});
      }
    }
  )
)
export default class ChannelSelector extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {message: ''};
  }
  onChange(e) {
    this.setState({
      message: e.target.value
    });
  }
  sendMessage(e) {
    e.preventDefault();
    this.props.sendMessage(this.state.message);
    this.setState({
      message: ''
    });
  }
  render() {
    if (!this.props.loaded) {
      return <div>Loading...</div>;
    }
    if (!this.props.channels.length) {
      this.props.dispatch({type: 'SET_STATUS_CODE', statusCode: 404});
      return <div>Channel not found</div>;
    }
    return (
      <div>
        <h1>{this.props.channels[0].name}</h1>
        <ul>{this.props.messages.map(message => <li key={message.id}>{message.body}</li>)}</ul>
        <form>
          <input className="form-control" value={this.state.message} onChange={this.onChange.bind(this)}/>
          <button className="btn btn-default" onClick={this.sendMessage.bind(this)}>Create</button>
        </form>
      </div>
    );
  }
};
