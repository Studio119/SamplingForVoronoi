/*
 * @Author: Antoine YANG 
 * @Date: 2019-10-24 17:47:11 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-18 02:04:43
 */


/**
 * Translates color code or rgb(a) to hsl(a)
 * @param {string} color code input
 */
const toHsl = (color) => {
        let h = 0;
        let s = 0;
        let l = 0;
        let a = 1;
        if (color.startsWith('#')) {
            let r = 0;
            let g = 0;
            let b = 0;
            if (color.length === 4) {
                r = 255 * parseInt(color[1], 16) / 16;
                g = 255 * parseInt(color[2], 16) / 16;
                b = 255 * parseInt(color[3], 16) / 16;
                color = `rgb(${ r },${ g },${ b })`;
            }
            else if (color.length === 5) {
                r = 255 * parseInt(color[1], 16) / 16;
                g = 255 * parseInt(color[2], 16) / 16;
                b = 255 * parseInt(color[3], 16) / 16;
                let alpha = 255 * parseInt(color[4], 16);
                color = `rgba(${ r },${ g },${ b },${ alpha })`;
            }
            else if (color.length === 7) {
                r = parseInt(color.substr(1, 2), 16);
                g = parseInt(color.substr(3, 2), 16);
                b = parseInt(color.substr(5, 2), 16);
                color = `rgb(${ r },${ g },${ b })`;
            }
            else if (color.length === 9) {
                r = parseInt(color.substr(1, 2), 16);
                g = parseInt(color.substr(3, 2), 16);
                b = parseInt(color.substr(5, 2), 16);
                let alpha = 255 * parseInt(color[7], 256);
                color = `rgba(${ r },${ g },${ b },${ alpha })`;
            }
        }
        if (color.startsWith('rgb(')) {
            let r = 0;
            let g = 0;
            let b = 0;
            const paths = color.substring(color.indexOf('(') + 1, color.indexOf(')')).split(',');
            r = parseFloat(paths[0]) / 255;
            g = parseFloat(paths[1]) / 255;
            b = parseFloat(paths[2]) / 255;
            let max = Math.max(r, g, b);
            let min = Math.min(r, g, b);
            h = max === min
                ? 0
                : r === max
                    ? g >= b
                        ? 60 * (g - b) / (max - min)
                        : 60 * (g - b) / (max - min) + 360
                    : g === max
                        ? 60 * (b - r) / (max - min) + 120
                        : 60 * (r - g) / (max - min) + 240;
            l = (max + min) / 2;
            s = l === 0 || max === min ? 0
                : l <= 1 / 2
                    ? (max - min) / (max + min)
                    : (max - min) / (2 - max - min);
            return { code: `hsl(${ h },${ s },${ l })`, h: h, s: s, l: l, a: 1 };
        }
        else if (color.startsWith('rgba(')) {
            let r = 0;
            let g = 0;
            let b = 0;
            const paths = color.substring(color.indexOf('(') + 1, color.indexOf(')')).split(',');
            r = parseFloat(paths[0]) / 255;
            g = parseFloat(paths[1]) / 255;
            b = parseFloat(paths[2]) / 255;
            a = parseFloat(paths[3]);
            let max = Math.max(r, g, b);
            let min = Math.min(r, g, b);
            h = max === min
                ? 0
                : r === max
                    ? g >= b
                        ? 60 * (g - b) / (max - min)
                        : 60 * (g - b) / (max - min) + 360
                    : g === max
                        ? 60 * (b - r) / (max - min) + 120
                        : 60 * (r - g) / (max - min) + 240;
            l = (max + min) / 2;
            s = l === 0 || max === min ? 0
                : l <= 1 / 2
                    ? (max - min) / (max + min)
                    : (max - min) / (2 - max - min);
            return { code: `hsla(${ h },${ s },${ l },${ a })`, h: h, s: s, l: l, a: a };
        }
        return { code: 'none', h: h, s: s, l: l, a: a };
    };


const toRgb = (hsl) => {
        let params = hsl.substring(hsl.indexOf('(') + 1, hsl.indexOf(')')).split(',');
        if (params.length === 3 || params.length === 4) {
            let h = parseFloat(params[0]);
            let s = parseFloat(params[1]);
            let l = parseFloat(params[2]);
            let q = l < 1 / 2 ? l * (1 + s) : l + s - (l * s);
            let p = 2 * l - q;
            let h_k = h / 360;
            let t_r = h_k + 1 / 3;
            t_r = t_r > 1 ? t_r - 1 : t_r < 0 ? t_r + 1 : t_r;
            let t_g = h_k;
            t_g = t_g > 1 ? t_g - 1 : t_g < 0 ? t_g + 1 : t_g;
            let t_b = h_k - 1 / 3;
            t_b = t_b > 1 ? t_b - 1 : t_b < 0 ? t_b + 1 : t_b;

            let r = t_r < 1 / 6
                ? p + (q - p) * 6 * t_r
                : t_r < 1 / 2
                    ? q
                    : t_r < 2 / 3
                        ? p + (q - p) * 6 * (2 / 3 - t_r)
                        : p;
            let g = t_g < 1 / 6
                ? p + (q - p) * 6 * t_g
                : t_g < 1 / 2
                    ? q
                    : t_g < 2 / 3
                        ? p + (q - p) * 6 * (2 / 3 - t_g)
                        : p;
            let b = t_b < 1 / 6
                ? p + (q - p) * 6 * t_b
                : t_b < 1 / 2
                    ? q
                    : t_b < 2 / 3
                        ? p + (q - p) * 6 * (2 / 3 - t_b)
                        : p;

            if (params.length === 4) {
                return `rgba(${ Math.floor(r * 255) },${ Math.floor(g * 255) },${ Math.floor(b * 255) },${ params[3] })`;
            }
            return `rgb(${ Math.floor(r * 255) },${ Math.floor(g * 255) },${ Math.floor(b * 255) })`;
        }
        return 'none';
    };


/**
 * Sets lightness of a color.
 * @param {string} color
 * @param {number} degree
 * @returns
 */
const setLightness = (color, degree) => {
        const { h, s, a } = toHsl(color);
        let hsl = a === 1 ? `hsl(${ h },${ s },${ degree })` : `hsla(${ h },${ s },${ degree },${ a })`;
        return toRgb(hsl);
    };
    

/**
 * Returns a interpolation between two colors.
 * @param {string} color1
 * @param {string} color2
 * @param {number} step a number between [0, 1]
 * @returns
 */
const interpolate = (color1, color2, step = 0.5, mode = "hsl") => {
        if (mode === "hsl") {
            const hsl1 = toHsl(color1);
            const hsl2 = toHsl(color2);
            let h = hsl1.h * (1 - step) + hsl2.h * step;
            let s = hsl1.s * (1 - step) + hsl2.s * step;
            let l = hsl1.l * (1 - step) + hsl2.l * step;
            let a = hsl1.a * (1 - step) + hsl2.a * step;
            a = isNaN(a) ? 1 : a;
            let hsl = a === 1 ? `hsl(${ h },${ s },${ l })` : `hsla(${ h },${ s },${ l },${ a })`;
            return toRgb(hsl);
        } else {
            const rgb1 = getRgba(color1);
            const rgb2 = getRgba(color2);
            return `rgba(${
                Math.floor(rgb1.r * (1 - step) + rgb2.r * step)
            },${
                Math.floor(rgb1.g * (1 - step) + rgb2.g * step)
            },${
                Math.floor(rgb1.b * (1 - step) + rgb2.b * step)
            },${
                rgb1.a * (1 - step) + rgb2.a * step
            })`;
        }
    };

const getRgba = (color) => {
        if (!color.startsWith("rgb")) {
            color = toRgb(color);
        }
        let colorSet = color.match(/\d+/g);
        if (color.startsWith("rgba")) {
            return {
                r: parseInt(colorSet[0]),
                g: parseInt(colorSet[1]),
                b: parseInt(colorSet[2]),
                a: parseFloat(colorSet[3])
            };
        } else {
            return {
                r: parseInt(colorSet[0]),
                g: parseInt(colorSet[1]),
                b: parseInt(colorSet[2]),
                a: 1
            };
        }
    };


/**
 * Color: namespace
 */
const Color = {
    /**Translates a color code to hsl(a).*/
    toHsl: toHsl,
    
    /**Translates a hsl(a) code to rgb(a).*/
    toRgb: toRgb,

    /**Sets lightness of a color.*/
    setLightness: setLightness,
    
    /**Returns a interpolation between two colors.*/
    interpolate: interpolate
}


export default Color;

window['Color'] = Color;
