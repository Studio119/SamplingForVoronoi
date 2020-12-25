/*
 * @Author: Kanata You 
 * @Date: 2020-12-15 10:51:28 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-25 20:16:18
 */

import { geodata } from "../types";
import { Map, MapSwitchExtension, MapButtonExtension } from "./Map";
import { connect } from "react-redux";
import { DataCenter } from "../reducers/DataCenter";
import * as d3 from "d3";


// @ts-ignore
@connect(DataCenter.mapStateToProps)
export class SamplingView extends Map {

    protected readonly scatterSwitch: MapSwitchExtension = {
        type: "switch",
        text: "scatter",
        value: true,
        executer: (value, finish) => {
            this.scatterSwitch.value = value;
            if (value) {
                this.canvas3.current!.style.visibility = "visible";
            } else {
                this.canvas3.current!.style.visibility = "hidden";
            }
            finish();
        }
    };

    protected readonly diskSwitch: MapSwitchExtension = {
        type: "switch",
        text: "disk",
        value: true,
        executer: (value, finish) => {
            this.diskSwitch.value = value;
            if (value) {
                this.canvas0.current!.style.visibility = "visible";
            } else {
                this.canvas0.current!.style.visibility = "hidden";
            }
            finish();
        }
    };

    protected readonly interpolationSwitch: MapSwitchExtension = {
        type: "switch",
        value: false,
        text: "interpolation",
        executer: (value, finish) => {
            this.interpolationSwitch.value = value;
            if (!this.map.current!.ready()) {
                finish();
                return;
            }
            if (value) {
                if (this.props.filter === "population") {
                    this.props.data.then(res => {
                        this.clearTimers();
                        this.paintInterpolation(res);
                        this.progress.start(this.timers.length);
                        finish();
                    });
                } else if (this.props.filter === "sample") {
                    this.props.sample!.then(res => {
                        this.clearTimers();
                        this.paintInterpolation(res);
                        this.progress.start(this.timers.length);
                        finish();
                    });
                } else if (this.props.filter === "drifted") {
                    this.props.sample!.then(res => {
                        this.clearTimers();
                        this.paintInterpolation(res);
                        this.progress.start(this.timers.length);
                        finish();
                    });
                }
            } else {
                finish();
            }
        }
    };

    protected readonly traceSwitch: MapSwitchExtension = {
        type: "switch",
        text: "trace",
        value: true,
        executer: (value, finish) => {
            this.traceSwitch.value = value;
            if (value) {
                this.canvas1.current!.style.visibility = "visible";
            } else {
                this.canvas1.current!.style.visibility = "hidden";
            }
            finish();
        }
    };

    protected readonly delaunayButton: MapButtonExtension = {
        type: "button",
        text: "delaunay",
        executer: finish => {
            if (!this.map.current!.ready()) {
                finish();
                return;
            }
            if (this.props.filter === "population") {
                this.props.data.then(res => {
                    this.voronoiPolygons = this.makeVoronoi(res);
                });
            } else if (this.props.filter === "drifted") {
                this.props.drifted!.then(res => {
                    this.voronoiPolygons = this.makeVoronoi(res);
                });
            } else {
                this.props.sample!.then(res => {
                    this.voronoiPolygons = this.makeVoronoi(res);
                });
            }
            if (this.voronoiSwitch.value) {
                this.repaint();
            }
            finish();
        }
    };

    protected readonly voronoiSwitch: MapSwitchExtension = {
        type: "switch",
        text: "voronoi",
        value: true,
        executer: (value, finish) => {
            this.voronoiSwitch.value = value;
            if (value) {
                this.canvas2.current!.style.visibility = "visible";
            } else {
                this.canvas2.current!.style.visibility = "hidden";
            }
            finish();
        }
    };

    public render() {
        if (this.props.filter === "population") {
            this.extensions = [
                this.scatterSwitch,
                this.interpolationSwitch,
                this.diskSwitch,
                this.delaunayButton,
                this.voronoiSwitch
            ];
        } else if (this.props.filter === "sample") {
            this.extensions = [
                this.scatterSwitch,
                this.interpolationSwitch,
                this.diskSwitch,
                this.delaunayButton,
                this.voronoiSwitch
            ];
        } else if (this.props.filter === "drifted") {
            this.extensions = [
                this.scatterSwitch,
                this.interpolationSwitch,
                this.diskSwitch,
                this.delaunayButton,
                this.voronoiSwitch,
                this.traceSwitch
            ];
        }

        return super.render();
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
    protected bufferPaintScatters(list: Array<{x: number; y:number; val: number;}>, step: number = 100): void {
        if (!this.ctx3) return;

        let piece: Array<{x: number; y:number; val: number;}> = [];

        const paint = () => {
            const pieceCopy: {x: number; y:number; val: number;}[] = piece.map(d => d);
            this.timers.push(
                setTimeout(() => {
                    this.updated = true;

                    pieceCopy.forEach(d => {
                        this.ctx3!.fillStyle = this.props.colorize(d.val);
                        this.ctx3!.fillRect(
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
                || d.x >= this.props.width + 1
                || d.y < 0 - 1
                || d.y >= this.props.height + 1
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

        this.progress.start(this.timers.length);
    }

    /**
     * 绘制采样点.
     *
     * @protected
     * @param {Array<{x: number; y:number; val: number; averVal: number; r: number;}>} list
     * @param {number} [step=100]
     * @returns {void}
     * @memberof Map
     */
    protected bufferPaintDisks(list: Array<{x: number; y:number; val: number; averVal: number; r: number;}>, step: number = 100): void {
        if (!this.ctx0 || !this.ctx1 || !this.ctx3) return;

        let piece: Array<{x: number; y:number; val: number; averVal: number; r: number;}> = [];

        const paint = () => {
            const pieceCopy: {x: number; y:number; val: number; averVal: number; r: number;}[] = piece.map(d => d);
            this.timers.push(
                setTimeout(() => {
                    this.updated = true;

                    pieceCopy.forEach(d => {
                        this.ctx0!.fillStyle = this.props.colorize(d.averVal).replace(
                            "(", "a("
                        ).replace(
                            ")", ",0.2)"
                        );
                        this.ctx0!.strokeStyle = this.props.colorize(d.averVal);
                        this.ctx0!.beginPath();
                        this.ctx0!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                        this.ctx0!.fill();
                        this.ctx0!.stroke();
                        this.ctx0!.closePath();
                        this.ctx3!.fillStyle = this.props.colorize(d.val);
                        this.ctx3!.fillRect(
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

        this.progress.start(this.timers.length);
    }

    /**
     * 绘制采样点.
     *
     * @protected
     * @param {Array<{origin: [number, number]; x: number; y:number; val: number; r: number; move: [number, number][];}>} list
     * @param {number} [step=100]
     * @returns {void}
     * @memberof Map
     */
    protected bufferPaintDriftedDisks(list: Array<{origin: [number, number]; x: number; y:number; val: number; r: number; move: [number, number][];}>, step: number = 100): void {
        if (!this.ctx0 || !this.ctx1 || !this.ctx3) return;

        let piece: Array<{origin: [number, number]; x: number; y:number; val: number; r: number; move: [number, number][];}> = [];

        const paint = () => {
            const pieceCopy: {origin: [number, number]; x: number; y:number; val: number; r: number; move: [number, number][];}[] = piece.map(d => d);
            this.timers.push(
                setTimeout(() => {
                    this.updated = true;

                    pieceCopy.forEach(d => {
                        this.ctx0!.fillStyle = this.props.colorize(d.val).replace(
                            "(", "a("
                        ).replace(
                            ")", ",0.2)"
                        );
                        this.ctx0!.strokeStyle = this.props.colorize(d.val);
                        this.ctx0!.beginPath();
                        this.ctx0!.arc(d.origin[0], d.origin[1], d.r, 0, Math.PI * 2);
                        this.ctx0!.fill();
                        this.ctx0!.stroke();
                        this.ctx0!.closePath();
                        this.ctx1!.strokeStyle = this.props.colorize(d.val).replace(
                            "(", "a("
                        ).replace(
                            ")", ",0.2)"
                        );
                        this.ctx1!.beginPath();
                        this.ctx1!.moveTo(d.origin[0], d.origin[1]);
                        d.move.forEach(e => {
                            this.ctx1!.lineTo(e[0], e[1]);
                        });
                        this.ctx1!.stroke();
                        this.ctx1!.closePath();
                        this.ctx3!.fillStyle = this.props.colorize(d.val);
                        this.ctx3!.fillRect(
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

        this.progress.start(this.timers.length);
    }
    
    /**
     * 重绘数据，内部封装绘制模式的分支.
     *
     * @param {boolean} [waiting=true]
     * @returns {void}
     * @memberof Map
     */
    public repaint(waiting: boolean = true): void {
        if (waiting) {
            this.updated = false;
            if (this.ctx0) {
                this.ctx0.clearRect(0, 0, this.props.width, this.props.height);
            }
            if (this.ctx1) {
                this.ctx1.clearRect(0, 0, this.props.width, this.props.height);
            }
            if (this.ctx2) {
                this.ctx2.clearRect(0, 0, this.props.width, this.props.height);
            }
            if (this.ctx3) {
                this.ctx3.clearRect(0, 0, this.props.width, this.props.height);
            }
        }
        if (this.updated) {
            return;
        }
        this.clearTimers();
        if (this.map.current) {
            if (!this.map.current!.ready()) {
                this.updated = false;
                setTimeout(() => {
                    this.repaint(false);
                }, 200);
                return;
            }
            if (this.props.filter === "population") {
                this.props.data.then(res => {
                    let renderingQueue: Array<{x: number; y:number; val: number;}> = [];
                    res.sort((a, b) => b.lat - a.lat).forEach((d: geodata) => {
                        renderingQueue.push({
                            ...this.map.current!.project(d),
                            val: d.value
                        });
                    });
                    this.paintVoronoi(res);
                    this.bufferPaintScatters(renderingQueue);
                });
            } else if (this.props.filter === "drifted") {
                let renderingQueue: Array<{
                    origin: [number, number];
                    x: number; y: number; val: number; r: number; move: [number, number][];
                }> = [];
                this.props.drifted!.then(res => {
                    res.sort((a, b) => b.lat - a.lat).forEach((d: geodata<"drifted">) => {
                        const pos = this.map.current!.project(d);
                        renderingQueue.push({
                            origin: [pos.x, pos.y],
                            x: d.x,
                            y: d.y,
                            val: d.averVal,
                            r: d.radius,
                            move: d.move
                        });
                    });
                    this.paintVoronoi(res);
                    this.bufferPaintDriftedDisks(renderingQueue);
                });
            } else {
                this.props.sample!.then(res => {
                    let renderingQueue: Array<{
                        x: number; y: number; val: number; averVal: number; r: number;
                    }> = [];
                    res.sort((a, b) => b.lat - a.lat).forEach((d: geodata<"sample">) => {
                        renderingQueue.push({
                            ...this.map.current!.project(d),
                            val: d.value,
                            averVal: d.averVal,
                            r: d.radius
                        });
                    });
                    this.paintVoronoi(res);
                    this.bufferPaintDisks(renderingQueue);
                });
            }
        }
    }

    /**
     * 绘制维诺图.
     *
     * @protected
     * @returns {void}
     * @memberof Map
     */
    protected paintVoronoi(data: geodata[] | geodata<"drifted">[]): void {
        if (!this.ctx2) return;

        this.updated = true;

        this.voronoiPolygons.forEach((polygon, i) => {
            if (polygon) {
                this.timers.push(
                    setTimeout(() => {
                        const color = this.props.colorize(data[i].value);
                        this.ctx2!.fillStyle = color.replace("(", "a(").replace(")", ",0.8)");
                        this.ctx2!.strokeStyle = "rgb(170,71,105)";
                        this.ctx2!.beginPath();
                        polygon.forEach((p, i) => {
                            if (i) {
                                this.ctx2!.lineTo(p[0], p[1]);
                            } else {
                                this.ctx2!.moveTo(p[0], p[1]);
                            }
                        });
                        this.ctx2!.fill();
                        this.ctx2!.stroke();
                        this.ctx2!.closePath();

                        this.progress.next();
                    }, 1 * this.timers.length)
                );
            }
        });
    }

    public makeVoronoi(data: geodata[] | geodata<"drifted">[]): d3.Delaunay.Polygon[] {
        if (!this.map.current) {
            return [];
        }
        
        const delaunay = d3.Delaunay.from(
            this.props.filter === "drifted" ? (
                (data as geodata<"drifted">[]).map(d => {
                    try {
                        return [d.x, d.y];
                    } catch (error) {
                        console.warn(d, error)
                        
                        return [0, 0];
                    }
                })
            ) : (
                (data as geodata[]).map(d => {
                    try {
                        const a = this.map.current!.project([d.lng, d.lat]);
                        
                        return [a.x, a.y];
                    } catch (error) {
                        console.warn(d, error)
                        
                        return [0, 0];
                    }
                })
            )
        );
        const voronoi = delaunay.voronoi(
            [ -0.5, -0.5, this.props.width + 1, this.props.height + 1]
        );
        
        return (data as geodata[]).map((_, i) => voronoi.cellPolygon(i));
    }

    protected interpolation: number[][] = [];

    protected paintInterpolation(data: geodata[]): void {
        if (!this.map.current) {
            return;
        }
        if (this.ctx0) {
            this.ctx0.clearRect(0, 0, this.props.width, this.props.height);
        }

        this.interpolation = [];

        let seq: [number, number][] = [];

        for (let y: number = 0; y < this.props.height; y++) {
            this.interpolation.push([]);
            for (let x: number = 0; x < this.props.width; x++) {
                this.interpolation[y].push(0);
                seq.push([x, y]);
            }
        }

        let mode: "manhattan" | "eucalyptus" = "eucalyptus";
        const MIN_R = 4;
        const MIN_N = 10;

        seq.forEach(pos => {
            this.timers.push(
                setTimeout(() => {
                    const points = data.map(d => {
                        const p = this.map.current!.project(d);
                        const l = mode === "eucalyptus" ? (
                            Math.sqrt(Math.pow(p.x - pos[0], 2) + Math.pow(p.y - pos[1], 2))
                        ) : (
                            Math.abs(p.x - pos[0]) + Math.abs(p.y - pos[1])
                        );
                        return {
                            val: d.value,
                            dist: l
                        };
                    }).sort((a, b) => a.dist - b.dist);

                    let value:  number = 0;
                    let weight: number = 0;
                    let n:      number = 0;
                    
                    points.forEach(p => {
                        if (n < MIN_N || p.dist < MIN_R) {
                            const w = 1 / (p.dist + 1e-12);
                            value   += p.val * w;
                            weight  += w;
                            n       += 1;
                        }
                    });
                    
                    value /= weight;
                    // this.interpolation[pos[0]][pos[1]] = value;

                    if (this.ctx0) {
                        const val = Math.floor(
                            value / this.props.max() * 16
                        ) / 16 * this.props.max();
                        this.ctx0.fillStyle = this.props.colorize(val);
                        this.ctx0.fillRect(pos[0], pos[1], 1, 1);
                    }

                    this.progress.next();
                    return;
                }, 1 * this.timers.length)
            );
        });
        
        return;
    }

};
