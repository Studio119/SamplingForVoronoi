import React, { Component, RefObject } from 'react';
import './App.css';
import { AxiosResponse } from 'axios';
import axios from 'axios';
import { DataItem } from './TypeLib';
import { KanataMap } from './KanataMap';
import { ControlPanel } from './ControlPanel';
import { System } from './System';

class App extends Component<{}, {}, null> {
  private map: RefObject<KanataMap>;
  protected panel: RefObject<ControlPanel>;

  public constructor(props: {}) {
    super(props);
    this.map = React.createRef<KanataMap>();
    this.panel = React.createRef<ControlPanel>();
  }
  public render() {
    return (
      <div key="main">
        <ControlPanel ref={ this.panel } width={ 2000 } height={ 30 } padding={ [8, 5] } 
        mapViewChange={ this.mapViewChange.bind(this) } merge={ this.merge.bind(this) } ifSample={ this.ifSample.bind(this) } />
        <KanataMap ref={ this.map } width={ 1000 } height={ 800 } 
          accessToken={ "pk.eyJ1Ijoid2VueWFyaSIsImEiOiJjazZnNXZ1aW0wNHU2M2twbXMxczQzd25uIn0.OoaoN7EvcR7P7aC3AQWu4g" } 
          id={ "map1" }

        />
      </div>
    );
  }

  public componentDidMount() {
    // const p: Promise<AxiosResponse<Array<{lat: number; lng: number; value: number;}>>> = axios.get('/oridata');
    // p.then((value: AxiosResponse<Array<{lat: number; lng: number; value: number;}>>) => {
    const p: Promise<AxiosResponse<Array<DataItem>>> = axios.get('/oridata');
    p.then((value: AxiosResponse<Array<DataItem>>) => {
    // const p: Promise<AxiosResponse<Array<datumType<censusType>>>> = axios.get('/oridata');
    // p.then((value: AxiosResponse<Array<datumType<censusType>>>) => {
        const o: Promise<AxiosResponse<Array<{id: number; label: number}>>> = axios.get('/kmeans');
        const c: Promise<AxiosResponse<Array<DataItem>>> = axios.get('/bns');
        c.then(valuec => {
          o.then((value3: AxiosResponse<Array<{id: number; label: number}>>) => {
              System.origin = value.data;
              System.sample = valuec.data;

              this.map.current!.loada(value.data);
              this.map.current!.loadLabels(value3.data);
        });
      });
    });
  }

  private mapViewChange(): void {
    this.map.current!.forceUpdate();
  }

  private ifSample(): void {
    if(System.sampled)
      this.map.current!.loada(System.sample);
    else
      this.map.current!.loada(System.origin);
  }

  private merge(): void {
    const p = axios.get('/merge/' + System.params.classes);
    p.then(value => {
      console.log(1)
      this.map.current!.loadLabels(value.data);
    });
  }
}

export default App;
