/*
 * @Author: Kanata You 
 * @Date: 2020-12-15 12:04:59 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-21 13:13:47
 */

import { geodata } from "../types";
import axios from "axios";
import encodePath from "../Tools/pathEncoder";
import Color from "../Design/Color";


let colorize = (val: number): string => {
    return "#222";
};

let max: number = 0;

export interface DataReduxState {
    path: string;
    data: Promise<geodata[]>;
    sample: Promise<geodata<"sample">[]> | null;
    drifted: Promise<geodata<"drifted">[]> | null;
    filter: "population" | "sample" | "drifted";
    colorize: (val: number) => string;
    max: () => number;
};

export type DataActionType = (
    "RELOAD" | "SAMPLE" | "HOME" | "DRIFT"
);

export type DataActionReduxAction<AT extends DataActionType = DataActionType> = {
    type: AT;
    index: number;
} & (
    AT extends "RELOAD" ? {
        index: 100;
        path: string;
    } : AT extends "SAMPLE" ? {
        index: 101;
    } : AT extends "HOME" ? {
        index: 102;
    } : AT extends "DRIFT" ? {
        index: 103;
    } : {}
);

const initData: DataReduxState = {
    path: "undefined",
    data: new Promise<geodata[]>(res => res([])),
    sample: null,
    drifted: null,
    filter: "population",
    colorize: val => colorize(val),
    max: () => max
};

export const DataRedux = (state: DataReduxState = initData, action: DataActionReduxAction): DataReduxState => {
    switch (action.type) {
        case "RELOAD":
            const reloadAction = action as DataActionReduxAction<"RELOAD">;
            if (reloadAction.path !== state.path) {
                const data = new Promise<geodata[]>((resolve, reject) => {
                    axios.get(`/fromfile/${ encodePath(reloadAction.path) }`).then(res => {
                        const data: geodata[] = res.data;
                        // 更新映射
                        const MAX = Math.max(...data.map(d => d.value) || 1);
                        let sum = 0;
                        data.forEach(d => {
                            sum += d.value;
                        });
                        const base = Math.log(0.5) / Math.log(sum / data.length / MAX);
                        max = MAX;
                        colorize = val => {
                            return Color.interpolate(
                                "rgb(100,156,247)",
                                "rgb(255,0,0)",
                                Math.pow(val / MAX, base),
                                // "rgb"
                            );
                        };
                        // 派发
                        resolve(data);
                    }).catch(reason => {
                        reject(reason);
                    });
                });

                return {
                    path: reloadAction.path,
                    data: data,
                    sample: null,
                    drifted: null,
                    filter: "population",
                    colorize: state.colorize,
                    max: state.max
                };
            }
            return state;
        case "SAMPLE":
            const data = new Promise<geodata<"sample">[]>((resolve, reject) => {
                axios.get(`/fromsample/${ encodePath(state.path) }`).then(res => {
                    const data: geodata<"sample">[] = res.data;
                    // 派发
                    resolve(data);
                }).catch(reason => {
                    reject(reason);
                });
            });
            
            return {
                path: state.path,
                data: state.data,
                sample: data,
                drifted: null,
                filter: "sample",
                colorize: state.colorize,
                max: state.max
            };
        case "HOME":
            return {
                path: state.path,
                data: state.data,
                sample: state.sample,
                drifted: null,
                filter: "population",
                colorize: state.colorize,
                max: state.max
            };
        case "DRIFT":
            if (state.sample) {
                const data = new Promise<geodata<"drifted">[]>((resolve, reject) => {
                    axios.get(`/fromdrifted/${ encodePath(state.path) }`).then(res => {
                        const data: geodata<"drifted">[] = res.data;
                        // 派发
                        resolve(data);
                    }).catch(reason => {
                        reject(reason);
                    });
                });

                return {
                    path: state.path,
                    data: state.data,
                    sample: state.sample,
                    drifted: data,
                    filter: "drifted",
                    colorize: state.colorize,
                    max: state.max
                };
            }
            return state;
        default:
            return state;
    }
};
    
export const DataCenter = {

    mapStateToProps: (state: { DataRedux: DataReduxState; }): DataReduxState => {
        return Object.assign({}, {
            filter: state.DataRedux.filter,
            path: state.DataRedux.path,
            data: state.DataRedux.data,
            sample: state.DataRedux.sample,
            drifted: state.DataRedux.drifted,
            colorize: state.DataRedux.colorize,
            max: state.DataRedux.max
        });
    },

    mapDispatchToProps: (dispatch: (action: DataActionReduxAction) => any) => {
        return {
            loadDataset: (path: string) => {
                return dispatch({
                    type: "RELOAD",
                    index: 100,
                    path: path
                });
            },
            loadSample: () => {
                return dispatch({
                    type: "SAMPLE",
                    index: 101
                });
            },
            home: () => {
                return dispatch({
                    type: "HOME",
                    index: 102
                });
            },
            loadDrift: () => {
                return dispatch({
                    type: "DRIFT",
                    index: 103
                });
            }
        };
    }
    
};
