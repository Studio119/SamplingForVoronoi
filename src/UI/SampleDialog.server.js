/*
 * @Author: Kanata You 
 * @Date: 2021-01-19 17:22:48 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-02-11 21:41:13
 */

import React from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import Button from '../UI/Button.client';
import Map from './Map.client';
import { Root } from '../App.server';


const algos = ["Random Sampling", "Active BNS", "Stratified BNS", "3D BNS", "clustering", "k-means"];

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
                                    running:  false,
                                    show:     false,
                                    done:     false
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
                            flexWrap: "wrap",
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
                                      margin:       "0.8rem 0",
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
                                          background: "white",
                                          userSelect: "none"
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

                    <section key="args"
                      style={{
                        display:        "flex",
                        flexDirection:  "column",
                        alignItems:     "stretch",
                        padding:        "0.5rem 0"
                      }} >
                        <label>Arguments</label>
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
                                    <label
                                      style={{
                                        textAlign:  "center",
                                        flex:       1,
                                        userSelect: "none"
                                      }} >
                                        Sampling Rate
                                    </label>
                                    <input type="number" min="0" max="1" defaultValue="0.08"
                                      name="rate" step="0.001"
                                      style={{
                                        width:        "9.4rem",
                                        textAlign:    "center",
                                        border:       "1.4px solid",
                                        borderRadius: "1rem",
                                        flex:         1
                                      }} />
                                </label>
                              )
                            }
                            {
                              algos[this.state.algo] === "clustering" && (
                                <>
                                  <label key="n_clusters"
                                    style={{
                                      padding:  "0.4rem 1rem",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-around"
                                    }} >
                                      <label
                                        style={{
                                          textAlign:  "center",
                                          flex:       1,
                                          userSelect: "none"
                                        }} >
                                          k
                                      </label>
                                      <input type="number" min="2" max="1200" defaultValue="40"
                                        name="n_clusters" step="1"
                                        style={{
                                          width:        "9.4rem",
                                          textAlign:    "center",
                                          border:       "1.4px solid",
                                          borderRadius: "1rem",
                                          flex:         1
                                        }} />
                                  </label>
                                  <label key="r_val"
                                    style={{
                                      padding:  "0.4rem 1rem",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-around"
                                    }} >
                                      <label
                                        style={{
                                          textAlign:  "center",
                                          flex:       1,
                                          userSelect: "none"
                                        }} >
                                          r_val
                                      </label>
                                      <input type="number" min="0.01" max="1" defaultValue="0.1"
                                        name="r_val" step="0.01"
                                        style={{
                                          width:        "9.4rem",
                                          textAlign:    "center",
                                          border:       "1.4px solid",
                                          borderRadius: "1rem",
                                          flex:         1
                                        }} />
                                  </label>
                                </>
                              )
                            }
                            {
                              algos[this.state.algo] === "k-means" && (
                                <label key="n_clusters"
                                  style={{
                                    padding:  "0.4rem 1rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-around"
                                  }} >
                                    <label
                                      style={{
                                        textAlign:  "center",
                                        flex:       1,
                                        userSelect: "none"
                                      }} >
                                        k
                                    </label>
                                    <input type="number" min="2" max="1200" defaultValue="40"
                                      name="n_clusters" step="1"
                                      style={{
                                        width:        "9.4rem",
                                        textAlign:    "center",
                                        border:       "1.4px solid",
                                        borderRadius: "1rem",
                                        flex:         1
                                      }} />
                                </label>
                              )
                            }
                            {
                              algos[this.state.algo].includes("BNS") && (
                                <>
                                  <label key="Rm"
                                    style={{
                                      padding:  "0.4rem 1rem",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-around"
                                    }} >
                                      <label key="label"
                                        style={{
                                          textAlign:  "center",
                                          flex:       1,
                                          userSelect: "none"
                                        }} >
                                          R
                                      </label>
                                      <div
                                        style={{
                                          width:        "9.4rem",
                                          textAlign:    "center",
                                          border:       "1.4px solid",
                                          borderRadius: "1rem",
                                          background:   "white",
                                          flex:         1,
                                          userSelect: "none"
                                        }} >
                                          <input type="number" min="0.5" max="50" step="0.05"
                                            defaultValue={ 2 }
                                            name="Rm"
                                            style={{
                                              textAlign:  "center",
                                              border:     "none",
                                              background: "none"
                                            }} />
                                          <label key="after"
                                            style={{
                                              pointerEvents:  "none",
                                              userSelect:     "none"
                                            }} >
                                              e-4
                                          </label>
                                      </div>
                                  </label>
                                  <label key="steps"
                                    style={{
                                      padding:  "0.4rem 1rem",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-around"
                                    }} >
                                      <label
                                        style={{
                                          textAlign:  "center",
                                          flex:       1
                                        }} >
                                          N_cols
                                      </label>
                                      <input type="number" min="1" max="32" step="1"
                                        defaultValue={ 6 }
                                        name="steps"
                                        style={{
                                          width:        "9.4rem",
                                          textAlign:    "center",
                                          border:       "1.4px solid",
                                          borderRadius: "1rem",
                                          flex:         1
                                        }} />
                                  </label>
                                </>
                              )
                            }
                            {
                              algos[this.state.algo] === "Active BNS" && (
                                <label key="extending"
                                  style={{
                                    padding:  "0.4rem 1rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-around"
                                  }} >
                                    <label key="label"
                                      style={{
                                        textAlign:  "center",
                                        flex:       1,
                                        userSelect: "none"
                                      }} >
                                        extending
                                    </label>
                                    <div
                                      style={{
                                        width:        "9.4rem",
                                        textAlign:    "center",
                                        border:       "1.4px solid",
                                        borderRadius: "1rem",
                                        background:   "white",
                                        flex:         1,
                                        userSelect: "none"
                                      }} >
                                        <input type="number" min="1" max="16" step="0.1"
                                          defaultValue={ 4 }
                                          name="extending"
                                          style={{
                                            textAlign:  "center",
                                            border:     "none",
                                            background: "none"
                                          }} />
                                        <label key="after"
                                          style={{
                                            pointerEvents:  "none",
                                            userSelect:     "none"
                                          }} >
                                            px
                                        </label>
                                    </div>
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
                              const algo = algos[this.state.algo];
                              if (algo === "Random Sampling") {
                                const dataset = this.state.dataset.name;
                                const rate = parseFloat(
                                  document.getElementsByName("rate")[0].value || 0.08
                                );
                                runRandomSampling(
                                  dataset,
                                  rate,
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
                                      "Random Sampling (rate=" + rate + ")",
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
                              } else if (algo === "Active BNS") {
                                const dataset = this.state.dataset.name;
                                const Rm = parseFloat(
                                  document.getElementsByName("Rm")[0].value || "2"
                                );
                                const steps = parseInt(
                                  document.getElementsByName("steps")[0].value || "6"
                                );
                                const extending = parseInt(
                                  document.getElementsByName("extending")[0].value || "4"
                                );
                                runActiveBNS(
                                  dataset,
                                  Rm,
                                  steps,
                                  extending,
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
                                      "Active BNS (R=" + Rm + "e-4,steps=" + steps
                                        + ",extending=" + extending + ")",
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
                              } else if (algo === "Stratified BNS") {
                                const dataset = this.state.dataset.name;
                                const Rm = parseInt(
                                  document.getElementsByName("Rm")[0].value || "6"
                                );
                                const steps = parseInt(
                                  document.getElementsByName("steps")[0].value || "6"
                                );
                                runStratifiedBNS(
                                  dataset,
                                  Rm,
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
                                      "Stratified BNS (R=" + Rm + "e-4,steps=" + steps + ")",
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
                              } else if (algo === "3D BNS") {
                                const dataset = this.state.dataset.name;
                                const Rm = parseFloat(
                                  document.getElementsByName("Rm")[0].value || "6"
                                );
                                const steps = parseInt(
                                  document.getElementsByName("steps")[0].value || "6"
                                );
                                runBNS3D(
                                  dataset,
                                  Rm,
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
                                      "3D BNS (R=" + Rm + "e-4,steps=" + steps + ")",
                                      data
                                    );
                                  },
                                  reason => {
                                    this.log.current.setState({ info: reason });
                                    this.setState({
                                      show:     true,
                                      running:  true,
                                      done:     true
                                    });
                                  }
                                );
                              } else if (algo === "clustering") {
                                const dataset = this.state.dataset.name;
                                const k = parseInt(
                                  document.getElementsByName("n_clusters")[0].value || "40"
                                );
                                const rVal = parseFloat(
                                  document.getElementsByName("r_val")[0].value || "0.1"
                                );
                                runCluster(
                                  dataset,
                                  k,
                                  rVal,
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
                                      "Clustering (k=" + k + ",rVal=" + rVal + ")",
                                      data
                                    );
                                  },
                                  reason => {
                                    this.log.current.setState({ info: reason });
                                    this.setState({
                                      show:     true,
                                      running:  true,
                                      done:     true
                                    });
                                  }
                                );
                              } else if (algo === "k-means") {
                                const dataset = this.state.dataset.name;
                                const k = parseInt(
                                  document.getElementsByName("n_clusters")[0].value || "40"
                                );
                                runKMeans(
                                  dataset,
                                  k,
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
                                      "K-means (k=" + k + ")",
                                      data
                                    );
                                  },
                                  reason => {
                                    this.log.current.setState({ info: reason });
                                    this.setState({
                                      show:     true,
                                      running:  true,
                                      done:     true
                                    });
                                  }
                                );
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

const isProcessLog = log => {
  log = log.trim();
  const fitting = /\d+(\.\d+)?%/.exec(log);
  if (!fitting) {
    return false;
  }
  return fitting[0].length === log.length;
};

export class RealTimeLog extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      info: null
    };
  }

  render() {
    const isPLog = isProcessLog(this.state.info ?? "");
    return this.state.info ? (
      <section 
        style={{
          margin:     "6vh 0 1rem",
          padding:    "0.8rem 1.2rem",
          border:     "1px solid rgb(188,188,188)",
          whiteSpace: "pre",
          background: isPLog ? (
            "linear-gradient(to right, rgb(56,195,103) 2%,"
            + " rgb(56,195,103) " + this.state.info + ", #0000 " + this.state.info
            + ")"
          ) : undefined,
          ...this.props.style
        }} >
          { this.state.info }
      </section>
    ) : <></>;
  }

};

const resolveBNS = res => {
  return res.map(d => {
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
};

const readyBNS = async (dataset, output) => {
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
};

const readProcess = log => {
  let next = true;
  const loop = () => {
    axios.get("/process").then(res => {
      if (!next) {
        return;
      }
      if (res.data.status && res.data.data) {
        log(res.data.data);
      }
      setTimeout(loop, 100);
    });
  };

  setTimeout(loop, 100);

  return {
    close: () => next = false
  };
};

const runStratifiedBNS = async (dataset, Rm, nStep, output, onfulfilled, onrejected) => {
  await readyBNS(dataset, output);
  
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

  const RealTimeLog = readProcess(output);

  const sampling = await axios.get(`/sample/sb/${dataset}/${nStep}/${Rm}`);

  RealTimeLog.close();

  if (sampling.data.status) {
    output(sampling.data.message);
    const data = resolveBNS(sampling.data.data);
    onfulfilled(data);
  } else {
    onrejected(sampling.data.message);
    return;
  }
};

const runBNS3D = async (dataset, Rm, nStep, output, onfulfilled, onrejected) => {
  await readyBNS(dataset, output);
  
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

  const RealTimeLog = readProcess(output);

  const sampling = await axios.get(`/sample/b3/${dataset}/${nStep}/${Rm}`);

  RealTimeLog.close();

  if (sampling.data.status) {
    output(sampling.data.message);
    const data = resolveBNS(sampling.data.data);
    onfulfilled(data);
  } else {
    onrejected(sampling.data.message);
    return;
  }
};

const runActiveBNS = async (dataset, Rm, nStep, extending, output, onfulfilled, onrejected) => {
  await readyBNS(dataset, output);
  
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

  const RealTimeLog = readProcess(output);

  const sampling = await axios.get(`/sample/ab/${dataset}/${nStep}/${Rm}/${extending}`);

  RealTimeLog.close();

  if (sampling.data.status) {
    output(sampling.data.message);
    const data = resolveBNS(sampling.data.data);
    onfulfilled(data);
  } else {
    onrejected(sampling.data.message);
    return;
  }
};

const runRandomSampling = async (dataset, rate, output, onfulfilled, _onrejected) => {
  output("Starting sampling");

  let data = Root.getPopulation(dataset);
  const target = Math.round(data.length * rate);
  let list = [];

  await new Promise(resolve => {
    for (let i = 0; i < target; i++) {
      setTimeout(() => {
        const index = Math.floor(Math.random() * data.length);
        const item = data[index];
        list.push(item);
        data = data.slice(0, index).concat(data.slice(index + 1, data.length));
        // console.log((list.length / target * 100).toFixed(2) + "%");
        output((list.length / target * 100).toFixed(2) + "%");
        if (list.length === target) {
          resolve(list);
        }
      }, i);
    }
  });

  output("Completed");
  onfulfilled(list);
};

const runKMeans = async (dataset, k, output, onfulfilled, onrejected) => {
  output("Starting running k-means");

  const result = await axios.get(`/cluster/${dataset}/${k}`);

  if (result.data.status) {
    output(result.data.message);
    const data = result.data.data.map(d => {
      return {
        ...d,
        // value: d.label / k
      };
    });
    onfulfilled(data);
  } else {
    onrejected(result.data.message);
    return;
  }
};

const runCluster = async (dataset, k, rVal, output, onfulfilled, onrejected) => {
  output("Starting running clustering");

  const RealTimeLog = readProcess(output);

  const result = await axios.get(`/onlycluster/${dataset}/${k}/${rVal}`);

  RealTimeLog.close();

  if (result.data.status) {
    output(result.data.message);
    const data = result.data.data;
    onfulfilled(data);
  } else {
    onrejected(result.data.message);
    return;
  }
};


export default SampleDialog;
