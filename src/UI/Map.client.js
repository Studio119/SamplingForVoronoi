/*
 * @Author: Antoine YANG 
 * @Date: 2020-08-20 22:43:10 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-03-21 20:18:46
 */

import React, { Component, createRef } from "react";
import MapBox from "../react-mapbox/MapBox";
import * as d3 from "d3";
import { Root } from "../App.server";
import { HilbertEncodeXY } from "../help/hilbertEncoder";
import axios from "axios";
import Button from "./Button.client";


const encodeLayers = layers => {
  return layers.map(layer => {
    return layer.label + ":" + (layer.active ? "on" : "off") + ";";
  }).join("");
};

const diffLayers = (prev, next) => {
  let layers = {};
  let updateList = [];

  prev.forEach((p, i) => {
    layers[p.label] = [p.active, i, p.opacity];
  });

  next.forEach((n, i) => {
    if (layers[n.label]) {
      if (layers[n.label][0] !== n.active) {
        // 可见度改变
        updateList.push([n.label, n.active ? "paint" : "clear"]);
      }
      if (layers[n.label][1] !== i) {
        // 位置改变
        updateList.push([n.label, "move", i]);
      }
      if (layers[n.label][2] !== n.opacity) {
        // 透明度改变
        updateList.push([n.label, "opacity", n.opacity]);
      }
    } else {
      // 新增 [现在认为不可能]
      updateList.push([n.label, "new"]);
    }
  });

  return updateList;
};

const resolveCors = (x, y) => {
  let lng = [-180, 180];
  let lat = [-90, 90];

  while (lat[1] - lat[0] > 0.002) {
    const m = (lat[0] + lat[1]) / 2;
    const ym = Map.project(0, m).y;
    if (ym > y) {
      lat[0] = m;
    } else if (ym < y) {
      lat[1] = m;
    } else {
      break;
    }
  }

  const py = (lat[0] + lat[1]) / 2;

  while (lng[1] - lng[0] > 0.002) {
    const m = (lng[0] + lng[1]) / 2;
    const xm = Map.project(m, py).x;
    if (xm > x) {
      lng[1] = m;
    } else if (xm < x) {
      lng[0] = m;
    } else {
      break;
    }
  }

  const px = (lng[0] + lng[1]) / 2;

  return [px, py];
};


class Map extends Component {

  getVoronoiPolygons() {
    let shapes = this.voronoiPolygons;

    return {
      width: map.width,
      height: map.height,
      data: shapes
    };
  }

  update(name, data, layers, colorMap, borders, setBorders) {
    let evaluation = this.state.evaluation;
    let running = this.state.running;
    this.voronoiPolygons = [];
    if (name !== this.state.name) {
      // 选页卡切换
      // console.log("选页卡切换");
      evaluation = null;
      running = [];
      this.voronoiPolygonsPrev = [];
      if (data.length) {
        // 更新位置，触发重绘
        let [xmin, xmax, ymin, ymax] = [Infinity, -Infinity, Infinity, -Infinity];
  
        data.forEach(d => {
            xmin = Math.min(xmin, d.lng);
            xmax = Math.max(xmax, d.lng);
            ymin = Math.min(ymin, d.lat);
            ymax = Math.max(ymax, d.lat);
        });
  
        if (xmin !== xmax) {
          const ex = (xmax - xmin) / 9;
          xmin -= ex;
          xmax += ex;
        }
  
        if (ymin !== ymax) {
          const ex = (ymax - ymin) / 9;
          ymin -= ex;
          ymax += ex;
        }
  
        this.map.current.fitBounds([ [xmax, ymin], [xmin, ymax] ]);
      }
    } else {
      if (Root.colorizeChanged) {
        // 映射规则改变
        // console.log("映射规则改变");
        Root.colorizeChanged = false;
        this.repaint();
      } else if (encodeLayers(this.state.layers)!== encodeLayers(layers)) {
        // 调整图层
        const updateList = diffLayers(this.state.layers, layers);
        if (updateList.length === 2) {
          // 优先级调整
          document.getElementById("layer-" + updateList[0][0]).style.zIndex = 100 - updateList[0][1];
        } else {
          // 单个图层操作
          this.partialRepaint(updateList[0]);
        }
      }
    }

    this.setState({ name, data, layers, colorMap, borders, setBorders, evaluation, running });
  }

  constructor(props) {
    super(props);
    this.state = {
      picking:    false,
      container:  false,
      name:       null,
      data:       [],
      layers:     [],
      borders:    [],
      setBorders: () => {},
      colorMap:   null,
      evaluation: null,
      running:    []
    };

    Map.cur = this;

    this.max = 0;

    this.container = createRef();
    this.id = "T" + (new Date()).getTime();

    this.width = 0;
    this.height = 0;

    this.voronoiPolygons = [];
    this.voronoiPolygonsPrev = [];

    this.map = createRef();

    this.ctx = {
      "scatters": null,
      "p_strokes": null,
      "polygons": null,
      "groups":   null,
      "disks":    null
    };
    this.end = {
      "scatters": true,
      "p_strokes": true,
      "polygons": true,
      "groups":   null,
      "disks":    true
    };

    this.progress = {
      count: 0,
      flag: 0,
      ref: createRef(),
      timer: 0,
      start: (len) => {
        if (len && this.progress.ref.current) {
          this.progress.count = len;
          this.progress.flag = 0;
          this.progress.ref.current.style.visibility = "visible";
          this.progress.ref.current.setAttribute("width", "0");
        }
      },
      next: () => {
        if (this.progress.ref.current && this.progress.count) {
          this.progress.flag += 1;
          if (this.progress.flag === this.progress.count) {
            this.progress.close();
            return;
          }
          if (this.progress.timer) {
            clearTimeout(this.progress.timer);
          }
          this.progress.ref.current.style.visibility = "visible";
          this.progress.timer = setTimeout(() => {
            this.progress.ref.current.style.visibility = "hidden";
          }, 1000);
          this.progress.ref.current.setAttribute("width", `${
                        this.progress.flag / this.progress.count * 100
                    }%`);
        }
      },
      close: () => {
        if (this.progress.ref.current) {
          this.progress.count = 0;
          this.progress.flag = 0;
          this.progress.ref.current.style.visibility = "hidden";
          this.progress.ref.current.setAttribute("width", "0");
        }
      }
    };

    this.timers = [];
    this.updated = true;
    this.worker = null;

    this.picked = [];
    Root.pickBorders = () => {
      if (this.state.picking) {
        return;
      }
      this.picked = [];
      this.setState({
        picking:  true
      });
    };
    this.ctx_bp = null;
  }

  render() {
    this.max = Math.max(...this.state.data.map(d => d.value));
    
    return (
      <section ref={ this.container }
        style={{
          flex: 1
        }} >
          {
            this.state.container ? (
              <>
                <div key="progress"
                  style={{
                    display: "flex",
                    width: this.width,
                    padding: "0",
                    marginTop: "-4.5px"
                  }} >
                    <svg key="progress"
                      style={{
                        width: this.width,
                        height: "4px"
                      }} >
                        <rect ref={ this.progress.ref }
                          x="0" y="0" width="0" height="4"
                          style={{
                            fill: "rgb(112,195,141)"
                          }} />
                    </svg>
                </div>
                <div key="mapbox-container" id={ this.id }
                  style={{
                    display: "block",
                    width: this.width,
                    height: this.height,
                    filter: "grayscale(0.9)",
                    background: "#121212"
                  }} >
                    <MapBox ref={ this.map }
                      id={ this.id }
                      onBoundsChanged = {
                        () => {
                          this.voronoiPolygons = [];
                          this.repaint();
                        }
                      } />
                </div>
                {
                  this.state.layers.map((layer, i) => {
                    return (
                      <div key={ layer.label } id={ "layer-" + layer.label }
                        style={{
                          display: "block",
                          width: this.width,
                          height: this.height,
                          top: 0 - this.height * (i + 1),
                          position: "relative",
                          pointerEvents: "none",
                          visibility: layer.active ? "visible" : "hidden",
                          zIndex: 100 - i,
                          opacity: layer.opacity
                        }} >
                          <canvas className="MapCanvas"
                            width={ this.width } height={ this.height } />
                      </div>
                    );
                  })
                }
                <div key="interaction"
                  style={{
                    display: this.state.picking ? "block" : "none",
                    width: this.width,
                    height: this.height,
                    top: 0 - this.height * (this.state.layers.length + 1),
                    position: "relative",
                    pointerEvents: "none",
                    zIndex: 200
                  }} >
                    <canvas className="MapCanvas" id="borderpicking"
                      width={ this.width } height={ this.height }
                      style={{
                        background: "rgba(200,200,200,0.5)",
                        pointerEvents:  "all"
                      }}
                      onClick={
                        e => {
                          if (!this.state.picking) {
                            return;
                          }
                          const x = e.nativeEvent.offsetX;
                          const y = e.nativeEvent.offsetY;
                          const [lng, lat] = resolveCors(x, y);
                          this.picked.push([lng, lat]);
                          this.ctx_bp.fillStyle = "rgb(36,79,138)";
                          this.ctx_bp.strokeStyle = "rgb(30,30,30)";
                          this.ctx_bp.lineWidth = 2;
                          const pos = Map.project(lng, lat);
                          this.ctx_bp.strokeRect(pos.x - 2.5, pos.y - 2.5, 5, 5);
                          this.ctx_bp.fillRect(pos.x - 2.5, pos.y - 2.5, 5, 5);
                          if (this.picked.length > 1) {
                            const last = this.picked[this.picked.length - 2];
                            const prev = Map.project(last[0], last[1]);
                            this.ctx_bp.beginPath();
                            this.ctx_bp.moveTo(prev.x, prev.y);
                            this.ctx_bp.lineTo(pos.x, pos.y);
                            this.ctx_bp.stroke();
                            this.ctx_bp.closePath();
                          }
                        }
                      }
                      onMouseMove={
                        e => {
                          if (!this.state.picking || this.picked.length === 0) {
                            return;
                          }
                          const x = e.nativeEvent.offsetX;
                          const y = e.nativeEvent.offsetY;
                          const before = Map.project(...this.picked[this.picked.length - 1]);
                          const dist = ((before.x - x) ** 2 + (before.y - y) ** 2) ** 0.5;
                          if (dist < 8) {
                            return;
                          }
                          const [lng, lat] = resolveCors(x, y);
                          this.picked.push([lng, lat]);
                          this.ctx_bp.fillStyle = "rgb(36,79,138)";
                          this.ctx_bp.strokeStyle = "rgb(30,30,30)";
                          this.ctx_bp.lineWidth = 1.2;
                          const pos = Map.project(lng, lat);
                          this.ctx_bp.strokeRect(pos.x - 2, pos.y - 2, 4, 4);
                          this.ctx_bp.fillRect(pos.x - 2, pos.y - 2, 4, 4);
                          if (this.picked.length > 1) {
                            const last = this.picked[this.picked.length - 2];
                            const prev = Map.project(last[0], last[1]);
                            this.ctx_bp.beginPath();
                            this.ctx_bp.moveTo(prev.x, prev.y);
                            this.ctx_bp.lineTo(pos.x, pos.y);
                            this.ctx_bp.stroke();
                            this.ctx_bp.closePath();
                          }
                        }
                      }
                      onContextMenu={
                        () => {
                          this.state.setBorders(this.picked.map(d => d));
                          this.state.picking = false;
                          this.picked = [];
                          setTimeout(() => {
                            this.repaint();
                          }, 100);
                        }
                      } />
                </div>
              </>
            ) : null
          }
          <section key="running"
            style={{
              position: "fixed",
              right:    "20px",
              bottom:   "20px",
              fontSize: "90%",
              lineHeight: "1.4em",
              zIndex:   999,
              opacity:  0.94,
              display:  "flex",
              flexDirection:  "column",
              alignItems: "flex-end"
            }} >
              {
                this.state.running.map((log, i) => {
                  return (
                    <article key={ `log_${i}` }
                      style={{
                        marginTop:  "6px",
                        padding:  "0.6rem 0.8rem",
                        background: "white",
                        border:   "1px solid #aaa",
                        display:  "flex",
                        alignItems: "center",
                        boxShadow: "4px 3px 0 #888a"
                      }} >
                        <div className="loading"
                          style={{
                            width:  "1.2em",
                            height: "1.2em",
                            borderRadius: "0.6em",
                            borderLeft: "2px solid rgba(130,181,203,0.64)",
                            borderTop: "2px solid rgba(130,181,203,1)",
                            borderRight: "2px solid rgba(130,181,203,0.22)",
                            borderBottom: "2px solid rgba(130,181,203,0.44)"
                          }} />
                        <label style={{ margin: "0 0 0 0.3em", padding: 0 }} >
                          { log }
                        </label>
                    </article>
                  );
                })
              }
              <article key="evaluation"
                style={{
                  marginTop:  "6px",
                  padding:  "0.6rem 0.8rem",
                  background: "white",
                  border:   "1px solid #aaa",
                  display:  this.state.name && this.state.name.endsWith(".total") ? "none" : "flex",
                  flexDirection:  "column",
                  alignItems: "center",
                  boxShadow: "4px 3px 0 #888a"
                }} >
                  {
                    this.state.evaluation ? (
                      this.state.evaluation instanceof Worker ? (
                        <React.Fragment>
                          <div className="loading"
                            style={{
                              width:  "2vmin",
                              height: "2vmin",
                              borderRadius: "1vmin",
                              borderLeft: "2px solid rgba(140,198,229,0.64)",
                              borderTop: "2px solid rgba(140,198,229,1)",
                              borderRight: "2px solid rgba(140,198,229,0.22)",
                              borderBottom: "2px solid rgba(140,198,229,0.44)"
                            }} />
                          <label>runnning evaluation...</label>
                        </React.Fragment>
                      ) : (
                        <table>
                          <tbody>
                            <tr>
                              <th>AAVSTD</th>
                              <td>{ this.state.evaluation.std.toFixed(4) }</td>
                            </tr>
                            <tr>
                              <th>AAVCV</th>
                              <td>{ this.state.evaluation.cv.toFixed(4) }</td>
                            </tr>
                            <tr>
                              <th>AELCV</th>
                              <td>{ this.state.evaluation.stroke.toFixed(4) }</td>
                            </tr>
                            <tr>
                              <th>ALAD</th>
                              <td>{ this.state.evaluation.local.toFixed(4) }</td>
                            </tr>
                          </tbody>
                        </table>
                      )
                    ) : (
                      <React.Fragment>
                        <header>Evaluation</header>
                        <Button
                          listener={
                            () => {
                              this.evaluateVoronoi();
                            }
                          }
                          style={{
                            display:  "block",
                            padding:  "3px 10px",
                            margin:   "0.24rem 0"
                          }} >
                            Run
                        </Button>
                      </React.Fragment>
                    )
                  }
              </article>
          </section>
      </section>
    );
  }

  componentDidMount() {
    this.width = this.container.current.clientWidth;
    this.height = this.container.current.clientHeight;
    this.setState({
      container: true
    });
  }

  componentWillUnmount() {
    this.clearTimers();
    this.picked = [];
    this.state.picking = false;
  }

  componentDidUpdate() {
    if (this.state.container && this.state.data.length && this.map.current) {
      const canvas = this.container.current.querySelectorAll(".MapCanvas");
      this.state.layers.forEach((layer, i) => {
        this.ctx[layer.label] = canvas[i].getContext("2d");
      });
      this.ctx_bp = document.getElementById("borderpicking").getContext("2d");
      this.ctx_bp.clearRect(0, 0, this.width, this.height);
    }
  }

  partialRepaint(operation) {
    if (!this.state.name) {
      return;
    }
    
    const target = operation[0];

    if (operation[1] === "clear") {
      document.getElementById("layer-" + target).style.visibility = "hidden";
      return;
    } else if (operation[1] === "paint") {
      // 已有图层
      document.getElementById("layer-" + target).style.visibility = "visible";
      if (this.end[target]) {
        // 已完成
      } else {
        if (target === "scatters") {
          this.ctx["scatters"].clearRect(0, 0, this.width, this.height);
          let renderingQueue = [];
          this.state.data.forEach(d => {
            renderingQueue.push({
              ...this.map.current.project(d),
              val: d.value
            });
          });
          this.bufferPaintScatters(renderingQueue);
        } else if (target === "groups") {
          this.ctx["groups"].clearRect(0, 0, this.width, this.height);
          const groups = {};
          let max = 0;
          this.state.data.forEach(d => {
            if (groups.hasOwnProperty(d.ss)) {
              groups[d.ss][0] += d.value;
              groups[d.ss][1] += 1;
            } else {
              groups[d.ss] = [d.value, 1];
              if (d.ss > max) {
                max = d.ss;
              }
            }
          });
          
          let renderingQueue = [];
          this.state.data.forEach(d => {
            renderingQueue.push({
              ...this.map.current.project(d),
              val: groups[d.ss][0] / groups[d.ss][1],
              ss: [d.ss, max]
            });
          });
          this.bufferPaintGroups(renderingQueue);
        } else if (target.startsWith("p")) {
          this.ctx[target].clearRect(0, 0, this.width, this.height);
          this.paintVoronoi();
        } else if (target === "disks") {
          this.ctx["disks"].clearRect(0, 0, this.width, this.height);
          let renderingQueue = [];
          this.state.data.forEach(d => {
            if (d.bounds) {
              renderingQueue.push({
                diskId:   d.diskId,
                children: d.children,
                averVal:  d.averVal,
                lat:      d.lat,
                lng:      d.lng,
                bounds:   d.bounds
              });
            }
          });
          this.bufferPaintDisks(
            renderingQueue.sort((a, b) => a.diskId - b.diskId)
          );
        }
        if (!target.startsWith("p")) {
          this.end[target] = true;
        }        
        if (this.timers.length) {
          this.progress.start(this.timers.length);
        }
      }
    } else if (operation[1] === "opacity") {
      document.getElementById("layer-" + target).style.opacity = operation[2];
    } else if (operation[1] === "new") {
      // 新增图层（暂时认为不可能）
      this.updated = true;
    }
  }

  repaint(waiting=true) {
    if (!this.state.name) {
      this.updated = true;
      return;
    }
    if (waiting) {
      this.updated = false;
    }
    if (this.updated) {
      return;
    }
    this.clearTimers();

    if (this.map.current) {
      if (!this.map.current.ready()) {
        this.updated = false;
        setTimeout(() => {
          this.repaint(false);
        }, 500);
        return;
      }
      // scatters
      this.ctx["scatters"].clearRect(0, 0, this.width, this.height);
      if (this.state.layers.filter(d => d.label === "scatters")[0].active) {
        document.getElementById("layer-scatters").style.visibility = "visible";
        let renderingQueue = [];
        this.state.data.forEach(d => {
          renderingQueue.push({
            ...this.map.current.project(d),
            val: d.value
          });
        });
        this.bufferPaintScatters(renderingQueue);
        this.end["scatters"] = true;
      } else {
        this.end["scatters"] = false;
      }
      // groups
      const layerGroups = this.state.layers.filter(d => d.label === "groups")[0];
      if (layerGroups && layerGroups.active) {
        this.ctx["groups"].clearRect(0, 0, this.width, this.height);
        document.getElementById("layer-groups").style.visibility = "visible";
        const groups = {};
        let max = 0;
        this.state.data.forEach(d => {
          if (groups.hasOwnProperty(d.ss)) {
            groups[d.ss][0] += d.value;
            groups[d.ss][1] += 1;
          } else {
            groups[d.ss] = [d.value, 1];
            if (d.ss > max) {
              max = d.ss;
            }
          }
        });
        
        let renderingQueue = [];
        this.state.data.forEach(d => {
          renderingQueue.push({
            ...this.map.current.project(d),
            val: groups[d.ss][0] / groups[d.ss][1],
            ss: [d.ss, max]
          });
        });
        this.bufferPaintGroups(renderingQueue);
        this.end["groups"] = true;
      } else {
        this.end["groups"] = false;
      }
      // voronoi polygons
      if (this.state.layers.filter(d => d.label === "polygons")[0].active) {
        this.ctx["polygons"].clearRect(0, 0, this.width, this.height);
        document.getElementById("layer-polygons").style.visibility = "visible";
        if (this.state.layers.filter(d => d.label === "p_strokes")[0].active) {
          this.ctx["p_strokes"].clearRect(0, 0, this.width, this.height);
          document.getElementById("layer-p_strokes").style.visibility = "visible";
        } else {
          this.end["p_strokes"] = false;
        }
        this.paintVoronoi();
      } else if (this.state.layers.filter(d => d.label === "p_strokes")[0].active) {
        this.end["polygons"] = false;
        this.ctx["p_strokes"].clearRect(0, 0, this.width, this.height);
        this.paintVoronoi();
      } else {
        this.end["polygons"] = false;
        this.end["p_strokes"] = false;
      }
      // BNS disks
      const layerDisks = this.state.layers.filter(d => d.label === "disks")[0];
      if (layerDisks && layerDisks.active) {
        this.ctx["disks"].clearRect(0, 0, this.width, this.height);
        document.getElementById("layer-disks").style.visibility = "visible";
        let renderingQueue = [];
        this.state.data.forEach(d => {
          if (d.bounds) {
            renderingQueue.push({
              diskId:   d.diskId,
              children: d.children,
              averVal:  d.averVal,
              lat:      d.lat,
              lng:      d.lng,
              bounds:   d.bounds
            });
          }
        });
        this.bufferPaintDisks(
          renderingQueue.sort((a, b) => a.diskId - b.diskId)
        );
        this.end["disks"] = true;
      } else {
        this.end["disks"] = false;
      }

      this.updated = true;
      if (this.timers.length) {
        this.progress.start(this.timers.length);
      }
    }
  };

  clearTimers() {
    this.progress.close();
    this.timers.forEach(timer => {
      clearTimeout(timer);
    });
    this.timers = [];
  }

  static async waitTillReady() {
    const map = Map.cur;
    if (!map || !map.map.current) {
      throw "Cannot get Map instance";
    }

    if (
      !map.map.current.ready() || !map.map.current.map._fullyLoaded
      || map.map.current.map._moving || map.map.current.map._zooming
    ) {
      return await new Promise(resolve => {
        setTimeout(() => {
          resolve(Map.waitTillReady());
        }, 400);
      });
    }

    return true;
  }

  /**
   * 数据格式: [id, screenX, screenY, value(0-1)]
   *
   * @static
   * @returns {MapSnapshot}
   * @memberof Map
   */
  static async takeSnapshot() {
    let list = [];
    const map = Map.cur;
    if (!map || !map.map.current) {
      return {
        width: 0,
        height: 0,
        data: []
      };
    }
    
    if (
      !map.map.current.ready() || !map.map.current.map._fullyLoaded
      || map.map.current.map._moving || map.map.current.map._zooming
    ) {
      return await new Promise(resolve => {
        setTimeout(() => {
          resolve(Map.takeSnapshot());
        }, 400);
      });
    }
    
    const max = map.max;
    map.state.data.forEach(d => {
      const pos = map.map.current.project(d);
      if (pos.x < 0 || pos.x > map.width || pos.y < 0 || pos.y > map.height) {
        return;
      }
      const item = [d.id, pos.x, pos.y, d.value / max];
      list.push(item);
    });

    return {
      width: map.width,
      height: map.height,
      data: list
    };
  }
  
  static project(lng, lat) {
    const map = Map.cur;
    if (!map || !map.map.current) {
      return [NaN, NaN];
    }
    return map.map.current.project({ lng, lat });
  }

  /**
   * 绘制散点.
   *
   * @protected
   * @param {Array<{x: number; y:number; val: number;}>} list
   * @param {number} [step=800]
   * @returns {void}
   * @memberof Map
   */
  bufferPaintScatters(list, step=800) {
    const ctx = this.ctx["scatters"];
    if (!ctx) return;

    let piece = [];

    const paint = () => {
      const pieceCopy = piece.map(d => d);
      this.timers.push(
        setTimeout(() => {
          this.updated = true;

          pieceCopy.forEach(d => {
            ctx.fillStyle = this.state.colorMap.project(d.val / this.max);
            ctx.strokeStyle = d3.interpolateHsl(
              ctx.fillStyle, "rgb(30,30,30)"
            )(0.8);
            ctx.strokeRect(
              d.x - 1.5, d.y - 1.5, 3, 3
            );
            ctx.fillRect(
              d.x - 1.5, d.y - 1.5, 3, 3
            );
          });

          this.progress.next();
        }, 1 * this.timers.length)
      );
      piece = [];
    };

    list.forEach(d => {
      if (
        d.x < 0 - 1
        || d.x >= this.width + 1
        || d.y < 0 - 1
        || d.y >= this.height + 1
      ) return;
      piece.push(d);
      if (piece.length === step) {
        paint();
      }
    });

    if (piece.length) {
      paint();
    }
  }

  /**
   * 绘制分类.
   *
   * @protected
   * @param {Array<{x: number; y:number; val: number;}>} list
   * @param {number} [step=800]
   * @returns {void}
   * @memberof Map
   */
  bufferPaintGroups(list, step=800) {
    const ctx = this.ctx["groups"];
    if (!ctx) return;

    let piece = [];

    const paint = () => {
      const pieceCopy = piece.map(d => d);
      this.timers.push(
        setTimeout(() => {
          this.updated = true;

          pieceCopy.forEach(d => {
            const gs = [
              "rgb(200,100,225)",
              "rgb(120,170,255)",
              "rgb(242,0,0)",
              "rgb(48,144,0)",
              "rgb(142,0,142)",
              "rgb(190,160,100)",
              "rgb(250,198,210)",
              "rgb(180,255,0)",
              "rgb(111,196,82)",
              "rgb(255,180,0)",
              "rgb(130,40,0)",
              "rgb(255,100,85)",
              "rgb(0,90,230)",
              "rgb(175,175,175)",
              "rgb(60,110,130)",
              "rgb(255,242,0)"
            ];
            ctx.fillStyle = gs[d.ss[0] % gs.length];
            ctx.strokeStyle = d3.interpolateHsl(
              ctx.fillStyle, "rgb(30,30,30)"
            )(0.4);
            
            const start = Math.PI * 2 / (d.ss[0] % 6 + 1);
            const len = 1/2 + 5/6 * d.ss[0] / d.ss[1] * 0;
            ctx.beginPath();
            ctx.arc(d.x, d.y, 4.8, start, start + Math.PI * len);
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
            
            ctx.fillStyle = this.state.colorMap.project(d.val / this.max);
            ctx.beginPath();
            ctx.arc(d.x, d.y, 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
          });

          this.progress.next();
        }, 1 * this.timers.length)
      );
      piece = [];
    };

    list.forEach(d => {
      if (
        d.x < 0 - 1
        || d.x >= this.width + 1
        || d.y < 0 - 1
        || d.y >= this.height + 1
      ) return;
      piece.push(d);
      if (piece.length === step) {
        paint();
      }
    });

    if (piece.length) {
      paint();
    }
  }

  /**
   * 绘制蓝噪声泊松盘.
   *
   * @protected
   * @param {Array<{x: number; y:number; val: number; averVal: number; r: number;}>} list
   * @param {number} [step=100]
   * @returns {void}
   * @memberof Map
   */
  bufferPaintDisks(list, step = 100) {
    const ctx = this.ctx["disks"];
    if (!ctx) return;

    const total = Root.getPopulation(this.state.name.split(".")[0]);

    let piece = [];

    const paint = () => {
      const pieceCopy = piece.map(d => d);
      this.timers.push(
        setTimeout(() => {
          this.updated = true;

          pieceCopy.forEach(d => {
            const color = this.state.colorMap.project(d.averVal / this.max);
            ctx.strokeStyle = color;
            const { x, y } = this.map.current.project(d);
            const at_n = this.map.current.project([d.lng, d.bounds[1][1]]).y;
            const at_s = this.map.current.project([d.lng, d.bounds[0][1]]).y;
            const at_w = this.map.current.project([d.bounds[1][0], d.lat]).x;
            const at_e = this.map.current.project([d.bounds[0][0], d.lat]).x;
            const lo_n = y + (at_n - y) / 1.057;
            const lo_s = y + (at_s - y) / 1.057;
            const lo_w = x + (at_w - x) / 1.057;
            const lo_e = x + (at_e - x) / 1.057;
            ctx.beginPath();
            ctx.moveTo(x, at_n);
            ctx.quadraticCurveTo(lo_e, lo_n, at_e, y);
            ctx.quadraticCurveTo(lo_e, lo_s, x, at_s);
            ctx.quadraticCurveTo(lo_w, lo_s, at_w, y);
            ctx.quadraticCurveTo(lo_w, lo_n, x, at_n);
            ctx.stroke();
            ctx.closePath();

            ctx.globalAlpha = 0.4;
            d.children.forEach(i => {
              const p = total[i];
              const { x: px, y: py } = this.map.current.project(p);
              ctx.strokeStyle = this.state.colorMap.project(p.value / this.max);
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(x, y);
              ctx.stroke();
              ctx.closePath();
            });

            ctx.globalAlpha = 1;
            d.children.forEach(i => {
              const p = total[i];
              const { x: px, y: py } = this.map.current.project(p);
              ctx.strokeStyle = this.state.colorMap.project(p.value / this.max);
              ctx.strokeRect(px - 1, py - 1, 2, 2);
              ctx.clearRect(px - 0.5, py - 0.5, 1, 1);
            });
          });

          this.progress.next();
        }, 1 * this.timers.length)
      );
      piece = [];
    };

    list.forEach(d => {
      piece.push({
        ...d
      });
      if (piece.length === step) {
        paint();
      }
    });

    if (piece.length) {
      paint();
    }
  }

  /**
   * 绘制维诺图.
   *
   * @protected
   * @returns {void}
   * @memberof Map
   */
  async paintVoronoi() {
    const ctx = this.ctx["polygons"];
    const ctx_s = this.ctx["p_strokes"];
    if (!ctx || !ctx_s) return;

    if (this.voronoiPolygons.length === 0) {
      this.makeVoronoi().then(res => {
        if (res) {
          this.paintVoronoi();
        }
      });
      return;
    }

    this.updated = true;

    this.voronoiPolygons.forEach(({ polygons, averVal }) => {
      if (polygons) {
        this.timers.push(
          setTimeout(() => {
            try {
              const color = this.state.colorMap.project(averVal / this.max);
              ctx.fillStyle = color;
              ctx_s.strokeStyle = "rgb(110,110,110)";
              ctx.beginPath();
              ctx_s.beginPath();
              polygons.forEach((p, i) => {
                if (i) {
                  ctx.lineTo(p[0], p[1]);
                  ctx_s.lineTo(p[0], p[1]);
                } else {
                  ctx.moveTo(p[0], p[1]);                
                  ctx_s.moveTo(p[0], p[1]);
                }
              });
              if (this.state.layers.filter(l => l.label === "polygons")[0].active) {
                ctx.fill();
              }
              if (this.state.layers.filter(l => l.label === "p_strokes")[0].active) {
                ctx_s.stroke();
              }
              ctx.closePath();
              ctx_s.closePath();
            } catch {}

            this.progress.next();
          }, 1 * this.timers.length)
        );
      }
    });

    this.end["polygons"] = true;
  }

  async makeVoronoi() {
    if (!this.map.current) {
      return Promise.resolve(false);
    } else if (this.voronoiPolygons.length) {
      return Promise.resolve(true);
    }

    const calculated = this.state.data.length === this.voronoiPolygonsPrev.length;

    const log = "Generating Voronoi Diagram";
    if (!calculated) {
      this.setState({
        running:  [log]
      });
    }
    
    const delaunay = d3.Delaunay.from(
      this.state.data.map(d => {
        try {
          const a = this.map.current.project([d.lng, d.lat]);
          
          return [a.x, a.y];
        } catch (error) {
          console.warn(d, error)
          
          return [0, 0];
        }
      }).concat(this.state.borders.map(b => {
        const a = this.map.current.project(b);
        return [a.x, a.y];
      }))
    );
    const voronoi = delaunay.voronoi(
      [ -0.5, -0.5, this.width + 1, this.height + 1]
    );
    
    const voronoiPolygons = this.state.data.map((_, i) => ({
      polygons: voronoi.cellPolygon(i),
      values:   calculated ? this.voronoiPolygonsPrev[i].values : [],
      averVal:  calculated ? this.voronoiPolygonsPrev[i].averVal : NaN
    }));

    const population = Root.getPopulation(this.state.name.split(".")[0]).map(d => {
      const { x, y } = Map.project(d.lng, d.lat);
      return { x, y, value: d.value };
    });

    const polygonsCenters = this.state.data.map(d => this.map.current.project([d.lng, d.lat]));

    const p = await new Promise(res => {
      if (calculated) {
        this.voronoiPolygons = voronoiPolygons;
        this.voronoiPolygonsPrev = this.voronoiPolygons;
        res(true);
        return;
      }
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
      const worker = new Worker("/worker.js");
      this.setState({
        valuation:  worker
      });
      worker.postMessage({
        req:              "gen",
        population,
        voronoiPolygons,
        polygonsCenters
      });
      worker.onmessage = e => {
        this.setState({
          running: this.state.running.filter(e => e !== log)
        });
        if (this.worker === worker) {
          worker.terminate();
          this.worker = null;
          // console.log(e.data);
          this.voronoiPolygons = e.data;
          this.voronoiPolygonsPrev = this.voronoiPolygons;
          res(true);
        } else {
          res(false);
        }
      };
      this.worker = worker;
    });

    return p;
  }

  async evaluateVoronoi() {
    const worker = new Worker("/worker.js");
    this.setState({
      evaluation: worker
    });
    
    if (this.voronoiPolygons.length === 0) {
      await this.makeVoronoi();
    }

    setTimeout(() => {
      worker.postMessage({
        req:              "evl",
        voronoiPolygons:  this.voronoiPolygons
      });
      worker.onmessage = e => {
        // console.log(e.data);
        worker.terminate();
        this.setState({
          evaluation: e.data
        });
      };
    }, 100);
  }

};

export default Map;
