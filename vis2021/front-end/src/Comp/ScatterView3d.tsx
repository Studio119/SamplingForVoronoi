/*
 * @Author: Kanata You 
 * @Date: 2020-12-15 10:51:28 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-15 16:41:22
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
export class Scatter3d extends Map {
    
    protected readonly H: number = 128;

    protected readonly steps = [0, 1 / 4, 1 / 2, 3 / 4];

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
                <div key="canvas-container" style={{
                    display: "block",
                    width: this.props.width,
                    height: this.props.height,
                    top: 0 - this.props.height,
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

        let piece: Array<{x: number; y:number; val: number; h: number;}> = [];

        const paint = (start: number) => {
            const pieceCopy: {x: number; y:number; val: number; h: number;}[] = piece.map(d => d);
            this.timers.push(
                setTimeout(() => {
                    this.updated = true;

                    pieceCopy.forEach(d => {
                        this.ctxScatter!.fillStyle = this.props.colorize(d.val).replace(
                            "(", "a("
                        ).replace(
                            ")", ",0.8)"
                        );
                        const h = this.H * d.h / this.props.max();
                        const l = this.H * start;
                        this.ctxScatter!.fillRect(
                            d.x - 1.5 + start * 4, d.y - 1.5 - h, 3, h + 0.5 - l
                        );
                        this.ctxScatter!.fillStyle = this.props.colorize(d.val);
                        this.ctxScatter!.fillRect(
                            d.x - 1.5 + start * 4, d.y - 1.5 - h, 3, 3
                        );
                    });

                    this.progress.current?.next();
                }, 1 * this.timers.length)
            );
            piece = [];
        };

        this.steps.forEach(l => {
            this.timers.push(
                setTimeout(() => {
                    const h = this.H * l;
                    this.ctxScatter!.strokeStyle = "rgb(0,0,0)";
                    this.ctxScatter!.fillStyle = l === 0 ? "rgb(30,30,30)" : "rgba(30,30,30,0.6)";
                    this.ctxScatter!.beginPath();
                    this.ctxScatter!.moveTo(this.props.width * 0.25, this.props.height * 0.25 - h);
                    this.ctxScatter!.lineTo(this.props.width * 0.12, this.props.height * 0.6 - h);
                    this.ctxScatter!.lineTo(this.props.width * 0.25, this.props.height * 0.95 - h);
                    this.ctxScatter!.lineTo(this.props.width * 0.75, this.props.height * 0.95 - h);
                    this.ctxScatter!.lineTo(this.props.width * 0.88, this.props.height * 0.6 - h);
                    this.ctxScatter!.lineTo(this.props.width * 0.75, this.props.height * 0.25 - h);
                    this.ctxScatter!.closePath();
                    this.ctxScatter!.stroke();
                    this.ctxScatter!.fill();

                    this.progress.current?.next();
                }, 1 * this.timers.length)
            );

            list.forEach(d => {
                if (
                    d.x < 0 - 1
                    || d.x >= this.props.width + 1
                    || d.y < 0 - 1
                    || d.y - this.H >= this.props.height + 1
                ) return;
                if (d.val / this.props.max() < l) return;
                piece.push({
                    ...d,
                    h: Math.min(d.val, (l + this.steps[1] - this.steps[0]) * this.props.max())
                });
                if (piece.length === step) {
                    paint(l);
                }
            });

            if (piece.length) {
                paint(l);
            }
        });

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
            if (this.ctxScatter) {
                this.ctxScatter.fillStyle = "rgb(30,30,30)";
                this.ctxScatter.fillRect(0, 0, this.props.width, this.props.height);
                this.ctxScatter.strokeStyle = "rgb(0,0,0)";
                this.steps.forEach(d => {
                    this.ctxScatter!.fillStyle = d === 0 ? "rgb(30,30,30)" : "rgba(30,30,30,0.5)";
                    const h = this.H * d;
                    this.ctxScatter!.beginPath();
                    this.ctxScatter!.moveTo(this.props.width * 0.25, this.props.height * 0.25 - h);
                    this.ctxScatter!.lineTo(this.props.width * 0.12, this.props.height * 0.6 - h);
                    this.ctxScatter!.lineTo(this.props.width * 0.25, this.props.height * 0.95 - h);
                    this.ctxScatter!.lineTo(this.props.width * 0.75, this.props.height * 0.95 - h);
                    this.ctxScatter!.lineTo(this.props.width * 0.88, this.props.height * 0.6 - h);
                    this.ctxScatter!.lineTo(this.props.width * 0.75, this.props.height * 0.25 - h);
                    this.ctxScatter!.closePath();
                    this.ctxScatter!.stroke();
                    this.ctxScatter!.fill();
                });
            }
            this.updated = false;
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
            this.props.data.then(res => {
                let renderingQueue: Array<{x: number; y:number; val: number;}> = [];
                res.sort((a, b) => b.lat - a.lat).forEach((d: geodata) => {
                    renderingQueue.push({
                        ...this.map.current!.project(d),
                        val: d.value
                    })
                });
                this.bufferPaintScatters(renderingQueue);
            });
        }
    }

};
