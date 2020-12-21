/*
 * @Author: Kanata You 
 * @Date: 2020-12-15 10:51:28 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-21 20:49:26
 */

import React from "react";
import { geodata } from "../types";
import { Map } from "./Map";
import { connect } from "react-redux";
import { DataCenter } from "../reducers/DataCenter";
import MapBox from "../react-mapbox/MapBox";
import { Progress } from "../Subcomp/Progress";


// @ts-ignore
@connect(DataCenter.mapStateToProps)
export class SamplingView extends Map {

    public render(): JSX.Element {
        return (
            <div>
                <div key="tools" style={{
                    display: "flex",
                    width: this.props.width - 14,
                    border: "1px solid rgb(28,28,28)",
                    padding: "3.5px 6px 4.5px",
                    textAlign: "left",
                    alignItems: "center",
                    backgroundColor: "rgb(250,246,248)",
                    fontSize: "14px",
                    letterSpacing: "-0.2px"
                }} >
                    <label key="refresh" title="refresh" style={{
                        display: "inline-block",
                        width: "10px",
                        height: "14px",
                        boxShadow: "2px 2px 2px #00000060",
                        border: "1px solid #ddd",
                        marginRight: "4px",
                        cursor: "pointer"
                    }} onClick={
                        () => {
                            this.repaint();
                        }
                    } />
                    <label key="name" style={{
                        display: "inline-block",
                        padding: "3.5px 4px 1.5px"
                    }} >
                        { this.props.title }
                    </label>
                </div>
                <div key="mapbox-container" id={ this.props.id } style={{
                    display: "block",
                    width: this.props.width,
                    height: this.props.height,
                    backgroundColor: "rgb(27,27,27)"
                }} >
                    <MapBox ref={ this.map } containerID={ this.props.id }
                    accessToken="pk.eyJ1IjoiaWNoZW4tYW50b2luZSIsImEiOiJjazF5bDh5eWUwZ2tiM2NsaXQ3bnFvNGJ1In0.sFDwirFIqR4UEjFQoKB8uA"
                    center={ [-0.1132, 51.4936] } zoom={ 9.2 } allowInteraction={ true }
                    styleURL="mapbox://styles/ichen-antoine/cke5cvr811xb419mi5hd9otc3"
                    minZoom={ 1 } maxZoom={ 15 }
                    onBoundsChanged={ () => {
                        this.applySynchronizedBounds();
                        this.repaint();
                    } } />
                </div>
                <div key="canvas-container-0" style={{
                    display: "block",
                    width: this.props.width,
                    height: this.props.height,
                    top: 0 - this.props.height,
                    position: "relative",
                    pointerEvents: "none",
                    opacity: 0.33
                }} >
                    <canvas ref={ this.canvasBack }
                    width={ this.props.width } height={ this.props.height }
                    style={{}} />
                </div>
                <div key="canvas-container-1" style={{
                    display: "block",
                    width: this.props.width,
                    height: this.props.height,
                    top: 0 - 2 * this.props.height,
                    position: "relative",
                    pointerEvents: "none"
                }} >
                    <canvas ref={ this.canvasScatter }
                    width={ this.props.width } height={ this.props.height }
                    style={{}} />
                </div>
                <Progress ref={ this.progress }
                width={ this.props.width * 0.6 } height={ 6 }
                padding={ [0, 0] } hideAfterCompleted={ true }
                styleContainer={{
                    top: this.props.height * 0.96 - 3,
                    left: this.props.width * 0.2 + 767
                }} />
            </div>
        );
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
        if (!this.ctxScatter) return;

        let piece: Array<{x: number; y:number; val: number;}> = [];

        const paint = () => {
            const pieceCopy: {x: number; y:number; val: number;}[] = piece.map(d => d);
            this.timers.push(
                setTimeout(() => {
                    this.updated = true;

                    pieceCopy.forEach(d => {
                        this.ctxScatter!.fillStyle = this.props.colorize(d.val);
                        this.ctxScatter!.fillRect(
                            d.x - 1.5, d.y - 1.5, 3, 3
                        );
                    });

                    this.progress.current?.next();
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

        this.progress.current?.start(this.timers.length);
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
        if (!this.ctxBack || !this.ctxScatter) return;

        let piece: Array<{x: number; y:number; val: number; averVal: number; r: number;}> = [];

        const paint = () => {
            const pieceCopy: {x: number; y:number; val: number; averVal: number; r: number;}[] = piece.map(d => d);
            this.timers.push(
                setTimeout(() => {
                    this.updated = true;

                    pieceCopy.forEach(d => {
                        if (isNaN(d.r)) {
                            // this.ctxBack!.strokeStyle = this.props.colorize(d.val);
                            // this.ctxBack!.strokeRect(
                            //     d.x - 1.5 * 4, d.y - 1.5, 3, 3
                            // );
                        } else {
                            this.ctxBack!.fillStyle = this.props.colorize(d.averVal).replace(
                                "(", "a("
                            ).replace(
                                ")", ",0.5)"
                            );
                            this.ctxBack!.strokeStyle = this.props.colorize(d.averVal);
                            this.ctxBack!.beginPath();
                            this.ctxBack!.arc(d.x, d.y, d.r, 0, Math.PI * 2);
                            this.ctxBack!.fill();
                            this.ctxBack!.stroke();
                            this.ctxBack!.closePath();
                            this.ctxScatter!.fillStyle = this.props.colorize(d.val);
                            this.ctxScatter!.fillRect(
                                d.x - 1.5, d.y - 1.5, 3, 3
                            );
                        }
                    });

                    this.progress.current?.next();
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

        this.progress.current?.start(this.timers.length);
    }

    /**
     * 绘制采样点.
     *
     * @protected
     * @param {Array<{origin: [number, number]; x: number; y:number; val: number; r: number;}>} list
     * @param {number} [step=100]
     * @returns {void}
     * @memberof Map
     */
    protected bufferPaintDriftedDisks(list: Array<{origin: [number, number]; x: number; y:number; val: number; r: number;}>, step: number = 100): void {
        if (!this.ctxBack || !this.ctxScatter) return;

        let piece: Array<{origin: [number, number]; x: number; y:number; val: number; r: number;}> = [];

        const paint = () => {
            const pieceCopy: {origin: [number, number]; x: number; y:number; val: number; r: number;}[] = piece.map(d => d);
            this.timers.push(
                setTimeout(() => {
                    this.updated = true;

                    pieceCopy.forEach(d => {
                        this.ctxBack!.fillStyle = this.props.colorize(d.val).replace(
                            "(", "a("
                        ).replace(
                            ")", ",0.5)"
                        );
                        this.ctxBack!.strokeStyle = this.props.colorize(d.val);
                        this.ctxBack!.beginPath();
                        this.ctxBack!.arc(d.origin[0], d.origin[1], d.r, 0, Math.PI * 2);
                        this.ctxBack!.fill();
                        this.ctxBack!.stroke();
                        this.ctxBack!.closePath();
                        this.ctxScatter!.strokeStyle = this.props.colorize(d.val).replace(
                            "(", "a("
                        ).replace(
                            ")", ",0.5)"
                        );
                        this.ctxScatter!.beginPath();
                        this.ctxScatter!.moveTo(d.origin[0], d.origin[1]);
                        this.ctxScatter!.lineTo(d.x, d.y);
                        this.ctxScatter!.stroke();
                        this.ctxScatter!.closePath();
                        this.ctxScatter!.fillStyle = this.props.colorize(d.val);
                        this.ctxScatter!.fillRect(
                            d.x - 1.5, d.y - 1.5, 3, 3
                        );
                    });

                    this.progress.current?.next();
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

        this.progress.current?.start(this.timers.length);
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
            if (this.ctxScatter) {
                this.ctxScatter.clearRect(0, 0, this.props.width, this.props.height);
            }
            if (this.ctxBack) {
                this.ctxBack.clearRect(0, 0, this.props.width, this.props.height);
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
                    x: number; y: number; val: number; r: number;
                }> = [];
                this.props.drifted!.then(res => {
                    res.sort((a, b) => b.lat - a.lat).forEach((d: geodata<"drifted">) => {
                        const pos = this.map.current!.project(d);
                        renderingQueue.push({
                            origin: [pos.x, pos.y],
                            x: d.x,
                            y: d.y,
                            val: d.averVal,
                            r: d.radius
                        });
                    });
                    this.bufferPaintDriftedDisks(renderingQueue);
                });
            } else {
                this.props.data.then(res0 => {
                    let renderingQueue: Array<{
                        x: number; y: number; val: number; averVal: number; r: number;
                    }> = [];
                    res0.sort((a, b) => b.lat - a.lat).forEach((d: geodata) => {
                        renderingQueue.push({
                            ...this.map.current!.project(d),
                            val: d.value,
                            averVal: NaN,
                            r: NaN
                        });
                    });
                    this.props.sample!.then(res => {
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
                });
            }
        }
    }

};
