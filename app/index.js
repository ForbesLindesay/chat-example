'use strict';

import React from 'react';
import { Route, NotFoundRoute } from 'react-router';
import dbReducer from '../bicycle/reducer';

import App from './components/app';
import ChannelCreator from './components/channel-creator';
import Channel from './components/channel';
import NotFound from './components/not-found';

export const reducers = { db: dbReducer };
export const middleware = [];

export let routes = [
  <Route component={App}>
    <Route path="/" component={ChannelCreator} />
    <Route path="/:channel" component={Channel} />
  </Route>,
  <Route path="*" component={NotFound} />
];
