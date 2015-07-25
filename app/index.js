'use strict';

import React from 'react';
import { Route } from 'react-router';
import dbReducer from '../bicycle/client';
import BicycleProvider from '../bicycle/provider';
import server from '../api';

import App from './components/app';

export const reducers = { db: dbReducer };
export const middleware = [];
export function wrap(getChildren) {
  return <BicycleProvider server={server}>{getChildren}</BicycleProvider>;
};
export let routes = [
  <Route path="/" component={App} />
];
