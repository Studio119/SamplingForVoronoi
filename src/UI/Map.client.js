/*
 * @Author: Antoine YANG 
 * @Date: 2020-08-20 22:43:10 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-03-14 17:54:41
 */

import React, { Component, createRef } from "react";
import MapBox from "../react-mapbox/MapBox";
import * as d3 from "d3";
import { Root } from "../App.server";
import { HilbertEncodeXY } from "../help/hilbertEncoder";
import axios from "axios";


const getColor = (colormap, val, max) => {
  const valTransformed = (val / max) ** colormap.exp;
  const len = colormap.colors.length;
  const idx = Math.min((valTransformed * len) | 0, len - 1);
  return colormap.colors[idx];
};

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
      // 新增
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

  update(name, data, layers, colorize, borders, setBorders) {
    if (name !== this.state.name) {
      // 选页卡切换
      // console.log("选页卡切换");
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
          const ex = (xmax - xmin) / 8;
          xmin -= ex;
          xmax += ex;
        }
  
        if (ymin !== ymax) {
          const ex = (ymax - ymin) / 8;
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

    this.setState({ name, data, layers, colorize, borders, setBorders });
  }

  setInterpolationConfig(config) {
    let shouldUpdate = false;
    for (const key in config) {
      if (config.hasOwnProperty(key)) {
        const value = config[key];
        if (value !== this.state.interpolationConfig[key]) {
          shouldUpdate = true;
        }
      }
    }
    if (!shouldUpdate) {
      return;
    }

    this.setState({
      interpolationConfig: {
        ...this.state.interpolationConfig,
        ...config
      }
    });

    if (this.state.name && this.state.layers.filter(d => d.label === "interpolation")[0].active) {
      // 更新
      this.clearTimers();
      this.paintInterpolation();
    }
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
      colorize:   {
        colors: [
          "rgb(237,233,76)",
          "rgb(223,132,79)",
          "rgb(38,178,27)",
          "rgb(141,193,255)",
          "rgb(255,43,204)",
          "rgb(9,71,148)",
          "rgb(148,27,169)",
          "rgb(255,0,0)"
        ],
        exp: 1
      },
      interpolationConfig: {
        pixelStep:  5,
        differ:     false,
        maxDist:    100,
        minNeigh:   8,
        manhattan:  false
      }
    };

    Map.cur = this;

    this.max = 0;

    this.container = createRef();
    this.id = "T" + (new Date()).getTime();

    this.width = 0;
    this.height = 0;

    this.voronoiPolygons = [];

    this.map = createRef();

    this.ctx = {
      "scatters": null,
      "p_stroke": null,
      "polygons": null,
      "groups":   null,
      "disks":    null,
      // "links":    null,
      // "interpolation":    null
    };
    this.end = {
      "scatters": true,
      "p_stroke": true,
      "polygons": true,
      "groups":   null,
      "disks":    true,
      // "links":    null,
      // "interpolation":    true
    };

    this.progress = {
      count: 0,
      flag: 0,
      ref: createRef(),
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
          this.progress.ref.current.style.visibility = "visible";
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
                    backgroundColor: "rgb(27,27,27)",
                    filter: "grayscale(0.9)"
                  }} >
                    <MapBox ref={ this.map }
                      id={ this.id }
                      onBoundsChanged = {
                        () => {
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
        } else if (target === "polygons") {
          this.ctx["polygons"].clearRect(0, 0, this.width, this.height);
          this.ctx["p_strokes"].clearRect(0, 0, this.width, this.height);
          this.makeVoronoi();
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
        } else if (target === "interpolation") {
          this.ctx["interpolation"].clearRect(0, 0, this.width, this.height);
          this.paintInterpolation();
        }
        // else if (target === "links") {
        //   this.ctx["links"].clearRect(0, 0, this.width, this.height);
        //   this.paintLinks();
        // }
        this.end[target] = true;
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
      if (this.state.layers.filter(d => d.label === "scatters")[0].active) {
        document.getElementById("layer-scatters").style.visibility = "visible";
        this.ctx["scatters"].clearRect(0, 0, this.width, this.height);
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
        document.getElementById("layer-groups").style.visibility = "visible";
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
        this.end["groups"] = true;
      } else {
        this.end["groups"] = false;
      }
      // voronoi polygons
      if (this.state.layers.filter(d => d.label === "polygons")[0].active) {
        document.getElementById("layer-polygons").style.visibility = "visible";
        this.ctx["polygons"].clearRect(0, 0, this.width, this.height);
        this.ctx["p_strokes"].clearRect(0, 0, this.width, this.height);
        this.makeVoronoi();
        this.paintVoronoi();
        this.end["polygons"] = true;
      } else {
        this.end["polygons"] = false;
      }
      // BNS disks
      const layerDisks = this.state.layers.filter(d => d.label === "disks")[0];
      if (layerDisks && layerDisks.active) {
        document.getElementById("layer-disks").style.visibility = "visible";
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
        this.end["disks"] = true;
      } else {
        this.end["disks"] = false;
      }
      const layerInterpolation = this.state.layers.filter(d => d.label === "interpolation")[0];
      // interpolation
      if (layerInterpolation && layerInterpolation.active) {
        document.getElementById("layer-interpolation").style.visibility = "visible";
        this.ctx["interpolation"].clearRect(0, 0, this.width, this.height);
        this.paintInterpolation();
        this.end["interpolation"] = true;
      } else {
        this.end["interpolation"] = false;
      }
      // // links
      // if (this.state.layers.filter(d => d.label === "links")[0].active) {
      //   document.getElementById("layer-links").style.visibility = "visible";
      //   this.ctx["links"].clearRect(0, 0, this.width, this.height);
      //   this.paintLinks();
      //   this.end["links"] = true;
      // } else {
      //   this.end["links"] = false;
      // }

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
            ctx.fillStyle = getColor(this.state.colorize, d.val, this.max);
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
            
            ctx.fillStyle = getColor(this.state.colorize, d.val, this.max);
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
            const color = getColor(this.state.colorize, d.averVal, this.max);
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

            ctx.globalAlpha = 0.08;
            d.children.forEach(i => {
              const p = total[i];
              const { x: px, y: py } = this.map.current.project(p);
              ctx.strokeStyle = getColor(this.state.colorize, p.value, this.max);
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(x, y);
              ctx.stroke();
              ctx.closePath();
            });

            ctx.globalAlpha = 0.4;
            d.children.forEach(i => {
              const p = total[i];
              const { x: px, y: py } = this.map.current.project(p);
              ctx.strokeStyle = getColor(this.state.colorize, p.value, this.max);
              ctx.strokeRect(px - 1, py - 1, 2, 2);
              ctx.clearRect(px - 0.5, py - 0.5, 1, 1);
            });

            ctx.globalAlpha = 1;
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
  paintVoronoi() {
    const ctx = this.ctx["polygons"];
    const ctx_s = this.ctx["p_strokes"];
    if (!ctx || !ctx_s) return;

    this.updated = true;

    this.voronoiPolygons.forEach((polygon, i) => {
      if (polygon) {
        this.timers.push(
          setTimeout(() => {
            try {
              const color = getColor(
                this.state.colorize,
                this.state.data[i].averVal || this.state.data[i].value,
                this.max
              );
              ctx.fillStyle = color;
              ctx_s.strokeStyle = "rgb(110,110,110)";
              ctx.beginPath();
              ctx_s.beginPath();
              polygon.forEach((p, i) => {
                if (i) {
                  ctx.lineTo(p[0], p[1]);
                  ctx_s.lineTo(p[0], p[1]);
                } else {
                  ctx.moveTo(p[0], p[1]);                
                  ctx_s.moveTo(p[0], p[1]);
                }
              });
              ctx.fill();
              ctx_s.stroke();
              ctx.closePath();
              ctx_s.closePath();
            } catch {}

            this.progress.next();
          }, 1 * this.timers.length)
        );
      }
    });
  }

  makeVoronoi() {
    if (!this.map.current) {
        return [];
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
    
    this.voronoiPolygons = this.state.data.map((_, i) => voronoi.cellPolygon(i));

    this.valueVoronoi();
  }

  valueVoronoi() {
    const population = Root.getPopulation(this.state.name.split(".")[0]).map(d => {
      const { x, y } = Map.project(d.lng, d.lat);
      return { x, y, value: d.value * 100 };
    });
    const worker = new Worker("/worker.js");
    worker.postMessage({
      data:             this.state.data.map(d => (d.averVal || d.value) * 100),
      voronoiPolygons:  this.voronoiPolygons.map(p => p.slice(1)),
      polygonsCenters:  this.state.data.map(d => this.map.current.project([d.lng, d.lat])),
      population
    });
    worker.onmessage = e => {
      console.log(e.data);
      worker.terminate();
    };
  }

  getIDW(x, y, data, code, origin) {
    const {
      differ,
      maxDist,
      minNeigh,
      manhattan
    } = this.state.interpolationConfig;

    // 原始样本数据
    let countNeighbors = true;
    let curVal = 0;
    let curWeight = 0;
    let curReal = 0;
    let curRealCount = 0;
    const _origin = origin.map(d => {
      return {
        ...d,
        dist: Math.abs(
          parseInt(code, 2) - parseInt(d.code, 2)
        )
      };
    }).sort((a, b) => a.dist - b.dist).slice(
      0, minNeigh * 2
    ).map(d => {
      const dist = manhattan ? (
        Math.abs(d.x - x) + Math.abs(d.y - y)
      ) : (
        Math.pow(d.x - x, 2) + Math.pow(d.y - y, 2)
      );
      if (dist < 1) {
        // 视为重叠
        countNeighbors = false;
      }
      return {
        ...d,
        dist
      };
    });
    for (let i = 0; i < _origin.length; i++) {
      if (_origin[i].dist > maxDist && i >= minNeigh) {
        // 范围超出且数量满足
        break;
      } else if (!countNeighbors && _origin[i].dist >= 1) {
        // 权重为0
        break;
      }
      if (countNeighbors) {
        const w = 1 / _origin[i].dist;
        curVal += _origin[i].value * w;
        curWeight += w;
      } else {
        curReal += _origin[i].value;
        curRealCount += 1;
      }
    }
    const preInterpolation = countNeighbors ? (
      curVal / curWeight
    ) : (curReal / curRealCount);

    if (!differ) {
      return preInterpolation;
    }

    // 计算当前
    countNeighbors = true;
    curVal = 0;
    curWeight = 0;
    curReal = 0;
    curRealCount = 0;
    const _data = data.map(d => {
      return {
        ...d,
        dist: Math.abs(
          parseInt(code, 2) - parseInt(d.code, 2)
        )
      };
    }).sort((a, b) => a.dist - b.dist).slice(
      0, minNeigh * 2
    ).map(d => {
      const dist = manhattan ? (
        Math.abs(d.x - x) + Math.abs(d.y - y)
      ) : (
        Math.pow(d.x - x, 2) + Math.pow(d.y - y, 2)
      );
      if (dist < 1) {
        // 视为重叠
        countNeighbors = false;
      }
      return {
        ...d,
        dist
      };
    });
    for (let i = 0; i < _data.length; i++) {
      if (_data[i].dist > maxDist && i >= minNeigh) {
        // 范围超出且数量满足
        break;
      } else if (!countNeighbors && _data[i].dist >= 1) {
        // 权重为0
        break;
      }
      if (countNeighbors) {
        const w = 1 / _data[i].dist;
        curVal += _data[i].value * w;
        curWeight += w;
      } else {
        curReal += _data[i].value;
        curRealCount += 1;
      }
    }
    const curInterpolation = countNeighbors ? (
      curVal / curWeight
    ) : (curReal / curRealCount);
    return Math.abs(curInterpolation - preInterpolation);
  }

  paintInterpolation() {
    const ctx = this.ctx["interpolation"];
    if (!ctx) return;

    this.updated = true;

    // 用 Hilbert 编码优化查找
    const size = Math.max(this.width, this.height);
    const data = this.state.data.map(d => {
      const { x, y } = this.map.current.project([d.lng, d.lat]);
      return {
        x, y,
        value: d.value,
        code: HilbertEncodeXY(x, y, size, 16)
      };
    });
    const origin = Root.getPopulation(this.state.name.split(".")[0]).map(d => {
      const { x, y } = this.map.current.project([d.lng, d.lat]);
      return {
        x, y,
        value: d.value,
        code: HilbertEncodeXY(x, y, size, 16)
      };
    });

    for (let _y = 0; _y < this.height; _y += this.state.interpolationConfig.pixelStep) {
      const y = _y + this.state.interpolationConfig.pixelStep / 2;
      for (let _x = 0; _x < this.width; _x += this.state.interpolationConfig.pixelStep) {
        const x = _x + this.state.interpolationConfig.pixelStep / 2;
        const code = HilbertEncodeXY(x, y, size, 16);
        this.timers.push(
          setTimeout(() => {
            const val = this.getIDW(x, y, data, code, origin);
            const color = getColor(this.state.colorize, val, this.max);
            ctx.fillStyle = color;
            ctx.fillRect(
              _x, _y,
              this.state.interpolationConfig.pixelStep,
              this.state.interpolationConfig.pixelStep
            );

            this.progress.next();
          }, 2 * this.timers.length)
        );
      }
    }
  }

  connectCluster(cluster) {
    let links = [];

    for (let i = 0; i < cluster.length - 1; i++) {
      for (let j = i + 1; j < cluster.length; j++) {
        const dist = Math.sqrt(
          Math.pow(cluster[i].x - cluster[j].x, 2)
          + Math.pow(cluster[i].y - cluster[j].y, 2)
        );
        if (dist < 4) {
          links.push([[cluster[i].x, cluster[i].y], [cluster[j].x, cluster[j].y]]);
        }
      }
    }

    return links;
  }

  paintLinks() {
    if (!this.state.name) {
      return;
    }
    const ctx = this.ctx["links"];
    if (!ctx) return;

    this.updated = true;

    axios.get(`/clustering/${this.state.name.split(".")[0]}`).then(res => {
      if (res.data.status) {
        const groups = res.data.data.filter(grp => grp.length).map(grp => {
          return grp.map(d => {
            const p = this.state.data[d];
            return {
              ...p,
              ...this.map.current.project([p.lng, p.lat])
            };
          });
        });

        groups.forEach(grp => {
          this.timers.push(
            setTimeout(() => {              
              // const links = this.connectCluster(grp);
    
              ctx.strokeStyle = getColor(this.state.colorize, grp[0].value, this.max);
    
              // ctx.beginPath();
    
              // links.forEach(link => {
              //   ctx.moveTo(link[0][0], link[0][1]);
              //   ctx.lineTo(link[1][0], link[1][1]);
              //   ctx.stroke();
              // });

              for (let i = 0; i < grp.length - 1; i++) {
                for (let j = i + 1; j < grp.length; j++) {
                  setTimeout(() => {
                    ctx.strokeStyle = getColor(this.state.colorize, grp[0].value, this.max);
                    ctx.beginPath();
                    ctx.moveTo(grp[i].x, grp[i].y);
                    ctx.lineTo(grp[j].x, grp[j].y);
                    ctx.stroke();
                    ctx.closePath();
                  }, i * 2);
                  // ctx.moveTo(grp[i].x, grp[i].y);
                  // ctx.lineTo(grp[j].x, grp[j].y);
                  // ctx.stroke();
                }
              }

              // grp.forEach(node => {
              //   ctx.fillStyle = d3.interpolateHsl(
              //     this.state.colorize[0], this.state.colorize[1]
              //   )(Math.pow(node.value / this.max, this.state.colorize[2]));
              //   ctx.fillRect(node.x - 1.5, node.y - 1.5, 3, 3);
              //   ctx.strokeRect(node.x - 1.5, node.y - 1.5, 3, 3);
              // });
    
              // ctx.closePath();
              
              this.progress.next();
            }, this.timers.length)
          );
        });
      }
    });
  }

};

export default Map;
