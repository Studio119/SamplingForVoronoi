/*
 * @Author: Antoine YANG 
 * @Date: 2020-08-20 22:43:10 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-19 19:46:07
 */

import React, { Component, createRef } from "react";
import MapBox from "../react-mapbox/MapBox";
import * as d3 from "d3";


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

class Map extends Component {

  getVoronoiPolygons() {
    let shapes = this.voronoiPolygons;

    return {
      width: map.width,
      height: map.height,
      data: shapes
    };
  }

  update(name, data, layers, colorize) {
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
      if (this.state.colorize.toString() !== colorize.toString()) {
        // 映射规则改变
        // console.log("映射规则改变");
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
    
    this.setState({ name, data, layers, colorize });
  }

  constructor(props) {
    super(props);
    this.state = {
      container:  false,
      name:       null,
      data:       [],
      layers:     [],
      colorize:   ["rgb(100,156,247)", "rgb(255,13,10)", 0.5]
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
      "trace":    null,
      "polygons": null,
      "disks":    null
    };
    this.end = {
      "scatters": true,
      "trace":    true,
      "polygons": true,
      "disks":    true
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
  }

  componentDidUpdate() {
    if (this.state.container && this.state.data.length && this.map.current) {
      const canvas = this.container.current.querySelectorAll(".MapCanvas");
      this.state.layers.forEach((layer, i) => {
        this.ctx[layer.label] = canvas[i].getContext("2d");
      });
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
        } else if (target === "polygons") {
          this.ctx["polygons"].clearRect(0, 0, this.width, this.height);
          this.makeVoronoi();
          this.paintVoronoi();
        }
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
      // voronoi polygons
      if (this.state.layers.filter(d => d.label === "polygons")[0].active) {
        document.getElementById("layer-polygons").style.visibility = "visible";
        this.ctx["polygons"].clearRect(0, 0, this.width, this.height);
        this.makeVoronoi();
        this.paintVoronoi();
        this.end["polygons"] = true;
      } else {
        this.end["polygons"] = false;
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

  /**
   * 数据格式: [id, screenX, screenY, value(0-1)]
   *
   * @static
   * @returns {MapSnapshot}
   * @memberof Map
   */
  static takeSnapshot() {
    let list = [];
    const map = Map.cur;
    if (!map || !map.map.current) {
      return {
        width: 0,
        height: 0,
        data: []
      };
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
            ctx.fillStyle = d3.interpolateHsl(
              this.state.colorize[0], this.state.colorize[1]
            )(Math.pow(d.val / this.max, this.state.colorize[2]));
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

    let piece = [];

    const paint = () => {
      const pieceCopy = piece.map(d => d);
      this.timers.push(
        setTimeout(() => {
          this.updated = true;

          pieceCopy.forEach(d => {
            ctx.fillStyle = d3.interpolateHsl(
              this.state.colorize[0], this.state.colorize[1]
            )(Math.pow(d.averVal / this.max, this.state.colorize[2]));
            ctx.strokeStyle = d3.interpolateHsl(
              this.state.colorize[0], this.state.colorize[1]
            )(Math.pow(d.averVal / this.max, this.state.colorize[2]));
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.fillStyle = d3.interpolateHsl(
              this.state.colorize[0], this.state.colorize[1]
            )(Math.pow(d.val / this.max, this.state.colorize[2]));
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
    if (!ctx) return;

    this.updated = true;

    this.voronoiPolygons.forEach((polygon, i) => {
      if (polygon) {
        this.timers.push(
          setTimeout(() => {
            try {
              const color = d3.interpolateHsl(
                this.state.colorize[0], this.state.colorize[1]
              )(Math.pow(this.state.data[i].value / this.max, this.state.colorize[2]));
              ctx.fillStyle = color;
              ctx.strokeStyle = "rgb(105,105,105)";
              ctx.beginPath();
              polygon.forEach((p, i) => {
                if (i) {
                  ctx.lineTo(p[0], p[1]);
                } else {
                  ctx.moveTo(p[0], p[1]);
                }
              });
              ctx.fill();
              ctx.stroke();
              ctx.closePath();
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
      })
    );
    const voronoi = delaunay.voronoi(
      [ -0.5, -0.5, this.width + 1, this.height + 1]
    );
    
    this.voronoiPolygons = this.state.data.map((_, i) => voronoi.cellPolygon(i));
  }

};

export default Map;
