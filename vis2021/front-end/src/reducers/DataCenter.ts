/*
 * @Author: Kanata You 
 * @Date: 2020-12-15 12:04:59 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-16 19:27:59
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
    sampled: boolean;
    data: Promise<geodata[]>;
    colorize: (val: number) => string;
    max: () => number;
};

export type DataActionType = (
    "RELOAD" | "SAMPLE" | "RESET"
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
    } : AT extends "RESET" ? {
        index: 102;
    } : {}
);

const initData: DataReduxState = {
    path: "undefined",
    sampled: false,
    data: new Promise<geodata[]>(res => res([])),
    colorize: val => colorize(val),
    max: () => max
};

export const DataRedux = (state: DataReduxState = initData, action: DataActionReduxAction) => {
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
                    sampled: false,
                    path: reloadAction.path,
                    data: data,
                    colorize: state.colorize,
                    max: state.max
                };
            }
            return state;
        case "SAMPLE":
            const data = new Promise<geodata[]>((resolve, reject) => {
                axios.get(`/fromsample/${ encodePath(state.path) }`).then(res => {
                    const data: geodata[] = res.data;
                    // 派发
                    resolve(data);
                }).catch(reason => {
                    reject(reason);
                });
            });
            
            return {
                sampled: true,
                path: state.path,
                data: data,
                colorize: state.colorize,
                max: state.max
            };
        case "RESET":
            const dataHome = new Promise<geodata[]>((resolve, reject) => {
                axios.get(`/fromfile/${ encodePath(state.path) }`).then(res => {
                    const data: geodata[] = res.data;
                    // 派发
                    resolve(data);
                }).catch(reason => {
                    reject(reason);
                });
            });

            return {
                sampled: false,
                path: state.path,
                data: dataHome,
                colorize: state.colorize,
                max: state.max
            };
        default:
            return state;
    }
};
    
export const DataCenter = {

    mapStateToProps: (state: { DataRedux: DataReduxState; }) => {
        return Object.assign({}, {
            sampled: state.DataRedux.sampled,
            path: state.DataRedux.path,
            data: state.DataRedux.data,
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
            reset: () => {
                return dispatch({
                    type: "RESET",
                    index: 102
                });
            }
        };
    }
    
};