1. 点到面的需求：一直以来很重要
    原因：点是有限的（通过有限的点获取面的信息）
    常用方法：克里金系列插值方法、统计回归方法

2. Voronoi 图方法
    最初运用于降水数据分析
    在生成 点->面 数值上现在很少使用
    > 泰森多边形文章 -> 设计 ---- 优化选址方面

3. 点数量大 -> 生成泰森多边形过于密集，视觉效果差（视觉叠加）

## 采样方案

    > 生成泰森多边形（？）
    + 优化视觉表达
    + 维持属性分布和语义特征
    + 根本目的：**（需要调研）**
        1. 从点到面的，传统方法->点的数量大->生成的泰森多边形不均匀->视觉效果不佳，对于探索不利
        _本质上是采样问题_
    根据采样点生成泰森多边形
    语义上减小冲突

## Multi-Scale SuperPixel

1. 以面代点 -> 普通克里金插值结果
2. 保留异常值
    有意义，用于观察脏数据或兴趣点。
3. 不同大小的聚类簇
    找到一个数据 case 说明
    （找到原始数据密度与生成的簇大小数量无决定性关系的反例）