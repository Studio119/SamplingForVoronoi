/*
 * @Author: Antoine YANG 
 * @Date: 2020-08-20 22:43:10 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-03 14:40:13
 */

import React, { Component } from "react";
// import $ from "jquery";
import MapBox from "./react-mapbox/MapBox";
import Color from "./preference/Color";
import { Progress } from "./subcomp/Progress";
import { debounced } from "./tools/decorator";
import { interactionInfo } from "./interaction";


const colorize = (val: number) => {
    return Color.interpolate(
        "rgb(67,201,176)", "rgb(235,67,38)", Math.pow(val, 1 / 5)//, "rgb"
    );
};

/**
 * 地图展示的数据.
 */
export type geodata = {
    id: number;
    lng: number;
    lat: number;
    value: number;
};

export interface MapProps {
    id: string;
    width: number;
    height: number;
};

export interface MapState {
    data: Array<geodata>;
    // mode: "scatter" | "node" | "superpixel";
    mode: "scatter" | "voronoi";
};

export class MapV2 extends Component<MapProps, MapState, {}> {

    protected map: React.RefObject<MapBox>;

    protected canvasScatter: React.RefObject<HTMLCanvasElement>;
    protected ctxScatter: CanvasRenderingContext2D | null;

    protected progress: React.RefObject<Progress>;

    protected timers: Array<NodeJS.Timeout>;
    protected updated: boolean;

    public constructor(props: MapProps) {
        super(props);
        this.state = {
            data: [],
            mode: "voronoi"
        };

        this.repaint = debounced(this.repaint.bind(this));

        this.map = React.createRef<MapBox>();
        this.canvasScatter = React.createRef<HTMLCanvasElement>();
        this.ctxScatter = null;

        this.progress = React.createRef<Progress>();

        this.timers = [];
        this.updated = true;
    }

    public render(): JSX.Element {
        return (
            <div>
                <div key="tools" style={{
                    display: "flex",
                    width: this.props.width - 18,
                    border: "1px solid rgb(28,28,28)",
                    // padding: "5.5px 8px 6.5px",
                    textAlign: "left",
                    backgroundColor: "rgb(250,246,248)",
                    fontSize: "14px",
                    letterSpacing: "-0.2px"
                }} >
                    <label key="refresh" title="refresh" style={{
                        display: "inline-block",
                        width: "10px",
                        height: "23px",
                        boxShadow: "2px 2px 2px #00000060",
                        border: "1px solid #ddd",
                        cursor: "pointer"
                    }} onClick={
                        () => {
                            this.repaint();
                        }
                    } />
                    <label key="modeSwitch" title="display mode" style={{
                        display: "inline-block",
                        width: "80px",
                        height: "18px",
                        padding: "3.5px 4px 1.5px",
                        boxShadow: "2px 2px 2px #00000060",
                        textAlign: "center",
                        border: "1px solid #ddd",
                        cursor: "pointer"
                    }} onClick={
                        () => {
                            if (this.state.mode === "scatter") {
                                this.setState({
                                    mode: "voronoi"
                                });
                            } else if (this.state.mode === "voronoi") {
                                this.setState({
                                    mode: "scatter"
                                });
                            }
                        }
                    } >
                        { this.state.mode }
                    </label>
                    <label key="rebuild" title="rebuild Hilbert tree" style={{
                        display: "inline-block",
                        width: "64px",
                        height: "18px",
                        padding: "3.5px 4px 1.5px",
                        boxShadow: "2px 2px 2px #00000060",
                        textAlign: "center",
                        border: "1px solid #ddd",
                        cursor: "pointer",
                        opacity: this.state.mode === "voronoi" ? 1 : 0.4
                    }} onClick={
                        () => {
                            if (this.state.mode !== "voronoi") {
                                return;
                            }
                            this.rebuildVoronoi();
                        }
                    } >
                        { "rebuild" }
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
                    center={ [-87.664, 41.827] } zoom={ 9.5 } allowInteraction={ true }
                    styleURL="mapbox://styles/ichen-antoine/cke5cvr811xb419mi5hd9otc3"
                    minZoom={ 1 } maxZoom={ 15 }
                    onBoundsChanged={ () => {
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
                width={ this.props.width * 0.6 } height={ 18 }
                padding={ [0, 0] } hideAfterCompleted={ true }
                styleContainer={{
                    top: this.props.height * 0.92 - 9,
                    left: this.props.width * 0.2
                }} />
            </div>
        );
    }

    public componentDidMount(): void {
        interactionInfo.mapRef = {
            current: this
        };
        interactionInfo.project = this.map.current!.project;

        this.ctxScatter = this.canvasScatter.current!.getContext("2d");

        this.load(interactionInfo.data);
    }

    /**
     * 调用这个方法来重置维诺图结构.
     *
     * @protected
     * @memberof Map
     */
    protected rebuildVoronoi(): void {
        if (this.map.current) {
            interactionInfo.project = this.map.current!.project;
            console.log(interactionInfo.project);
            interactionInfo.applyVoronoi();
            this.repaint();
        }
    }

    /**
     * 加载原始 geodata 数据.
     *
     * @param {Array<{
     *         id: number;
     *         lng: number;
     *         lat: number;
     *         value: number;
     *     }>} data 缺少编码的 geodata 数据
     * @memberof Map
     */
    public load(data: Array<{
        id: number;
        lng: number;
        lat: number;
        value: number;
    }>): void {
        this.setState({ data });
        this.rebuildVoronoi();
    }

    public componentDidUpdate(): void {
        this.repaint();
    }

    public componentWillUnmount(): void {
        this.clearTimers();
    }

    protected clearTimers(): void {
        this.progress.current?.close();
        this.timers.forEach(timer => {
            clearTimeout(timer);
        });
        this.timers = [];
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

        const r: number = 1;
        const max: number = interactionInfo.max;

        const paint = () => {
            const pieceCopy: Array<{x: number; y:number; val: number;}> = piece.map(d => d);
            this.timers.push(
                setTimeout(() => {
                    this.updated = true;

                    pieceCopy.forEach(d => {
                        this.ctxScatter!.fillStyle = colorize(d.val / max);
                        this.ctxScatter!.beginPath();
                        this.ctxScatter!.arc(
                            d.x, d.y, r, 0, 2 * Math.PI
                        );
                        this.ctxScatter!.fill();
                        this.ctxScatter!.closePath();
                    });

                    this.progress.current?.next();
                }, 1 * this.timers.length)
            );
            piece = [];
        };

        list.forEach(d => {
            if (
                d.x < 0 - r / 2
                || d.x >= this.props.width + r / 2
                || d.y < 0 - r / 2
                || d.y >= this.props.height + r / 2
            ) return;
            piece.push(d);
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
            if (this.ctxScatter) {
                this.ctxScatter.clearRect(0, 0, this.props.width, this.props.height);
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
            if (this.state.mode === "scatter") {
                // 绘制散点图
                let renderingQueue: Array<{x: number; y:number; val: number;}> = [];
                this.state.data.forEach((d: geodata) => {
                    renderingQueue.push({
                        ...this.map.current!.project(d),
                        val: d.value
                    })
                });
                console.log(renderingQueue); // TOFIX ???
                this.bufferPaintScatters(renderingQueue);
            } else if (this.state.mode === "voronoi") {
                // 绘制维诺图
                this.paintVoronoi();
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
    protected paintVoronoi(): void {
        if (!this.ctxScatter) return;

        if (!interactionInfo.voronoiPolygons.length) {
            interactionInfo.applyVoronoi();
        }

        this.updated = true;

        this.timers = [];

        // TODO
        console.log(interactionInfo.voronoiPolygons);

        this.progress.current?.start(this.timers.length);
    }

};
