/*
 * @Author: Antoine YANG 
 * @Date: 2020-08-21 12:41:26 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-19 19:30:08
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

/**
 * 二叉树.
 */
export type BinaryTreeNode<T> = {
    parent: BinaryTreeNode<T> | null;
    data: T;
    leftChild: BinaryTreeNode<T> | null;
    rightChild: BinaryTreeNode<T> | null;
};
