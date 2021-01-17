/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 17:07:32 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-17 17:10:20
 */

/**
 * 地图展示的数据.
 */
export type geodata<T extends "population" | "sample" | "drifted" = "population"> = {
  id: number;
  lng: number;
  lat: number;
  value: number;
} & (
  T extends "sample" ? {
    // 当采样完成后，会得到这些属性
    sampled: true;
    diskId: number;
    children: number[]; // 被椭球包含的点的 id
    radius: number;     // x轴与 y轴的半径
    averVal: number;
  } : T extends "drifted" ? {
    sampled: true;
    diskId: number;
    children: number[]; // 被椭球包含的点的 id
    radius: number;     // x轴与 y轴的半径
    averVal: number;
    x: number;
    y: number;
    move: [number, number][];
  } : {}
);

export type Dataset = {
  name: string;
  data: geodata[];
};
