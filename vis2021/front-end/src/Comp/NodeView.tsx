/*
 * @Author: Kanata You 
 * @Date: 2020-12-15 10:51:28 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-15 14:10:30
 */

import { Map } from "./Map";
import { connect } from "react-redux";
import { DataCenter } from "../reducers/DataCenter";


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
            if (this.ctxScatter) {
                this.ctxScatter.clearRect(0, 0, this.props.width, this.props.height);
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
            this.paintNodes();
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
        if (!this.ctxScatter) return;

        this.updated = true;

        this.progress.current?.start(this.timers.length);
    }

};
