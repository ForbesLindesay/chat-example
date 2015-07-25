'use strict';

import React from 'react';
import { Route } from 'react-router';
import db from '../bicycle/client';
import App from './components/app';

export const reducers = { db };
export const middleware = [];
export let routes = [
  <Route path="/" component={App} />
];
