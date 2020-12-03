import React, { Component, RefObject } from 'react';
import './App.css';
import { MapV2 } from './MapV2';

class App extends Component<{}, {}, null> {
  private map: RefObject<MapV2>;

  public constructor(props: {}) {
    super(props);
    this.map = React.createRef<MapV2>();
  }
  public render() {
    return (
      <div key="main">
        <MapV2 ref={ this.map } width={ 800 } height={ 600 } id={ "map1" } />
      </div>
    );
  }

  public componentDidMount() {}

}

export default App;
