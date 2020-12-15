/*
 * @Author: Antoine YANG 
 * @Date: 2020-08-21 12:41:26 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-15 10:52:26
 */


/**
 * 地图展示的数据.
 */
export type geodata = {
    id: number;
    lng: number;
    lat: number;
    // hilbertCode: string;
    value: number;
};

/**
 * 二叉树.
 */
export type BinaryTreeNode<T> = {
    parent: BinaryTreeNode<T> | null;
    data: T;
    leftChild: BinaryTreeNode<T> | null;
    rightChild: BinaryTreeNode<T> | null;
};
