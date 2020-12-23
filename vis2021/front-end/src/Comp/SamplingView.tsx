/*
 * @Author: Kanata You 
 * @Date: 2020-12-15 10:51:28 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-22 15:39:55
 */

import { geodata } from "../types";
import { Map, MapSwitchExtension } from "./Map";
import { connect } from "react-redux";
import { DataCenter } from "../reducers/DataCenter";


// @ts-ignore
@connect(DataCenter.mapStateToProps)
export class SamplingView extends Map {

    protected readonly diskSwitch: MapSwitchExtension = {
        type: "switch",
        text: "disk",
        value: true,
        executer: (value: boolean) => {
            this.diskSwitch.value = value;
            if (value) {
                this.canvas0.current!.style.visibility = "visible";
            } else {
                this.canvas0.current!.style.visibility = "hidden";
            }
        }
    };

    protected readonly traceSwitch: MapSwitchExtension = {
        type: "switch",
        text: "trace",
        value: true,
        executer: (value: boolean) => {
            this.traceSwitch.value = value;
            if (value) {
                this.canvas1.current!.style.visibility = "visible";
            } else {
                this.canvas1.current!.style.visibility = "hidden";
            }
        }
    };

    public render() {
        if (this.props.filter === "population") {
            this.extensions = [];
        } else if (this.props.filter === "sample") {
            this.extensions = [this.diskSwitch];
        } else if (this.props.filter === "drifted") {
            this.extensions = [this.diskSwitch, this.traceSwitch];
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
        if (!this.ctx2) return;

        let piece: Array<{x: number; y:number; val: number;}> = [];

        const paint = () => {
            const pieceCopy: {x: number; y:number; val: number;}[] = piece.map(d => d);
            this.timers.push(
                setTimeout(() => {
                    this.updated = true;

                    pieceCopy.forEach(d => {
                        this.ctx2!.fillStyle = this.props.colorize(d.val);
                        this.ctx2!.fillRect(
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
        if (!this.ctx0 || !this.ctx1 || !this.ctx2) return;

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
                            ")", ",0.5)"
                        );
                        this.ctx0!.strokeStyle = this.props.colorize(d.averVal);
                        this.ctx0!.beginPath();
                        this.ctx0!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                        this.ctx0!.fill();
                        this.ctx0!.stroke();
                        this.ctx0!.closePath();
                        this.ctx1!.fillStyle = this.props.colorize(d.val);
                        this.ctx1!.fillRect(
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
        if (!this.ctx0 || !this.ctx1 || !this.ctx2) return;

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
                            ")", ",0.5)"
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
                        this.ctx2!.fillStyle = this.props.colorize(d.val);
                        this.ctx2!.fillRect(
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
                this.canvas0.current!.style.opacity = "0.33";
            }
            if (this.ctx1) {
                this.ctx1.clearRect(0, 0, this.props.width, this.props.height);
            }
            if (this.ctx2) {
                this.ctx2.clearRect(0, 0, this.props.width, this.props.height);
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
                    this.bufferPaintDisks(renderingQueue);
                });
            }
        }
    }

};
