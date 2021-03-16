/*
 * @Author: Kanata You 
 * @Date: 2021-02-02 17:41:34 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-03-16 14:22:49
 */

import React from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import Button from '../UI/Button.client';
// import Map from './Map.client';
// import { Root } from '../App.server';
import { RealTimeLog } from './SampleDialog.server';
import { Root } from '../App.server';


const pages = ["Storage", "Voronoi diagram"];

class Settings extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      show: false,
      running: false,
      idx:  0,
      storeBorders: Root.storeBorders
    };

    this.storageSelected = {
      0: false,
      1: false,
      2: false
    };

    this.log = React.createRef();
  }

  static getDerivedStateFromProps() {
    const storeBorders = Root.storeBorders;
    return { storeBorders };
  }

  close() {
    if (!this.state.running) {
      this.setState({
        show: false
      });
    }
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
        }}
        onClick={ this.close.bind(this) } >
          <div key="dialog"
            style={{
              minWidth:   "600px",
              padding:    "4vh 3vw 1vh",
              minHeight:  "320px",
              background: "rgb(248,249,253)",
              display:    "flex",
              flexDirection:  "column",
              alignItems: "stretch",
              justifyContent: "center",
              transition: "all 0.6s"
            }}
            onClick={
              e => e.stopPropagation()
            } >
              <section key="body"
                style={{
                  flex:       1,
                  display:    "flex",
                  alignItems: "stretch",
                  justifyContent: "center",
                }} >
                  <section key="tabs"
                    style={{
                      background:     "rgba(52,103,176,0.3)",
                      display:        "flex",
                      flexDirection:  "column",
                      alignItems:     "stretch",
                      textAlign:      "center"
                    }} >
                      {
                        pages.map((page, i) => {
                          return (
                            <label key={ page } tabIndex={ 1 }
                              style={{
                                cursor:     i === this.state.idx ? undefined : "pointer",
                                padding:    i === this.state.idx
                                              ? "0.2rem 6px 0.2rem 22px" : "0.2rem 14px",
                                textAlign:  i === this.state.idx
                                              ? "right" : "center",
                                background: i === this.state.idx
                                              ? "rgb(228,235,245)" : undefined
                              }}
                              onClick={
                                () => {
                                  if (i !== this.state.idx) {
                                    this.setState({
                                      idx:  i
                                    });
                                  }
                                }
                              } >
                                { page }
                            </label>
                          );
                        })
                      }
                  </section>
                  <section key="page"
                    style={{
                      flex:           1,
                      background:     "rgba(52,103,176,0.1)",
                      display:        "flex",
                      flexDirection:  "column",
                      alignItems:     "stretch",
                      padding:        "4px 1rem",
                      maxWidth:       "400px"
                    }} >
                      {
                        pages[this.state.idx] === "Storage" ? (
                          <>
                            <header key="stat"
                              style={{
                                fontWeight: "bold"
                              }} >
                                Storage
                            </header>
                            <AsyncComponent key={ this.state.running }
                              waiting={(
                                <label key="stat-val" >
                                  reading...
                                </label>
                              )} >
                                {
                                  async () => {
                                    const data = await readStorage();
                                    if (!data) {
                                      return;
                                    }
                                    this.storageSelected = {
                                      0: false,
                                      1: false,
                                      2: false,
                                      3: false
                                    };
                                    const updateStorage = e => {
                                      this.storageSelected = {
                                        0:  document.getElementsByName("cb0")[0].checked,
                                        1:  document.getElementsByName("cb1")[0].checked,
                                        2:  document.getElementsByName("cb2")[0].checked,
                                        3:  document.getElementsByName("cb3")[0].checked
                                      };
                                      const tr = e.target.parentNode.parentNode.parentNode
                                                  .querySelectorAll("tr")[5];
                                      let count = 0;
                                      let size = 0;
                                      for (let i = 0; i < 4; i++) {
                                        if (this.storageSelected[i]) {
                                          count += data[i][0];
                                          size += data[i][1];
                                        }
                                      }
                                      tr.children[2].innerText = count;
                                      tr.children[3].innerText = parseSize(size);
                                      const button = document.getElementById("clearStorage");
                                      button.style.display = count ? "flex" : "none";
                                    };
                                    return (
                                      <>
                                        <table key="stat-val"
                                          style={{
                                            fontSize:   "92%",
                                            textAlign:  "center",
                                            lineHeight: 1.4,
                                            margin:     "0.4em 1rem"
                                          }} >
                                            <tbody>
                                              <tr>
                                                <th></th>
                                                <th>Type</th>
                                                <th>Count</th>
                                                <th>Size</th>
                                              </tr>
                                              <tr tabIndex={ 1 }
                                                onClick={
                                                  e => {
                                                    let tr = e.target;
                                                    while (tr.tagName !== "TR") {
                                                      tr = tr.parentElement;
                                                    }
                                                    const checkbox = tr.children[0].children[0];
                                                    checkbox.click();
                                                  }
                                                }
                                                style={{
                                                  cursor: "pointer"
                                                }} >
                                                  <td>
                                                    <input type="checkbox" name="cb0"
                                                      onChange={ updateStorage }
                                                      style={{
                                                        cursor: "pointer"
                                                      }}
                                                      onClick={
                                                        e => e.stopPropagation()
                                                      } />
                                                  </td>
                                                  <td>Snapshot</td>
                                                  <td>{ data[0][0] }</td>
                                                  <td>{ parseSize(data[0][1]) }</td>
                                              </tr>
                                              <tr tabIndex={ 1 }
                                                onClick={
                                                  e => {
                                                    let tr = e.target;
                                                    while (tr.tagName !== "TR") {
                                                      tr = tr.parentElement;
                                                    }
                                                    const checkbox = tr.children[0].children[0];
                                                    checkbox.click();
                                                  }
                                                }
                                                style={{
                                                  cursor: "pointer"
                                                }} >
                                                  <td>
                                                    <input type="checkbox" name="cb1"
                                                      onChange={ updateStorage }
                                                      style={{
                                                        cursor: "pointer"
                                                      }}
                                                      onClick={
                                                        e => e.stopPropagation()
                                                      } />
                                                  </td>
                                                  <td>Kde</td>
                                                  <td>{ data[1][0] }</td>
                                                  <td>{ parseSize(data[1][1]) }</td>
                                              </tr>
                                              <tr tabIndex={ 1 }
                                                onClick={
                                                  e => {
                                                    let tr = e.target;
                                                    while (tr.tagName !== "TR") {
                                                      tr = tr.parentElement;
                                                    }
                                                    const checkbox = tr.children[0].children[0];
                                                    checkbox.click();
                                                  }
                                                }
                                                style={{
                                                  cursor: "pointer"
                                                }} >
                                                  <td>
                                                    <input type="checkbox" name="cb2"
                                                      onChange={ updateStorage }
                                                      style={{
                                                        cursor: "pointer"
                                                      }}
                                                      onClick={
                                                        e => e.stopPropagation()
                                                      }  />
                                                  </td>
                                                  <td>Grouping</td>
                                                  <td>{ data[2][0] }</td>
                                                  <td>{ parseSize(data[2][1]) }</td>
                                              </tr>
                                              <tr tabIndex={ 1 }
                                                onClick={
                                                  e => {
                                                    let tr = e.target;
                                                    while (tr.tagName !== "TR") {
                                                      tr = tr.parentElement;
                                                    }
                                                    const checkbox = tr.children[0].children[0];
                                                    checkbox.click();
                                                  }
                                                }
                                                style={{
                                                  cursor: "pointer"
                                                }} >
                                                  <td>
                                                    <input type="checkbox" name="cb3"
                                                      onChange={ updateStorage }
                                                      style={{
                                                        cursor: "pointer"
                                                      }}
                                                      onClick={
                                                        e => e.stopPropagation()
                                                      }  />
                                                  </td>
                                                  <td>Sample</td>
                                                  <td>{ data[3][0] }</td>
                                                  <td>{ parseSize(data[3][1]) }</td>
                                              </tr>
                                              <tr
                                                style={{
                                                  lineHeight: 1.4,
                                                  fontStyle:  "italic"
                                                }} >
                                                  <td></td>
                                                  <td>selected</td>
                                                  <td>0</td>
                                                  <td>0B</td>
                                              </tr>
                                            </tbody>
                                        </table>
                                        <div key="clearStorage" id="clearStorage"
                                          style={{
                                            display:    "none",
                                            justifyContent: "space-between",
                                            alignItems:     "baseline",
                                            padding:    "0 2rem"
                                          }} >
                                            <label
                                              style={{
                                                flex:     1,
                                                padding:  "0 1rem"
                                              }} >
                                                <RealTimeLog ref={ this.log }
                                                  style={{
                                                    margin:   0,
                                                    padding:  0,
                                                    border:   "none",
                                                    whiteSpace: "normal",
                                                    lineHeight: 1.2,
                                                    fontSize:   "90%"
                                                  }} />
                                            </label>
                                            {
                                              this.state.running || (
                                                <Button
                                                  listener={
                                                    () => {
                                                      const config = [
                                                        document.getElementsByName("cb0")[0]
                                                          .checked ? 1 : 0,
                                                        document.getElementsByName("cb1")[0]
                                                          .checked ? 1 : 0,
                                                        document.getElementsByName("cb2")[0]
                                                          .checked ? 1 : 0,
                                                        document.getElementsByName("cb3")[0]
                                                          .checked ? 1 : 0
                                                      ];
                                                      clearStorage(
                                                        config,
                                                        info => {
                                                          if (this.log.current) {
                                                            this.log.current.setState({ info });
                                                          }
                                                        },
                                                        _res => {},
                                                        info => {
                                                          if (this.log.current) {
                                                            this.log.current.setState({
                                                              info: "Error Occurred: " + info.toString()
                                                            });
                                                          }
                                                        }
                                                      ).finally(() => {
                                                        setTimeout(() => {
                                                          this.setState({
                                                            running:  false
                                                          });
                                                        }, 200);
                                                      });
                                                      this.setState({
                                                        running:  true
                                                      });
                                                    }
                                                  }
                                                  style={{
                                                    padding:  "0 1rem"
                                                  }} >
                                                    clear
                                                </Button>
                                              )
                                            }
                                        </div>
                                      </>
                                    );
                                  }
                                }
                            </AsyncComponent>
                          </>
                        ) : pages[this.state.idx] === "Voronoi diagram" ? (
                          <>
                            <header key="stat"
                              style={{
                                fontWeight: "bold"
                              }} >
                                Voronoi borders
                            </header>
                            <table key="stat-val"
                              style={{
                                fontSize:   "92%",
                                textAlign:  "center",
                                lineHeight: 1.4,
                                margin:     "0.4em 0.2rem"
                              }} >
                                <tbody>
                                  <tr tabIndex={ 1 }
                                    onClick={
                                      e => {
                                        let tr = e.target;
                                        while (tr.tagName !== "TR") {
                                          tr = tr.parentElement;
                                        }
                                        const checkbox = tr.children[0].children[0];
                                        checkbox.click();
                                      }
                                    }
                                    style={{
                                      verticalAlign:  "baseline",
                                      cursor:         "pointer"
                                    }} >
                                      <td>
                                        <input type="checkbox" name="storageBorders"
                                          defaultChecked={ this.state.storeBorders }
                                          style={{
                                            cursor: "pointer"
                                          }}
                                          onClick={
                                            e => e.stopPropagation()
                                          }
                                          onChange={
                                            e => {
                                              Root.storeBorders = e.target.checked;
                                              this.setState({
                                                storeBorders: Root.storeBorders
                                              });
                                            }
                                          } />
                                      </td>
                                      <td style={{ width: "6.2em" }} >
                                        Use Storage
                                      </td>
                                      <td
                                        style={{
                                          textAlign:  "left",
                                          color:      "rgb(170,170,170)",
                                          fontSize:   "90%"
                                        }} >
                                        allow this page to access localStorage
                                        to store the borders of Voronoi Chart
                                        of each dataset
                                      </td>
                                  </tr>
                                </tbody>
                            </table>
                          </>
                        ) : null
                      }
                  </section>
              </section>
              <section key="btn"
                style={{
                  display:    "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  marginTop:      "1.2vh"
                }} >
                  {
                    this.state.running || (
                      <Button key="ok"
                        listener={ this.close.bind(this) }
                        style={{
                          margin: "6px 0.8rem",
                          padding:  "0.2rem",
                          width:  "128px"
                        }} >
                          OK
                      </Button>
                    )
                  }
              </section>
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

export const AsyncComponent = props => {
  const [state, setState] = React.useState(null);
  let active = React.useMemo(() => true, []);
  const updateOnlyOnce = React.useRef(
    s => {
      if (active) {
        setState(s);
        updateOnlyOnce.current = null;
      }
    }
  );

  React.useEffect(() => {
    props.children().then(res => {
      if (active) {
        updateOnlyOnce.current(res)
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return state || props.waiting;
};

const parseSize = size => {
  return size < 1024 * 0.8 ? size + "B"
    : size < 1024 * 1024 * 0.8 ? (size / 1024).toFixed(2) + "KB"
    : (size / 1024 / 1024).toFixed(2) + "MB";
};

const readStorage = async () => {
  try {
    const data = (await axios.get("/readStorage")).data.data;
    const stat = {
      0: [0, 0],
      1: [0, 0],
      2: [0, 0],
      3: [0, 0]
    };
    data.forEach(d => {
      stat[d.type] = [
        stat[d.type][0] + 1,
        stat[d.type][1] + d.size
      ];
    });
    return stat;
  } catch {
    return null;
  }
};

const clearStorage = async (config, output, onfulfilled, onrejected) => {
  output("Running...");
  try {
    const res = await axios.get(`/clearStorage/${config[0]}/${config[1]}/${config[2]}/${config[3]}`);
    
    output("Completed");
    onfulfilled(res);
  } catch (e) {
    onrejected(e);
    return;
  }
};

export default Settings;
