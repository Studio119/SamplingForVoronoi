/*
 * @Author: Antoine YANG 
 * @Date: 2020-08-20 22:43:10 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-18 02:33:21
 */

import React, { Component, createRef } from "react";
import MapBox from "../react-mapbox/MapBox";
import * as d3 from "d3";


class Map extends Component {

  static getVoronoiPolygons() {
    const map = Map.cur;
    let shapes = [];

    if (map) {
      shapes = map.voronoiPolygons;
    }

    return {
      width: map.width,
      height: map.height,
      data: shapes
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      container: false
    };

    this.data = this.props.data;
    this.max = Math.max(...this.data.map(d => d.value));

    Map.cur = this;

    this.container = createRef();
    this.id = "T" + (new Date()).getTime() + "_" + this.props.index;

    this.width = 0;
    this.height = 0;

    this.voronoiPolygons = [];

    this.map = createRef();

    this.ctx = {};

    this.props.layers.forEach(layer => {
      this.ctx[layer.label] = null;
    });

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
                    backgroundColor: "rgb(27,27,27)"
                  }} >
                    <MapBox ref={ this.map } data={ this.data }
                      id={ this.id }
                      onBoundsChanged = {
                        () => {
                          this.repaint();
                        }
                      } />
                </div>
                {
                  this.props.layers.map((layer, i) => {
                    return (
                      <div key={ layer.label }
                        style={{
                          display: "block",
                          width: this.width,
                          height: this.height,
                          top: 0 - this.height * (i + 1),
                          position: "relative",
                          pointerEvents: "none"
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
    if (this.state.container) {
      const canvas = this.container.current.querySelectorAll(".MapCanvas");
      this.props.layers.forEach((layer, i) => {
        this.ctx[layer.label] = canvas[i].getContext("2d");
      });
      this.repaint();
    }
  }

  repaint(waiting=true) {
    if (waiting) {
      this.updated = false;
      for (const key in this.ctx) {
        if (this.ctx.hasOwnProperty(key)) {
          const element = this.ctx[key];
          element.clearRect(0, 0, this.width, this.height);
        }
      }
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
      if (this.props.layers.filter(d => d.label === "scatters")[0].active) {
        let renderingQueue = [];
        this.data.forEach(d => {
          renderingQueue.push({
            ...this.map.current.project(d),
            val: d.value
          });
          this.bufferPaintScatters(renderingQueue);
        });
      }
      // voronoi polygons
      if (this.props.layers.filter(d => d.label === "polygons")[0].active) {
        this.makeVoronoi();
        this.paintVoronoi();
      }

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
    map.props.data.forEach(d => {
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
   * @param {number} [step=100]
   * @returns {void}
   * @memberof Map
   */
  bufferPaintScatters(list, step=100) {
    const ctx = this.ctx["scatters"];
    if (!ctx) return;return

    let piece = [];

    const paint = () => {
      const pieceCopy = piece.map(d => d);
      this.timers.push(
        setTimeout(() => {
          this.updated = true;

          pieceCopy.forEach(d => {
            ctx.fillStyle = this.props.colorize(d.val, this.max);
            ctx.fillRect(
              d.x - 1.5, d.y - 1.5, 3, 3
            );
          });

          this.progress.next();
        }, 4 * this.timers.length)
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
            ctx.fillStyle = this.props.colorize(d.averVal, this.max).replace(
              "(", "a("
            ).replace(
              ")", ",0.2)"
            );
            ctx.strokeStyle = this.props.colorize(d.averVal, this.max);
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            ctx.fillStyle = this.props.colorize(d.val, this.max);
            ctx.fillRect(
                d.x - 1.5, d.y - 1.5, 3, 3
            );
          });

          this.progress.next();
        }, 4 * this.timers.length)
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
            const color = this.props.colorize(this.data[i].value, this.max);
            ctx.fillStyle = color.replace("(", "a(").replace(")", ",0.8)");
            ctx.strokeStyle = "rgb(170,71,105)";
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

            this.progress.next();
          }, 4 * this.timers.length)
        );
      }
    });
  }

  makeVoronoi() {
    if (!this.map.current) {
        return [];
    }
    
    const delaunay = d3.Delaunay.from(
      this.data.map(d => {
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
    
    this.voronoiPolygons = this.data.map((_, i) => voronoi.cellPolygon(i));
  }

};

export default Map;
