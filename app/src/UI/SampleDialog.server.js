/*
 * @Author: Kanata You 
 * @Date: 2021-01-19 17:22:48 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-20 20:18:16
 */

import React from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import Button from '../UI/Button.client';
import Map from './Map.client';
import { Root } from '../App.server';


const algos = ["Random Sampling", "Stratified BNS", "3D BNS"];

class SampleDialog extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      running: false,
      done:   false,
      show: false,
      algo: 0,
      dataset: null
    };

    this.log = React.createRef();
  }

  render() {
    return createPortal(
      this.state.show &&
      <div
        style={{
          position: "fixed",
          left:     0,
          top:      0,
          width:    "100vw",
          height:   "100vh",
          zIndex:   999999,
          display:  "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.2)"
        }} >
          <div key="dialog"
            style={{
              width:      "600px",
              padding:    "4vh 3vw",
              minHeight:  "320px",
              background: "rgb(248,249,253)",
              display:    "flex",
              flexDirection:  "column",
              alignItems: "stretch",
              justifyContent: "center",
              transition: "all 0.6s"
            }} >
              {
                this.state.running ? (
                  <>
                    {
                      this.state.done || (
                        <div
                          style={{
                            display:  "flex",
                            justifyContent: "center"
                          }} >
                            <div className="loading"
                              style={{
                                width:  "8vmin",
                                height: "8vmin",
                                borderRadius: "4vmin",
                                borderLeft: "4px solid rgba(156,220,254,0.64)",
                                borderTop: "4px solid rgba(156,220,254,1)",
                                borderRight: "4px solid rgba(156,220,254,0.22)",
                                borderBottom: "4px solid rgba(156,220,254,0.44)"
                              }} />
                        </div>
                      )
                    }
                    <RealTimeLog ref={ this.log } />
                    {
                      this.state.done && (
                        <section key="run"
                          style={{
                            display:        "flex",
                            alignItems:     "stretch",
                            justifyContent: "space-around",
                            padding:        "2rem 0 1rem"
                          }} >
                            <Button key="cancel"
                              listener={
                                () => {
                                  this.setState({
                                    running: false,
                                    show: false
                                  });
                                }
                              }
                              style={{
                                margin: "6px 0.8rem",
                                padding:  "0.4rem",
                                width:  "128px"
                              }} >
                                Exit
                            </Button>
                        </section>
                      )
                    }
                  </>
                ) : (
                  <>
                    <section key="algo"
                      style={{
                        display:        "flex",
                        flexDirection:  "column",
                        alignItems:     "stretch",
                        padding:        "0.5rem 0"
                      }} >
                        <label>Algorithm</label>
                        <section
                          style={{
                            display: "flex",
                            alignItems: "stretch",
                            justifyContent: "space-between",
                            padding: "4px 1rem"
                          }} >
                            {
                              algos.map((d, i) => {
                                return (
                                  <div key={ d } style={{
                                      textAlign:    "center",
                                      display:      "flex",
                                      borderRadius: "1.2rem 1.2rem 0rem 1.2rem",
                                      color:        i === this.state.algo
                                                    ? "rgb(44,122,214)" : "rgb(200,200,200)",
                                      background: i === this.state.algo
                                                    ? "rgb(44, 122, 214)" : undefined
                                    }} >
                                      <label
                                        style={{
                                          padding:  "0.4rem 0.4rem",
                                          width:    "9.4rem",
                                          border:   "1.4px solid",
                                          borderRadius: "1.2rem",
                                          cursor:   "pointer",
                                          background: "white"
                                        }}
                                        onClick={
                                          () => {
                                            if (i !== this.state.algo) {
                                              this.setState({
                                                algo: i
                                              });
                                            }
                                          }
                                        } >
                                          { d }
                                      </label>
                                  </div>
                                );
                              })
                            }
                      </section>
                    </section>

                    <section key="params"
                      style={{
                        display:        "flex",
                        flexDirection:  "column",
                        alignItems:     "stretch",
                        padding:        "0.5rem 0"
                      }} >
                        <label>Params</label>
                        <section
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            padding: "4px 1rem"
                          }} >
                            {
                              algos[this.state.algo] === "Random Sampling" && (
                                <label key="rate"
                                  style={{
                                    padding:  "0.4rem 1rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-around"
                                  }} >
                                    <label>Sampling Rate</label>
                                    <input type="number" min="0" max="1" placeholder="0.2"
                                      name="rate"
                                      style={{
                                        width:    "9.4rem",
                                        textAlign:  "center",
                                        border:   "1.4px solid",
                                        borderRadius: "1rem"
                                      }} />
                                </label>
                              )
                            }
                            {
                              (
                                algos[this.state.algo] === "Stratified BNS"
                                || algos[this.state.algo] === "3D BNS"
                              ) && (
                                <label key="steps"
                                  style={{
                                    padding:  "0.4rem 1rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-around"
                                  }} >
                                    <label>N_steps</label>
                                    <input type="number" min="0" max="1"
                                      placeholder={
                                        algos[this.state.algo] === "Stratified BNS" ? 6 : 8
                                      }
                                      name="steps"
                                      style={{
                                        width:    "9.4rem",
                                        textAlign:  "center",
                                        border:   "1.4px solid",
                                        borderRadius: "1rem"
                                      }} />
                                </label>
                              )
                            }
                      </section>
                    </section>
                    
                    <section key="run"
                      style={{
                        display:        "flex",
                        alignItems:     "stretch",
                        justifyContent: "space-around",
                        padding:        "2rem 0 1rem"
                      }} >
                        <Button key="run"
                          listener={
                            () => {
                              // TODO
                              if (this.log.current) {
                                this.log.current.setState({ info: null });
                              }
                              if (this.state.algo === 0) {
                                // Random Sampling
                                console.log("RUN");
                              } else if (this.state.algo === 1) {
                                // Stratified BNS
                                const dataset = this.state.dataset.name;
                                const steps = parseInt(
                                  document.getElementsByName("steps")[0].value
                                  || document.getElementsByName("steps")[0].placeholder
                                );
                                runStratifiedBNS(
                                  dataset,
                                  steps,
                                  info => {
                                    if (this.log.current) {
                                      this.log.current.setState({ info });
                                    }
                                  },
                                  data => {
                                    this.setState({
                                      show:     true,
                                      running:  true,
                                      done:     true
                                    });
                                    Root.pushSample(
                                      dataset,
                                      "Stratified BNS (steps=" + steps + ")",
                                      data
                                    );
                                  },
                                  reason => {
                                    console.log("rejected", reason);
                                    this.setState({
                                      show:     true,
                                      running:  true,
                                      done:     true
                                    });
                                  }
                                );
                              } else if (this.state.algo === 2) {
                                // 3D BNS
                                console.log("RUN");
                              }
                              setTimeout(() => {
                                this.setState({
                                  running:  true,
                                  done:     false
                                });
                              }, 0);
                            }
                          }
                          style={{
                            margin: "6px 0.8rem",
                            padding:  "0.4rem",
                            width:  "128px"
                          }} >
                            Run
                        </Button>
                        <Button key="cancel"
                          listener={
                            () => {
                              this.setState({
                                running: false,
                                show: false
                              });
                            }
                          }
                          style={{
                            margin: "6px 0.8rem",
                            padding:  "0.4rem",
                            width:  "128px"
                          }} >
                            Cancel
                        </Button>
                    </section>
                  </>
                )
              }
          </div>
      </div>
    , document.body);
  }

  componentDidUpdate() {
    document.getElementsByClassName("main")[0].style.filter = this.state.show ? "blur(2px)" : "none";
  }

};

class RealTimeLog extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      info: null
    };
  }

  render() {
    return this.state.info ? (
      <section 
        style={{
          margin:     "6vh 0 1rem",
          padding:    "0.8rem 1.2rem",
          border:     "1px solid rgb(188,188,188)",
          whiteSpace: "pre"
        }} >
          { this.state.info }
      </section>
    ) : <></>;
  }

};

const runStratifiedBNS = async (dataset, nStep, output, onfulfilled, onrejected) => {
  output("Locating canvas");

  await new Promise((resolve, _reject) => {
    const loop = () => {
      output("Locating canvas");
      if (Root.openChart(dataset, "total")) {
        resolve(true);
      } else {
        setTimeout(loop, 200);
      }
    };
    setTimeout(loop, 200);
  });

  await Map.waitTillReady();
  
  output("Taking snapshot");

  const snapshot = await Map.takeSnapshot();

  output("Starting calculating KDE");

  const kde = await axios.post(
    `/snapshot`, {
      name: dataset,
      data: snapshot
    }
  );

  if (kde.data.status) {
    output(kde.data.message);
  } else {
    onrejected(kde.data.message);
    return;
  }
  
  output("Starting sampling");

  const sampling = await axios.get(`/sample/sb/${dataset}/${nStep}`);

  if (sampling.data.status) {
    output(sampling.data.message);
    const data = sampling.data.data.map(d => {
      const radius = d.radius * 1.248; // 单位偏差

      const cx = d.lng;
      const cy = d.lat;
      
      const center = Map.project(cx, cy);
      const ru = Map.project(cx + 0.0001, cy);

      const dx = radius / (ru.x - center.x) * 0.0001;
      let ly = dx;
      let uu = Map.project(cx, cy + ly);
      // 迭代逼近
      for (let i = 0; i < 10; i++) {
        const dist = center.y - uu.y;
        const rate = dist / radius;
        if (rate > 0.99 && rate < 1.01) {
          // 足够逼近
          break;
        } else {
          ly /= rate;
          uu = Map.project(cx, cy + ly);
        }
      }
      const tu = ly;
      ly = dx;
      let du = Map.project(cx, cy - ly);
      // 迭代逼近
      for (let i = 0; i < 10; i++) {
        const dist = du.y - center.y;
        const rate = dist / radius;
        if (rate > 0.99 && rate < 1.01) {
          // 足够逼近
          break;
        } else {
          ly /= rate;
          du = Map.project(cx, cy - ly);
        }
      }
      const td = ly;

      return {
        diskId:   d.diskId,
        children: d.children,
        averVal:  d.averVal,
        id:       d.id,       // 这个 id 是采样点在原始列表的索引，和数据的 id 无关
        lat:      cy,
        lng:      cx,
        value:    d.value,
        bounds:   [ [ cx + dx, cy - td ], [ cx - dx, cy + tu ] ]
      };
    });
    onfulfilled(data);
  } else {
    onrejected(sampling.data.message);
    return;
  }
};

export default SampleDialog;
