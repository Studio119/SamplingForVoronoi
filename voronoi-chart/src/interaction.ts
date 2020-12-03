/*
 * @Author: Kanata You 
 * @Date: 2020-12-03 13:12:13 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-03 14:34:20
 */

import axios, { AxiosResponse } from "axios";
import { geodata, MapV2 } from "./MapV2";
import encodePath from "./tools/pathEncoder";
import * as d3 from "d3";


class InteractionInfo {
    
    private _dataset: string;
    public get dataset() { return this._dataset };
    public set dataset(path: string) {
        this._dataset = path;
        this.loadData();
    };

    private _data: geodata[];
    public get data() { return this._data.map(d => d); }
    public get max() { return Math.max(...this.data.map(d => d.value)); }

    private _voronoiPolygons: d3.Delaunay.Polygon[];
    public get voronoiPolygons() { return this._voronoiPolygons.map(d => d); }

    public mapRef: React.RefObject<MapV2>;

    private static constructorLock: boolean = false;

    public constructor(dataset: string) {
        if (InteractionInfo.constructorLock) {
            throw {
                msg: "已存在 InteractionInfo 的实例."
            };
        }

        InteractionInfo.constructorLock = true;

        this.mapRef = {
            current: null
        };
        
        this._data = [];
        this._dataset = dataset;
        this._voronoiPolygons = [];

        this.loadData();
    }

    public project: (lngLat: [number, number]) => { x: number; y: number; } = () => {
        return {
            x: NaN, y: NaN
        };
    };

    private loadData() {
        axios.get(
            `/local_file/${ encodePath("./storage/" + this.dataset) }`
        ).then((res: AxiosResponse<Array<{
            id: number;
            lng: number;
            lat: number;
            value: number;
        }>>) => {
            this._data = res.data.map(d => {
                return {
                    id: d.id,
                    lng: d.lng,
                    lat: d.lat,
                    value: d.value
                };
            });
        }).catch(reason => {
            console.error(reason);
        });
        this.applyVoronoi();
    }

    public applyVoronoi() {
        if (this.mapRef.current === null) {
            return;
        }

        console.log(
            this.data.map(d => {
                try {
                    const a = this.project([d.lng, d.lat]);
                    
                    return [a.x, a.y];
                } catch (error) {
                    console.warn(d, error)
                    
                    return [0, 0];
                }
            })
        );

        const delaunay = d3.Delaunay.from(
            this.data.map(d => {
                try {
                    const a = this.project([d.lng, d.lat]);
                    
                    return [a.x, a.y];
                } catch (error) {
                    console.warn(d, error)
                    
                    return [0, 0];
                }
            }).concat(
                [].map(d => {
                    const a = this.project(d);
                    return [a.x, a.y];
                })
            )
        );
        const voronoi = delaunay.voronoi(
            [ 0.5, 0.5,
                this.mapRef.current.props.width - 0.5, this.mapRef.current.props.height - 0.5]
        );
        this._voronoiPolygons = this.data.map((_, i) => voronoi.cellPolygon(i));
    }

    public makeVoronoi(data: geodata[]): d3.Delaunay.Polygon[] {
        if (!this.mapRef.current) {
            return [];
        }
        
        const delaunay = d3.Delaunay.from(
            data.map(d => {
                try {
                    const a = this.project([d.lng, d.lat]);
                    
                    return [a.x, a.y];
                } catch (error) {
                    console.warn(d, error)
                    
                    return [0, 0];
                }
            }).concat(
                [].map(d => {
                    const a = this.project(d);
                    return [a.x, a.y];
                })
            )
        );
        const voronoi = delaunay.voronoi(
            [ 0.5, 0.5,
                this.mapRef.current.props.width - 0.5, this.mapRef.current.props.height - 0.5]
        );
        return data.map((_, i) => voronoi.cellPolygon(i));
    }

};

export const interactionInfo: InteractionInfo = new InteractionInfo("crimes.json");
