export type LISAtype = "HH" | "LH" | "LL" | "HL";


export type DataItem = {
    id: number;
    type: LISAtype;
    lat: number;
    lng: number;
    value: number;
    mx: number;
    my: number;
    neighbors: Array<number>;
    target?: {
        type: LISAtype;
        mx: number;
        my: number;
    };
    projection?: number
};

export namespace FileData {
    export type Origin = Array<DataItem>;

    export type Mode = Array<{
        id: number;
        type: LISAtype;
        lat: number;
        lng: number;
        value: number;
        mx: number;
        my: number;
        neighbors: Array<number>;
    }>;
    
    export type Kde = Array<number>;
};


export interface edgeType {
    start: [number, number],
    end: [number, number]
}

// export interface cellType {
//     id: number,
//     edges: Array<edgeType>,
//     value: number,
//     projection?: number
// }

export interface cellType {
    id: number,
    points: Array<[number, number]>,
    value: number,
    projection?: number
}

export interface censusType {
    usual: number;
    males: number;
    females: number;
    household: number;
    communal: number;
    childAddress: number;
    area: number; 
    density: number;
}

export interface datumType<T> {
    lng: number;
    lat: number;
    features: T;
}