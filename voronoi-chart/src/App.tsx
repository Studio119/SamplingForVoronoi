/*
 * @Author: Wenyari 
 * @Date: 2020-12-06 14:58:33 
 * @Last Modified by: Wenyari
 * @Last Modified time: 2020-12-06 15:02:35
 */

import React, { Component } from 'react';
import './App.css';
import { Switch, Route, HashRouter } from 'react-router-dom';
import Home from './Home';
import VoronoiChart from './VoronoiChart';

class App extends Component<{}, {}> {
  public constructor(props: {}) {
    super(props);
    this.state = {};
  }

  public render(): JSX.Element {
    return (
      <div className="App">
        <HashRouter>
          <Switch>
            <Route path="/" exact component={ Home } />
            <Route path="/wj" exact component={ VoronoiChart } />
          </Switch>
        </HashRouter>
      </div>
    );
  }
}


export default App;
