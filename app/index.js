'use strict';

import React from 'react';
import { Route, NotFoundRoute } from 'react-router';
import dbReducer from '../bicycle/client';
import BicycleProvider from '../bicycle/provider';
import server from '../api';

import App from './components/app';
import ChannelCreator from './components/channel-creator';
import Channel from './components/channel';
import NotFound from './components/not-found';

export const reducers = { db: dbReducer };
export const middleware = [];
export function wrap(getChildren) {
  return <BicycleProvider server={server}>{getChildren}</BicycleProvider>;
};
export let routes = [
  <Route component={App}>
    <Route path="/" component={ChannelCreator} />
    <Route path="/:channel" component={Channel} />
  </Route>,
  <Route path="*" component={NotFound} />
];
