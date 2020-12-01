export interface SystemType {
    sampled: boolean;
    unsampled: boolean;
    voronoi: boolean;
    fill: boolean;
    border: boolean;
    merge: boolean;
    params: {
        classes: number;
    };
}

export const System: SystemType = {
    sampled: false,
    unsampled: true,
    voronoi: false,
    fill: true,
    border: true,
    merge: false,
    params: {
        classes: 1000
    }
}