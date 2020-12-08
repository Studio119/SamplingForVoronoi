import { DataItem } from "./TypeLib";

export interface SystemType {
    sampled: boolean;
    voronoi: boolean;
    fill: boolean;
    border: boolean;
    merge: boolean;
    point: boolean;
    sample: Array<DataItem>;
    origin: Array<DataItem>;
    params: {
        classes: number;
    };
}

export const System: SystemType = {
    sampled: false,
    voronoi: false,
    fill: true,
    border: true,
    merge: false,
    point: true,
    params: {
        classes: 1000
    },
    sample: [],
    origin: []
}