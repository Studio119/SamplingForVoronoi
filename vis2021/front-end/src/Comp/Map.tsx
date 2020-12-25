/*
 * @Author: Antoine YANG 
 * @Date: 2020-08-20 22:43:10 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-25 16:43:13
 */

import React, { Component } from "react";
import MapBox from "../react-mapbox/MapBox";
import { geodata } from "../types";
import * as d3 from "d3";


export interface MapProps {
    id: string;
    title: string;
    width: number;
    height: number;

    filter: "population" | "sample" | "drifted";
    data: Promise<geodata<"population">[]>;
    sample: Promise<geodata<"sample">[]> | null;
    drifted: Promise<geodata<"drifted">[]> | null;
    colorize: (val: number) => string;
    max: () => number;
};

export interface MapState {};

export interface MapExtension {
    type: "button" | "switch";
    text: string;
    executer: Function;
};

export interface MapButtonExtension extends MapExtension {
    type: "button";
    executer: (finish: () => void) => void;
};

export interface MapSwitchExtension extends MapExtension {
    type: "switch";
    value: boolean;
    executer: (value: boolean, finish: () => void) => void;
};

export class Map extends Component<MapProps, MapState, {}> {

    private static list: Map[] = [];

    protected map: React.RefObject<MapBox>;

    protected canvas0: React.RefObject<HTMLCanvasElement>;
    protected ctx0: CanvasRenderingContext2D | null;

    protected canvas1: React.RefObject<HTMLCanvasElement>;
    protected ctx1: CanvasRenderingContext2D | null;

    protected canvas2: React.RefObject<HTMLCanvasElement>;
    protected ctx2: CanvasRenderingContext2D | null;

    protected canvas3: React.RefObject<HTMLCanvasElement>;
    protected ctx3: CanvasRenderingContext2D | null;

    /** 工具栏扩展 */
    protected extensions: Array<MapExtension> = [];

    protected progress: {
        count: number;
        flag: number;
        ref: React.RefObject<SVGRectElement>;
        start: (len: number) => void;
        next: () => void;
        close: () => void;
    };

    protected timers: Array<NodeJS.Timeout>;
    protected updated: boolean;

    private cloneObserver: Array<Map>;
    private recursiveLock: boolean;
    
    protected voronoiPolygons: d3.Delaunay.Polygon[] = [];
    public static getVoronoiPolygons() {
        const map = Map.list.filter(map => map.voronoiPolygons.length)[0];
        let shapes: d3.Delaunay.Polygon[] = [];

        if (map) {
            shapes = map.voronoiPolygons;
        }
        
        return {
            width: map?.props.width || 0,
            height: map?.props.height || 0,
            data: shapes
        };
    }

    public constructor(props: MapProps) {
        super(props);
        this.state = {};

        this.map = React.createRef<MapBox>();
        this.canvas0 = React.createRef<HTMLCanvasElement>();
        this.ctx0 = null;
        this.canvas1 = React.createRef<HTMLCanvasElement>();
        this.ctx1 = null;
        this.canvas2 = React.createRef<HTMLCanvasElement>();
        this.ctx2 = null;
        this.canvas3 = React.createRef<HTMLCanvasElement>();
        this.ctx3 = null;

        this.progress = {
            count: 0,
            flag: 0,
            ref: React.createRef<SVGRectElement>(),
            start: (len: number) => {
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
        
        this.cloneObserver = [];
        this.recursiveLock = false;
    }

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
                    <label key="span" style={{
                        display: "inline-block",
                        padding: "3.5px 0 1.5px",
                        width: "16px"
                    }} ></label>
                    {
                        this.extensions.map(e => {
                            return e.type === "button" ? (
                                <label key={ e.text } tabIndex={ 1 } style={{
                                    display: "inline-block",
                                    padding: "3.5px 4px 1.5px",
                                    boxShadow: "1.5px 1.5px 0 #00000060",
                                    border: "1px solid #ddd",
                                    cursor: "pointer",
                                    userSelect: "none"
                                }}
                                onClick={
                                    ev => {
                                        const element = ev.currentTarget;
                                        if (element.getAttribute("lock") === "true") {
                                            return;
                                        }
                                        element.setAttribute("locked", "true");
                                        element.style.pointerEvents = "none";
                                        element.style.opacity = "0.5";
                                        (e as MapButtonExtension).executer(() => {
                                            element.setAttribute("locked", "false");
                                            element.style.pointerEvents = "";
                                            element.style.opacity = "";
                                        });
                                        element.innerText = e.text;
                                    }
                                } >
                                    { e.text }
                                </label>
                            ) : e.type === "switch" ? (
                                <label key={ e.text } tabIndex={ 1 } style={{
                                    display: "inline-block",
                                    padding: "3.5px 4px 1.5px",
                                    margin: "0 4px",
                                    userSelect: "none",
                                    boxShadow: "1.5px 1.5px 0 #00000060",
                                    border: "1px solid #ddd",
                                    cursor: "pointer"
                                }}
                                onClick={
                                    ev => {
                                        const element = ev.currentTarget;
                                        if ((element as any).lock === "true") {
                                            return;
                                        }
                                        element.setAttribute("locked", "true");
                                        element.style.pointerEvents = "none";
                                        element.style.opacity = "0.5";
                                        const t = e as MapSwitchExtension;
                                        t.value = !t.value;
                                        t.executer(t.value, () => {
                                            element.setAttribute("locked", "false");
                                            element.style.pointerEvents = "";
                                            element.style.opacity = "";
                                        });
                                        element.getElementsByTagName("span")[0].innerText = e.text;
                                        const span = element.getElementsByTagName("span")[1];
                                        span.style.color = (
                                            t.value ? "rgb(78,201,148)" : "rgb(125,125,125)"
                                        );
                                        span.innerText = (
                                            t.value ? "+" : "-"
                                        );
                                    }
                                } >
                                    <span key="0" >
                                        { e.text }
                                    </span>
                                    <span key="1" style={{
                                        padding: "0 2px 0 8px",
                                        color: (e as MapSwitchExtension).value ? "rgb(78,201,148)" : "rgb(125,125,125)"
                                    }} >
                                        { (e as MapSwitchExtension).value ? "+" : "-" }
                                    </span>
                                </label>
                            ) : null;
                        })
                    }
                </div>
                <div key="progress" style={{
                    display: "flex",
                    width: this.props.width,
                    padding: "0",
                    marginTop: "-2.5px"
                }} >
                    <svg key="progress" style={{
                        width: this.props.width,
                        height: "2px"
                    }} >
                        <rect ref={ this.progress.ref }
                        x="0" y="0" width="0" height="2" style={{
                            fill: "rgb(198,131,61)"
                        }} />
                    </svg>
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
                    pointerEvents: "none"
                }} >
                    <canvas ref={ this.canvas0 }
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
                    <canvas ref={ this.canvas1 }
                    width={ this.props.width } height={ this.props.height }
                    style={{}} />
                </div>
                <div key="canvas-container-2" style={{
                    display: "block",
                    width: this.props.width,
                    height: this.props.height,
                    top: 0 - 3 * this.props.height,
                    position: "relative",
                    pointerEvents: "none"
                }} >
                    <canvas ref={ this.canvas2 }
                    width={ this.props.width } height={ this.props.height }
                    style={{}} />
                </div>
                <div key="canvas-container-3" style={{
                    display: "block",
                    width: this.props.width,
                    height: this.props.height,
                    top: 0 - 4 * this.props.height,
                    position: "relative",
                    pointerEvents: "none"
                }} >
                    <canvas ref={ this.canvas3 }
                    width={ this.props.width } height={ this.props.height }
                    style={{}} />
                </div>
            </div>
        );
    }

    public componentDidMount(): void {
        this.ctx0 = this.canvas0.current!.getContext("2d");
        this.ctx1 = this.canvas1.current!.getContext("2d");
        this.ctx2 = this.canvas2.current!.getContext("2d");
        this.ctx3 = this.canvas3.current!.getContext("2d");
        Map.list.forEach(map => {
            this.synchronize(map);
        });
        Map.list.push(this);
    }

    public componentWillUnmount(): void {
        this.clearTimers();
    }

    public componentDidUpdate(): void {
        this.repaint();
    }

    protected repaint(): void {};

    protected clearTimers(): void {
        this.progress.close();
        this.timers.forEach(timer => {
            clearTimeout(timer);
        });
        this.timers = [];
    }

    public synchronize(clone: Map): void {
        this.cloneObserver.push(clone);
        clone.cloneObserver.push(this);
    }

    public applySynchronizedBounds(): void {
        if (this.recursiveLock) {
            this.recursiveLock = false;
            return;
        }
        const map = this.map.current;
        if (!map) {
            return;
        }
        this.cloneObserver.forEach((clone: Map) => {
            const mapcl = clone.map.current;
            if (mapcl) {
                clone.recursiveLock = true;
                mapcl.fitBounds(map);
            }
        });
    }

    /**
     * 数据格式: [id, screenX, screenY, value(0-1)]
     *
     * @static
     * @returns {Promise<MapSnapshot>}
     * @memberof Map
     */
    public static async takeSnapshot(): Promise<MapSnapshot> {
        let list: [number, number, number, number][] = [];
        const map = Map.list[0];
        if (!map || !map.map.current) {
            return {
                width: 0,
                height: 0,
                data: []
            };
        }
        const max = map.props.max();
        (await map.props.data).forEach(d => {
            const pos = map.map.current!.project(d);
            if (pos.x < 0 || pos.x > map.props.width || pos.y < 0 || pos.y > map.props.height) {
                return;
            }
            const item: [number, number, number, number] = [d.id, pos.x, pos.y, d.value / max];
            list.push(item);
        });

        return {
            width: map.props.width,
            height: map.props.height,
            data: list
        };
    }

};


export type MapSnapshot = {
    width: number;
    height: number;
    data: [number, number, number, number][];
};
