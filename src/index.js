'use strict';

import React from 'react';
import { Route } from 'react-router';
import * as rs from './reducer';
import App from './containers/App';
import UserPage from './containers/UserPage';
import RepoPage from './containers/RepoPage';

export const reducers = rs;

export const routes = [
  <Route path="/" component={App}>
    <Route path="/:login/:name"
           component={RepoPage} />
    <Route path="/:login"
           component={UserPage} />
  </Route>
];
