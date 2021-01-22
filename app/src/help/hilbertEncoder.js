/*
 * @Author: Antoine YANG 
 * @Date: 2020-08-22 16:44:31 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-22 23:01:32
 */


const HilbertMap = {
    a: {
        "0,0": [0, 'd'],
        "0,1": [1, 'a'],
        "1,0": [3, 'b'],
        "1,1": [2, 'a']
    },
    b: {
        "0,0": [2, 'b'],
        "0,1": [1, 'b'],
        "1,0": [3, 'a'],
        "1,1": [0, 'c']
    },
    c: {
        "0,0": [2, 'c'],
        "0,1": [3, 'd'],
        "1,0": [1, 'c'],
        "1,1": [0, 'b']
    },
    d: {
        "0,0": [0, 'a'],
        "0,1": [3, 'c'],
        "1,0": [1, 'd'],
        "1,1": [2, 'd']
    },
};

const HilbertMapReverse = {
    a: {
        0: [0, 0, 'd'],
        1: [0, 1, 'a'],
        3: [1, 0, 'b'],
        2: [1, 1, 'a']
    },
    b: {
        2: [0, 0, 'b'],
        1: [0, 1, 'b'],
        3: [1, 0, 'a'],
        0: [1, 1, 'c']
    },
    c: {
        2: [0, 0, 'c'],
        3: [0, 1, 'd'],
        1: [1, 0, 'c'],
        0: [1, 1, 'b']
    },
    d: {
        0: [0, 0, 'a'],
        3: [0, 1, 'c'],
        1: [1, 0, 'd'],
        2: [1, 1, 'd']
    }
};

export const HilbertEncode = (lng, lat, level) => {
    let lngRange = [-180.0, 180.0];
    let latRange = [-90.0, 90.0]

    let curSquare = 'a';

    let position = "";

    for (let i = level - 1; i >= 0; i--) {
        const lngMid = (lngRange[0] + lngRange[1]) / 2;
        const latMid = (latRange[0] + latRange[1]) / 2;

        let quadX = lng >= lngMid ? 1 : 0;
        lngRange[1 - quadX] = lngMid;
        let quadY = lat >= latMid ? 1 : 0;
        latRange[1 - quadY] = latMid;

        let quadPos = 0;

        [quadPos, curSquare] = HilbertMap[curSquare][
            `${ quadX },${ quadY }`
        ];

        position += (quadPos >= 2 ? "1" : "0") + (quadPos % 2 ? "1" : "0");
    }

    return position || "0";
};

export const HilbertEncodeXY = (x, y, max, level) => {
    let xRange = [-max, max];
    let yRange = [-max, max]

    let curSquare = 'a';

    let position = "";

    for (let i = level - 1; i >= 0; i--) {
        const lngMid = (xRange[0] + xRange[1]) / 2;
        const latMid = (yRange[0] + yRange[1]) / 2;

        let quadX = x >= lngMid ? 1 : 0;
        xRange[1 - quadX] = lngMid;
        let quadY = y >= latMid ? 1 : 0;
        yRange[1 - quadY] = latMid;

        let quadPos = 0;

        [quadPos, curSquare] = HilbertMap[curSquare][
            `${ quadX },${ quadY }`
        ];

        position += (quadPos >= 2 ? "1" : "0") + (quadPos % 2 ? "1" : "0");
    }

    return position || "0";
};

export const HilbertDecode = code => {
    let lngRange = [-180.0, 180.0];
    let latRange = [-90.0, 90.0];

    let curSquare = 'a';

    for (let i = 0; i < code.length; i += 2) {
        const lngMid = (lngRange[0] + lngRange[1]) / 2;
        const latMid = (latRange[0] + latRange[1]) / 2;

        const quadPos = parseInt(code.substr(i, 2), 2);
        let quadX = 0;
        let quadY = 0;

        [quadX, quadY, curSquare] = HilbertMapReverse[curSquare][quadPos];

        lngRange[1 - quadX] = lngMid;
        latRange[1 - quadY] = latMid;
    }

    return {
        lng: (lngRange[0] + lngRange[1]) / 2,
        lat: (latRange[0] + latRange[1]) / 2
    };
};

export const HilbertDecodeValidArea = code => {
    let lngRange = [-180.0, 180.0];
    let latRange = [-90.0, 90.0];

    let curSquare = 'a';

    for (let i = 0; i < code.length; i += 2) {
        const lngMid = (lngRange[0] + lngRange[1]) / 2;
        const latMid = (latRange[0] + latRange[1]) / 2;

        const quadPos = parseInt(code.substr(i, 2), 2);
        let quadX = 0;
        let quadY = 0;

        [quadX, quadY, curSquare] = HilbertMapReverse[curSquare][quadPos];

        lngRange[1 - quadX] = lngMid;
        latRange[1 - quadY] = latMid;
    }

    return {
        lng: lngRange,
        lat: latRange
    };
};
