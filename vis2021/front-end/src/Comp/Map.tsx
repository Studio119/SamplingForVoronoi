/*
 * @Author: Antoine YANG 
 * @Date: 2020-08-20 22:43:10 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-16 18:59:33
 */

import React, { Component } from "react";
import MapBox from "../react-mapbox/MapBox";
import { geodata } from "../types";
import { Progress } from "../Subcomp/Progress";


export interface MapProps {
    id: string;
    title: string;
    width: number;
    height: number;

    data: Promise<geodata[]>;
    colorize: (val: number) => string;
    max: () => number;
};

export interface MapState {};

export class Map extends Component<MapProps, MapState, {}> {

    private static list: Map[] = [];

    protected map: React.RefObject<MapBox>;

    protected canvasScatter: React.RefObject<HTMLCanvasElement>;
    protected ctxScatter: CanvasRenderingContext2D | null;

    protected progress: React.RefObject<Progress>;

    protected timers: Array<NodeJS.Timeout>;
    protected updated: boolean;

    private cloneObserver: Array<Map>;
    private recursiveLock: boolean;

    public constructor(props: MapProps) {
        super(props);
        this.state = {};

        this.map = React.createRef<MapBox>();
        this.canvasScatter = React.createRef<HTMLCanvasElement>();
        this.ctxScatter = null;

        this.progress = React.createRef<Progress>();

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
                    left: this.props.width * 0.2
                }} />
            </div>
        );
    }

    public componentDidMount(): void {
        this.ctxScatter = this.canvasScatter.current!.getContext("2d");
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
        this.progress.current?.close();
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
     * @returns {Promise<[number, number, number, number][]>}
     * @memberof Map
     */
    public static async takeSnapshot(): Promise<[number, number, number, number][]> {
        let list: [number, number, number, number][] = [];
        const map = Map.list[0];
        if (!map || !map.map.current) {
            return [];
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

        return list;
    }

};
