/*
 * @Author: Antoine YANG 
 * @Date: 2020-08-20 22:51:17 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-19 01:06:08
 */

import React, { Component } from 'react';
import axios from "axios";
import './App.css';
import { NodeView } from './Comp/NodeView';
import { SamplingView } from './Comp/SamplingView';
import { ControlStrip } from './Comp/ControlStrip';
import { EnvCheckor } from './Comp/EnvCheckor';
import { Waiting } from './Comp/Waiting';


class App extends Component {

  public constructor(props: {}) {
    super(props);
  }

  public render(): JSX.Element {
    const AppNodeView = React.forwardRef<NodeView>(() => (
      // @ts-ignore
      <NodeView
      id="map0" width={ 767 } height={ 500 } title="Node View" />
    ));
    const AppScatterView3d = React.forwardRef<SamplingView>(() => (
      // @ts-ignore
      <SamplingView
      id="map1" width={ 767 } height={ 500 } title="Sampling View" />
    ));

    return (
      <div className="App" >
        <ControlStrip />
        <div key="maps" style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100vw"
        }} >
          <AppNodeView />
          <AppScatterView3d />
        </div>
        <Waiting />
        <EnvCheckor checkors={[
          (fulfill: (res: any) => void, reject: (reason: any) => void) => {
            axios.get("/checkcondaenv/0").then(res => {
              if (res.data.status) {
                fulfill(res.data.message);
              } else {
                reject(res.data.message);
              }
            }).catch(err => {
              if (err.message?.includes("Request failed with status code 500")) {
                // 服务器未响应
                reject("Failed to connect to back-end server.");
              } else {
                reject(JSON.stringify(err));
              }
            });
          },
          (fulfill: (res: any) => void, reject: (reason: any, fixable?: (
            fulfill: (res: any) => void, reject: (reason: any) => void
          ) => void) => void) => {
            axios.get("/checkcondaenv/1").then(res => {
              if (res.data.status) {
                fulfill(res.data.message);
              } else {
                reject(res.data.message, res.data.autofix ? (af_fulfill, af_reject) => {
                  axios.get("/autofix").then(response => {
                    if (response.data.status) {
                      af_fulfill(response.data.message);
                    } else {
                      console.error(response);
                      af_reject("Response timeout.");
                    }
                  }).catch(() => {
                    af_reject("Response timeout.");
                  });
                } : undefined);
              }
            }).catch(err => {
              reject(JSON.stringify(err));
            });
          }
        ]} />
      </div>
    );
  }

}

export default App;
