/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 19:42:44 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-18 20:47:10
 */

import { useState, createRef, useEffect, useLayoutEffect, Component } from 'react';
import ExpandSign from '../UI/ExpandSign';
import { Root } from '../App.server';
import ContextMenu, { ContextMenuItem } from './ContextMenu.client';


let lastState = {};

const DatasetItem = props => {
  const [state, setState] = useState(lastState[props.name] || {
    expand:     true,
    showStat:   true,
    showSample: true,
    showCharts: true
  });

  let [min, mean, max] = [Infinity, 0, -Infinity];
  let steps = [];
  for (let i = 0; i < 40; i++) {
    steps.push(0);
  }

  props.data.forEach(d => {
    min = Math.min(min, d.value);
    max = Math.max(max, d.value);
    mean += d.value;
    steps[Math.floor(d.value * steps.length)] += 1;
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
  let path = "M0,100";
  steps.forEach((d, i) => {
    path += (
      " L" + (i / steps.length * 100).toFixed(1) + "," + (99 - d / h * 99).toFixed(1)
    );
  });
  path += " L100,100";

  const menu = createRef();
  const menuSamples = createRef();
  const svg = createRef();

  useLayoutEffect(() => {
    if (svg.current) {
      const rate = svg.current.clientWidth / svg.current.clientHeight;
      svg.current.firstElementChild.style.transform = "scale(" + rate.toFixed(4) + ",1)";
    }
  });

  useEffect(() => {
    lastState[props.name] = state;
  });

  return (
    <section className="DatasetItem"
    onContextMenu={
      e => {
        e.stopPropagation();
        e.preventDefault();
        if (menu.current) {
          const x = e.clientX;
          const y = e.clientY;
          menu.current.style.display = "flex";
          menu.current.style.left = x + "px";
          menu.current.style.top = y + "px";
          const close = document.addEventListener('click', ev => {
            if (!menu.current) {
              document.removeEventListener('click', close);
              return;
            }
            const dx = ev.clientX - x;
            const dy = ev.clientY - y;
            if (dx < -2 || dx > menu.current.offsetWidth + 2) {
              menu.current.style.display = "none";
              document.removeEventListener('click', close);
            } else if (dy < -2 || dy > menu.current.offsetHeight + 2) {
              menu.current.style.display = "none";
              document.removeEventListener('click', close);
            }
          });
        }
      }
    } >
      <label
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
      <section key="stat"
      style={{
        height: state.expand ? undefined : 0
      }} >
        <label
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
            </tr>
            <tr>
              <td>{ props.data.length }</td>
            </tr>
            <tr>
              <td colSpan="3">
                <svg viewBox="0 0 100 100" ref={ svg }
                  style={{
                    height: "1.6rem",
                    width: "90%",
                    marginBottom: "-0.2rem"
                  }} >
                    <path d={ path }
                      style={{
                        fill: "rgba(234,157,137,0.5)",
                        stroke: "rgba(234,157,137)",
                        strokeWidth: "1.5px",
                        transformOrigin: "center"
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
      <section key="samples"
      style={{
        height: state.expand ? undefined : 0
      }}
      onContextMenu={
        e => {
          e.stopPropagation();
          e.preventDefault();
          if (menuSamples.current) {
            menuSamples.current.setState({
              x:    e.clientX,
              y:    e.clientY,
              open: true,
              focus: null
            });
          }
        }
      } >
        <label
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
                        e.stopPropagation();
                        e.preventDefault();
                        if (menuSamples.current) {
                          menuSamples.current.setState({
                            open: true,
                            x:    e.clientX,
                            y:    e.clientY,
                            focus: {
                              name: props.name,
                              src:  sample.name
                            }
                          });
                        }
                      }
                    }
                    style={{
                      cursor: "pointer"
                    }} >
                      <th>{ sample.name }</th>
                      <td>
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
        <label
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
                <ChartRef key={ i } chart={ chart } />
              );
            })
          }
        </div>
      </section>
      <ContextMenu key="menu" menu={ menu } >
        <ContextMenuItem key="new"
          listener={ Root.fileDialogOpen } >
            New dataset
        </ContextMenuItem>
        <ContextMenuItem key="close"
          listener={ () => Root.close(props.name) } >
            { "Close [" + props.name + "]" }
        </ContextMenuItem>
      </ContextMenu>
      <ContextMenuSample ref={ menuSamples } />
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
        justifyContent: 'flex-start',
        paddingLeft:    '0.56rem'
      }} >
        <label
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
            { props.chart.name }
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
                      <th
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
                            <th
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
                            <th
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
    <td
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

class ContextMenuSample extends Component {

  constructor(props) {
    super(props);
    this.state = {
      open:   false,
      x:      0,
      y:      0,
      focus:  null
    };
    this.ref = createRef();
  }

  render() {
    return (
      <ContextMenu menu={ this.ref } >
        <ContextMenuItem key="new"
          listener={ () => {
            this.setState({
              open: false,
              focus: null
            });
          } } >
            New sample
        </ContextMenuItem>
        {
          this.state.focus && this.state.focus.src !== "total" && (
            <ContextMenuItem key="remove"
              listener={
                () => {
                  Root.closeSample(this.state.focus.name, this.state.focus.src);
                  this.setState({
                    open: false,
                    focus: null
                  });
                }
              } >
                { "Remove [" + this.state.focus.name + "." + this.state.focus.src + "]" }
            </ContextMenuItem>
          )
        }
        {
          this.state.focus && this.state.focus.name !== "total" && (
            <ContextMenuItem key="chart"
              listener={
                () => {
                  Root.paint(this.state.focus.name, this.state.focus.src);
                  this.setState({
                    open: false,
                    focus: null
                  });
                }
              } >
                { "New chart [" + this.state.focus.name + "." + this.state.focus.src + "]" }
            </ContextMenuItem>
          )
        }
      </ContextMenu>
    );
  }

  componentDidUpdate() {
    if (this.state.open) {
      const ref = this.ref;
      ref.current.style.display = "flex";
      ref.current.style.left = this.state.x + "px";
      ref.current.style.top = this.state.y + "px";
      const close = document.addEventListener('click', ev => {
        if (!ref.current) {
          document.removeEventListener('click', close);
          return;
        }
        const dx = ev.clientX - this.state.x;
        const dy = ev.clientY - this.state.y;
        if (dx < -2 || dx > ref.current.offsetWidth + 2) {
          ref.current.style.display = "none";
          document.removeEventListener('click', close);
        } else if (dy < -2 || dy > ref.current.offsetHeight + 2) {
          ref.current.style.display = "none";
          document.removeEventListener('click', close);
        }
        this.setState({
          open: false,
          focus: null
        });
      });
    }
  }

};


export default DatasetItem;
