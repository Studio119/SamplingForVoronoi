/*
 * @Author: Kanata You 
 * @Date: 2020-12-15 10:51:28 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-22 18:03:03
 */

import { Map } from "./Map";
import { connect } from "react-redux";
import { DataCenter } from "../reducers/DataCenter";
import kriging from "@sakitam-gis/kriging";


// @ts-ignore
@connect(DataCenter.mapStateToProps)
export class NodeView extends Map {
    
    /**
     * 重绘数据，内部封装绘制模式的分支.
     *
     * @param {boolean} [waiting=true]
     * @returns {void}
     * @memberof Map
     */
    public repaint(waiting: boolean = true): void {
        if (waiting) {
            if (this.ctx0) {
                this.ctx0.clearRect(0, 0, this.props.width, this.props.height);
            }
            if (this.ctx1) {
                this.ctx1.clearRect(0, 0, this.props.width, this.props.height);
            }
            if (this.ctx2) {
                this.ctx2.clearRect(0, 0, this.props.width, this.props.height);
            }
            this.updated = false;
        }
        if (this.updated) {
            return;
        }
        this.clearTimers();
        if (this.map.current) {
            if (!this.map.current!.ready()) {
                this.updated = false;
                setTimeout(() => {
                    this.repaint(false);
                }, 200);
                return;
            }
            // if (this.props.filter === "drifted") {
            //     this.paintNodes();
            // } else {}
            this.paintPixelMap();
        }
    }

    /**
     * 绘制结点.
     *
     * @protected
     * @returns {void}
     * @memberof Map
     */
    protected paintNodes(): void {
        if (!this.ctx0 || !this.ctx1 || !this.ctx2) return;

        this.updated = true;

        this.progress.start(this.timers.length);
    }

    /**
     * 绘制插值结果.
     *
     * @protected
     * @returns {void}
     * @memberof NodeView
     */
    protected paintPixelMap(): void {
        if (!this.ctx0 || !this.ctx1 || !this.ctx2 || !this.map.current) return;

        this.updated = true;

        // let t: number[] = [];
        // let x: number[] = [];
        // let y: number[] = [];

        // this.props.data.then(res => {
        //     if (res.length === 0) {
        //         return;
        //     }

        //     res.forEach(d => {
        //         t.push(d.value);
        //         const pos = this.map.current!.project(d);
        //         x.push(pos.x);
        //         y.push(pos.y);
        //     });

        //     const sigma2 = 0;
        //     const alpha = 100;

        //     // fitting
        //     const variogram = kriging.train(t, x, y, "exponential", sigma2, alpha);
        //     console.log(variogram);

        //     // predicting
        //     // const xnew = new Array(this.props.width).fill(0).map((_, x) => x);
        //     // const ynew = new Array(this.props.height).fill(0).map((_, y) => y);
        //     // const tpredicted = kriging.predict(xnew as unknown as number, ynew as unknown as number, variogram);
        //     // console.log(tpredicted);
    
            // this.progress.start(this.timers.length);
        // });
    }

};
