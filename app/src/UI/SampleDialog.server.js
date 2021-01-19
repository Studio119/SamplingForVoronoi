/*
 * @Author: Kanata You 
 * @Date: 2021-01-19 17:22:48 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-19 21:48:19
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
                                borderLeft: "4px solid rgba(156,220,254,0.56)",
                                borderTop: "4px solid rgba(156,220,254,1)",
                                borderRight: "4px solid rgba(156,220,254,0.2)",
                                borderBottom: "4px solid rgba(156,220,254,0.4)"
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
                                  <label key={ d }
                                    style={{
                                      padding:  "0.4rem 0.4rem",
                                      width:    "9.4rem",
                                      textAlign:  "center",
                                      border:   "1.4px solid",
                                      borderRadius: "1rem",
                                      cursor:   "pointer",
                                      color:    i === this.state.algo
                                                  ? "rgb(44,122,214)" : "rgb(200,200,200)"
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
    if (this.log.current) {
      this.log.current.setState({ info: null });
    }
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
  const snapshot = Map.takeSnapshot();

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
    onfulfilled(sampling.data.data);
  } else {
    onrejected(sampling.data.message);
    return;
  }
};

export default SampleDialog;
