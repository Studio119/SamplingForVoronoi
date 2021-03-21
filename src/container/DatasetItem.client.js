/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 19:42:44 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-03-21 19:09:31
 */

import { useState, useEffect } from 'react';
import ExpandSign from '../UI/ExpandSign';
import { Root } from '../App.server';
import { callContextMenu } from './ContextMenu.client';
import Button from '../UI/Button.client';


const rgb2code = rgb => {
  return "#" + rgb.split(",").map(
    d => parseInt(/\d+/.exec(d)[0]).toString(16).padStart(2, "0")
  ).join("");
};

const code2rgb = code => {
  return `rgb(${
    parseInt(code.slice(1, 3), 16)
  },${
    parseInt(code.slice(3, 5), 16)
  },${
    parseInt(code.slice(5, 7), 16)
  })`;
};

const getColor = (colorMap, val, max) => {
  const v = val / max;
  return colorMap.project(v);
};


let lastState = {};

const DatasetItem = props => {
  const [state, setState] = useState(lastState[props.name] || {
    expand:     true,
    showPrefr:  true,
    showStat:   true,
    showBorders:true,
    showSample: true,
    showCharts: true
  });

  let [min, mean, max] = [Infinity, 0, -Infinity];
  let steps = [];
  for (let i = 0; i < 80; i++) {
    steps.push(0);
  }

  props.data.forEach(d => {
    min = Math.min(min, d.value);
    max = Math.max(max, d.value);
    mean += d.value;
  });
  
  props.data.forEach(d => {
    const val = (d.value - min) / (max - min);
    steps[Math.min(Math.floor(val * steps.length), steps.length - 1)] += 1;
  });
  
  mean /= props.data.length;

  props.data.forEach(d => {
    const base = (d.value - min) / (max - min) * steps.length;
    for (let i = Math.max(Math.round(base - steps.length / 10), 0); i < Math.min(Math.round(base + steps.length / 10), steps.length); i++) {
      const dist = Math.abs(base - i);
      const w = Math.pow(1 / (1 + dist), 2);
      steps[i] += 1 / w;
    }
  });

  let h = Math.max(...steps) * 1.2;
  let path = "M0,0";
  steps.forEach((d, i) => {
    path += (
      " L" + (i / (steps.length - 1) * 150).toFixed(1) + "," + (25 - d / h * 25).toFixed(1)
    );
  });
  path += " L150,0";

  useEffect(() => {
    lastState[props.name] = state;
  });

  return (
    <section className="DatasetItem"
    onContextMenu={
      e => {
        callContextMenu(
          e, [{
            text:   "Dataset [" + props.name + "]"
          }, {
            action: Root.fileDialogOpen,
            text:   "Import..."
          }, {
            action: () => Root.sample(props),
            text:   "Perform sampling"
          }, {
            action: () => Root.close(props),
            text:   "Close dataset"
          }]
        );
      }
    } >
      <label tabIndex={ 1 }
        onClick={
          () => {
            setState({
              ...state,
              expand: !state.expand
            });
          }
        }  >
          <ExpandSign expanded={ state.expand } />
          { props.name }
      </label>
      <section key="prefr"
      style={{
        height: state.expand ? undefined : 0
      }} >
        <label tabIndex={ 1 }
          style={{ color: "rgb(172,89,136)" }}
          onClick={
            () => {
              setState({
                ...state,
                showPrefr: !state.showPrefr
              });
            }
          }  >
            <ExpandSign expanded={ state.showPrefr } />
            Preference
        </label>
        <table style={{
            display: state.showPrefr ? undefined : "none",
            textAlign: "center",
            marginLeft: "1rem",
            paddingLeft: "0.84rem",
            borderLeft: "1px solid rgb(52,103,176)",
            lineHeight: 1.1,
            width:      "168px"
          }} >
            <tbody>
              <tr>
                <td colSpan="4" >
                  <svg width="150px" height="6px" >
                    {
                      new Array(80).fill(0).map((_, i) => {
                        return (
                          <rect key={ i }
                            x={ i * 150 / 80 }  width={ 150 / 80 + 0.2 }
                            y={ 0 }             height={ 6 }
                            style={{
                              fill: getColor(props.colorMap, i + 0.5, 80)
                            }} />
                        );
                      })
                    }
                  </svg>
                </td>
              </tr>
              {
                props.colorMap.colorList.map((c, i) => {
                  return (
                    <tr key={ i } className="color"
                      onContextMenu={
                        e => {
                          if (props.colorMap.length === 1) {
                            callContextMenu(
                              e, [{
                                text:   "Color map index [" + (i + 1) + "]"
                              }, {
                                action: () => {
                                  const next = (
                                    props.colorMap.colorList.slice(0, i).concat(
                                      ["rgb(127,127,127)"]
                                    ).concat(
                                      props.colorMap.colorList.slice(i, props.colorMap.length)
                                    )
                                  );
                                  props.colorMap.update(next);
                                  Root.colorizeChanged = true;
                                  Root.refresh();
                                },
                                text: "Insert before"
                              }, {
                                action: () => {
                                  const next = (
                                    props.colorMap.colorList.slice(0, i + 1).concat(
                                      ["rgb(127,127,127)"]
                                    ).concat(
                                      props.colorMap.colorList.slice(i + 1, props.colorMap.length)
                                    )
                                  );
                                  props.colorMap.update(next);
                                  Root.colorizeChanged = true;
                                  Root.refresh();
                                },
                                text: "Insert after"
                              }]
                            );
                          } else {
                            callContextMenu(
                              e, [{
                                text:   "Color map index [" + (i + 1) + "]"
                              }, {
                                action: () => {
                                  const next = (
                                    props.colorMap.colorList.slice(0, i).concat(
                                      ["rgb(127,127,127)"]
                                    ).concat(
                                      props.colorMap.colorList.slice(i, props.colorMap.length)
                                    )
                                  );
                                  props.colorMap.update(next);
                                  Root.colorizeChanged = true;
                                  Root.refresh();
                                },
                                text: "Insert before"
                              }, {
                                action: () => {
                                  const next = (
                                    props.colorMap.colorList.slice(0, i + 1).concat(
                                      ["rgb(127,127,127)"]
                                    ).concat(
                                      props.colorMap.colorList.slice(i + 1, props.colorMap.length)
                                    )
                                  );
                                  props.colorMap.update(next);
                                  Root.colorizeChanged = true;
                                  Root.refresh();
                                },
                                text: "Insert after"
                              }, {
                                action: () => {
                                  const next = (
                                    props.colorMap.colorList.slice(0, i).concat(
                                      props.colorMap.colorList.slice(i + 1, props.colorMap.length)
                                    )
                                  );
                                  props.colorMap.update(next);
                                  Root.colorizeChanged = true;
                                  Root.refresh();
                                },
                                text: "Remove color"
                              }]
                            );
                          }
                        }
                      } >
                        <td
                          style={{
                            width: "30px"
                          }}>
                            { i + 1 }
                        </td>
                        <ColorTd key={ c }
                          value={ c }
                          settor={
                            val => {
                              const next = [...props.colorMap.colorList];
                              next[i] = val;
                              props.colorMap.update(next);
                              Root.colorizeChanged = true;
                              Root.refresh();
                            }
                          } />
                        <td
                          style={{
                            width: "16px",
                            background: c,
                            border: "1px solid rgb(103,179,230)"
                          }} />
                    </tr>
                  );
                })
              }
              <CheckboxTr
                value={ props.colorMap.discrete }
                settor={
                  val => {
                    props.colorMap.discrete = val;
                    Root.colorizeChanged = true;
                    Root.refresh();
                  }
                } />
            </tbody>
        </table>
      </section>
      <section key="stat"
      style={{
        height: state.expand ? undefined : 0
      }} >
        <label tabIndex={ 1 }
          style={{ color: "rgb(225,104,0)" }}
          onClick={
            () => {
              setState({
                ...state,
                showStat: !state.showStat
              });
            }
          }  >
            <ExpandSign expanded={ state.showStat } />
            Stat
        </label>
        <table style={{
          display: state.showStat ? undefined : "none",
          textAlign: "center",
          marginLeft: "1rem",
          paddingLeft: "0.84rem",
          borderLeft: "1px solid rgb(52,103,176)",
          lineHeight: 1.1
        }} >
          <tbody>
            <tr>
              <th>count</th>
              <td>{ props.data.length }</td>
            </tr>
            <tr>
              <td colSpan="3">
                <svg width="150px" height="26px"
                  style={{
                    marginBottom: "-0.2rem"
                  }} >
                    {
                      new Array(80).fill(0).map((_, i) => {
                        return (
                          <rect key={ i }
                            x={ i * 150 / 80 }  width={ 150 / 80 + 0.2 }
                            y={ 0 }             height={ 26 }
                            style={{
                              fill: getColor(props.colorMap, i + 0.5, 80)
                            }} />
                        );
                      })
                    }
                    <path d={ path }
                      style={{
                        fill: "rgb(248,249,253)"
                      }} />
                </svg>
              </td>
            </tr>
            <tr>
              <th>min</th>
              <th>mean</th>
              <th>max</th>
            </tr>
            <tr>
              <td>{ min.toFixed(3) }</td>
              <td>{ mean.toFixed(3) }</td>
              <td>{ max.toFixed(3) }</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section key="borders"
      style={{
        height: state.expand ? undefined : 0
      }} >
        <label tabIndex={ 1 }
          style={{ color: "rgb(110,110,110)" }}
          onClick={
            () => {
              setState({
                ...state,
                showBorders: !state.showBorders
              });
            }
          }  >
            <ExpandSign expanded={ state.showBorders } />
            Borders
        </label>
        <div style={{
          display: state.showBorders? undefined : "none",
          textAlign: "left",
          marginLeft: "1rem",
          paddingLeft: "0.84rem",
          borderLeft: "1px solid rgb(52,103,176)",
          lineHeight: 1.1
        }} >
          {
            props.borders.length ? (
              <Button
                style={{
                  padding: "0.2em 1.6em"
                }}
                listener={
                  () => {
                    Root.getDataset(props.name).borders = [];
                    Root.refresh();
                  }
                } >
                  clear
              </Button>
            ) : (
              <Button
                style={{
                  padding: "0.2em 1.6em"
                }}
                listener={
                  () => {
                    Root.pickBorders();
                  }
                } >
                  pick
              </Button>
            )
          }
        </div>
      </section>
      <section key="samples"
      style={{
        height: state.expand ? undefined : 0
      }} >
        <label tabIndex={ 1 }
          style={{ color: "rgb(50,121,58)" }}
          onClick={
            () => {
              setState({
                ...state,
                showSample: !state.showSample
              });
            }
          }  >
            <ExpandSign expanded={ state.showSample } />
            Samples
        </label>
        <table style={{
          display: state.showSample ? undefined : "none",
          textAlign: "left",
          marginLeft: "1rem",
          paddingLeft: "0.84rem",
          borderLeft: "1px solid rgb(52,103,176)",
          lineHeight: 1.1
        }} >
          <tbody>
            {
              props.samples.map((sample, i) => {
                return (
                  <tr key={ i }
                    onContextMenu={
                      e => {
                        if (sample.name === "total") {
                          callContextMenu(
                            e, [{
                              text:   "Sample [" + props.name + "." + sample.name + "]"
                            }, {
                              action: () => Root.sample(props),
                              text:   "Perform sampling"
                            }, {
                              action: () => {
                                Root.paint(props.name, sample.name);
                              },
                              text: "Create chart"
                            }]
                          );
                        } else {
                          callContextMenu(
                            e, [{
                              text:   "Sample [" + props.name + "." + sample.name + "]"
                            }, {
                              action: () => Root.sample(props),
                              text:   "Perform sampling"
                            }, {
                              action: () => {
                                Root.paint(props.name, sample.name);
                              },
                              text: "Create chart"
                            }, {
                              action: () => {
                                Root.exportSample(props.name, sample.name);
                              },
                              text: "Export"
                            }, {
                              action: () => {
                                Root.closeSample(props.name, sample.name);
                              },
                              text: "Remove"
                            }]
                          );
                        }
                      }
                    }
                    style={{
                      cursor: "pointer"
                    }} >
                      <td title={ sample.name }
                        style={{
                          display:    "inline-block",
                          width:      "120px",
                          overflow:   "hidden",
                          letterSpacing:  "-0.02em",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis"
                        }} >
                          { sample.name }
                      </td>
                      <td
                        style={{
                          fontSize:   "90%",
                          letterSpacing:  "-0.01em"
                        }} >
                          { "(" + sample.data.length + ")" }
                      </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </section>
      <section key="charts"
      style={{
        height: state.expand ? undefined : 0
      }} >
        <label tabIndex={ 1 }
          style={{ color: "rgb(99,11,157)" }}
          onClick={
            () => {
              setState({
                ...state,
                showCharts: !state.showCharts
              });
            }
          }  >
            <ExpandSign expanded={ state.showCharts } />
            Charts
        </label>
        <div style={{
          display: state.showCharts ? undefined : "none",
          textAlign: "left",
          marginLeft: "1rem",
          paddingLeft: "0.84rem",
          borderLeft: "1px solid rgb(52,103,176)",
          lineHeight: 1.1
        }} >
          {
            props.charts.map((chart, i) => {
              return (
                <ChartRef key={ i } chart={ chart }
                  onContextMenu={
                    e => {
                      callContextMenu(
                        e, [{
                          text: "Chart [" + props.name + "." + chart.name + "]"
                        }, {
                          action: () => {
                            Root.closeChart(props.name, chart.name);
                          },
                          text: "Close"
                        }]
                      );
                    }
                  } />
              );
            })
          }
        </div>
      </section>
    </section>
  );
};

const ChartRef = props => {
  const name = props.chart.dataset + "." + props.chart.name;
  const [showing, show] = useState(lastState[name] || true);

  useEffect(() => {
    lastState[name] = showing;
  });

  return (
    <section
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'stretch',
        justifyContent: 'flex-start'
      }}
      onContextMenu={
        props.onContextMenu
      } >
        <label title={ props.chart.name } tabIndex={ 1 }
          style={{
            display:    'flex',
            alignItems: 'center',
            color:      "rgb(50,121,58)",
            cursor:     'pointer'
          }}
          onClick={
            () => {
              show(!showing);
            }
          }  >
            <ExpandSign expanded={ showing } />
            <label
              style={{
                width:      "152px",
                letterSpacing:  "-0.02em",
                whiteSpace: "nowrap",
                overflow:   "hidden",
                textOverflow: "ellipsis",
                cursor:     'pointer'
              }} >
                { props.chart.name }
            </label>
        </label>
        <table style={{
          display: showing ? undefined : "none",
          textAlign: "left",
          marginLeft: "0.38rem",
          paddingLeft: "0.4rem",
          borderLeft: "1px solid rgb(52,103,176)",
          lineHeight: 1.1
        }} >
          <tbody>
            {
              props.chart.layers.map((layer, i) => {
                return (
                  <tr key={ i }
                    style={{
                      color: layer.active ? "rgb(0,0,0)" : "rgb(113,113,113)"
                    }} >
                      <th tabIndex={ 1 }
                        style={{
                          textAlign: "center",
                          cursor: "pointer",
                          color: layer.active ? "rgb(50,161,145)" : "rgb(113,148,112)",
                          width:  "14px"
                        }}
                        onClick={
                          () => {
                            layer.active = !layer.active;
                            Root.refresh();
                          }
                        } >
                          { layer.active ? "+" : "-" }
                      </th>
                      <OpacityBar
                        layer={ layer }
                        value={ layer.opacity }
                        setValue={
                          d => {
                            layer.opacity = d;
                            Root.refresh();
                          }
                        } />
                      {
                        layer.active && (
                          i !== 0 ? (
                            <th tabIndex={ 1 }
                              style={{
                                textAlign: "center",
                                cursor: "pointer",
                                background: "rgba(46,189,255,0.6)",
                                color: "white",
                                width:  "0.9rem",
                                borderRadius: "4px"
                              }}
                              onClick={
                                e => {
                                  e.stopPropagation();
                                  props.chart.layers = props.chart.layers.slice(0, i - 1).concat(
                                    [props.chart.layers[i], props.chart.layers[i - 1]]
                                  ).concat(
                                    props.chart.layers.slice(i + 1)
                                  );
                                  Root.refresh();
                                }
                              } >
                                ↑
                            </th>
                          ) : (
                            <th
                              style={{
                                textAlign: "center",
                                cursor: "not-allowed",
                                background: "rgba(194,194,194,0.64)",
                                color: "white",
                                width:  "0.9rem",
                                borderRadius: "4px"
                              }} >
                                ↑
                            </th>
                          )
                        )
                      }
                      {
                        layer.active && (
                          i !== props.chart.layers.length - 1 ? (
                            <th tabIndex={ 1 }
                              style={{
                                textAlign: "center",
                                cursor: "pointer",
                                background: "rgba(46,189,255,0.6)",
                                color: "white",
                                width:  "0.9rem",
                                borderRadius: "4px"
                              }}
                              onClick={
                                e => {
                                  e.stopPropagation();
                                  props.chart.layers = props.chart.layers.slice(0, i).concat(
                                    [props.chart.layers[i + 1], props.chart.layers[i]]
                                  ).concat(
                                    props.chart.layers.slice(i + 2)
                                  );
                                  Root.refresh();
                                }
                              } >
                                ↓
                            </th>
                          ) : (
                            <th
                              style={{
                                textAlign: "center",
                                cursor: "not-allowed",
                                background: "rgba(194,194,194,0.64)",
                                color: "white",
                                width:  "0.9rem",
                                borderRadius: "4px"
                              }} >
                                ↓
                            </th>
                          )
                        )
                      }
                  </tr>
                );
              })
            }
          </tbody>
        </table>
    </section>
  );
};

const OpacityBar = props => {
  const d = Math.min(98.5, Math.max(2, (props.value * 100).toFixed(0)));

  return (
    <td tabIndex={ 1 }
      style={{
        cursor: "pointer",
        padding: "0 4px",
        background: props.layer.active ? (
          "linear-gradient(to right, rgb(103,179,230) 2%, rgba(103,179,230,0.24) 2%,"
            + " rgba(103,179,230,0.24) " + d + "%, #0000 " + d
            + "%, #0000 98.5%, rgb(103,179,230) 98.5%)"
        ) : "none",
        userSelect: "none"
      }}
      onClick={
        e => {
          if (!props.layer.active) {
            props.layer.active = !props.layer.active;
            Root.refresh();
          } else {
            const x = (
              e.clientX - e.currentTarget.getBoundingClientRect().x
            ) / e.currentTarget.getBoundingClientRect().width;
            const val = parseFloat(x.toFixed(2));
            props.setValue(val);
          }
        }
      } >
        { props.layer.label }
    </td>
  );
};

const CheckboxTr = props => {
  return (
    <tr
      tabIndex={ 1 }
      onClick={
        () => {
          props.settor(!props.value);
        }
      }
      style={{
        cursor: "pointer"
      }} >
        <td
          style={{
            width: "30px"
          }}>
            -
        </td>
        <td
          style={{
            width: "76px",
            opacity:  props.value ? 1 : 0.8
          }}>
            discrete
        </td>
        <td
          style={{
            width: "16px"
          }} >
            <svg viewBox="0 0 20 20" >
              <circle
                cx="10" cy="12" r="6"
                style={{
                  fill:           'none',
                  pointerEvents:  "none",
                  stroke:         "rgb(176,176,176)",
                  strokeWidth:    1.6
                }} />
              {
                props.value ? (
                  <path
                    d="M2,9 L9,18 L19,4"
                    style={{
                      fill:         "none",
                      stroke:       "rgb(8,196,22)",
                      strokeWidth:  4
                    }} />
                ) : null
              }
            </svg>
        </td>
        <td>
          { props.value ? "T" : "F" }
        </td>
    </tr>
  );
};

const ColorTd = props => {
  return (
    <>
      <td
        style={{
          width: "76px"
        }} >
          { rgb2code(props.value) }
      </td>
      <td
        style={{
          width: "16px"
        }} >
          <input type="color" defaultValue={ rgb2code(props.value) }
            style={{
              display:          "none"
            }}
            onChange={
              e => {
                const value = code2rgb(e.target.value);
                if (props.value !== value) {
                  Root.colorizeChanged = true;
                  props.settor(value);
                }
              }
            } />
          <svg viewBox="4 4 32 32" tabIndex={ 1 }
            style={{
              cursor: "pointer"
            }}
            onClick={
              e => {
                e.target.parentElement.children[0].click();
              }
            } >
              <path d={
                  "M32,22 A16.5,16.5,0,0,0,32,18 L29,18 A13.5,13.5,0,0,0,28,15"
                  + " L30,13 A16.5,16.5,0,0,0,27,10 L25,12 A13.5,13.5,0,0,0,22,11"
                  + " L22,8 A16.5,16.5,0,0,0,18,8 L18,11 A13.5,13.5,0,0,0,15,12"
                  + " L13,10 A16.5,16.5,0,0,0,10,13 L12,15 A13.5,13.5,0,0,0,11,18"
                  + " L8,18 L15,20 A5,5,0,0,1,25,20 A5,5,0,0,1,15,20"
                  + " L8,18 A16.5,16.5,0,0,0,8,22 L11,22 A13.5,13.5,0,0,0,12,25"
                  + " L10,27 A16.5,16.5,0,0,0,13,30 L15,28 A13.5,13.5,0,0,0,18,29"
                  + " L18,32 A16.5,16.5,0,0,0,22,32 L22,29 A13.5,13.5,0,0,0,25,28"
                  + " L27,30 A16.5,16.5,0,0,0,30,27 L28,25 A13.5,13.5,0,0,0,29,22"
                }
                style={{
                  fill:   'rgb(65,100,148)',
                  pointerEvents: "none"
                }} />
          </svg>
      </td>
    </>
  );
};

export default DatasetItem;
