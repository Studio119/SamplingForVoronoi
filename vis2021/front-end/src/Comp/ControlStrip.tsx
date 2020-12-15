/*
 * @Author: Kanata You 
 * @Date: 2020-12-15 14:25:15 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-15 20:49:10
 */

import React, { Component } from "react";
import axios from "axios";
import { connect } from "react-redux";
import { DataCenter } from "../reducers/DataCenter";
import encodePath from "../Tools/pathEncoder";


export interface ControlStripProps {
    path: string;
    loadDataset: (path: string) => any;
    loadSample: () => any;
};

export interface ControlStripState {};

// @ts-ignore
@connect(DataCenter.mapStateToProps, DataCenter.mapDispatchToProps)
class FfControlStrip extends Component<ControlStripProps, ControlStripState> {

    protected button: React.RefObject<HTMLInputElement>;

    public constructor(props: ControlStripProps) {
        super(props);

        this.button = React.createRef<HTMLInputElement>();
    }

    public render(): JSX.Element {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "calc(100vw - 2px)",
                padding: "0.2em 0",
                border: "1px solid black",
                marginBottom: "1.6px"
            }} >
                <label className="dataset" key="dataset" tabIndex={ 1 } style={{
                    display: "inline-block",
                    cursor: "pointer",
                    padding: "3px 4px 1.5px",
                    userSelect: "none"
                }}
                onClick={
                    () => {
                        if (this.button.current) {
                            this.button.current.click();
                        }
                    }
                } >
                    { `dataset = ${ this.props.path }` }
                </label>
                <input ref={ this.button } type="file" style={{
                    width: "0",
                    opacity: "0",
                    pointerEvents: "none"
                }}
                onChange={
                    e => {
                        const path = e.currentTarget.value.split("\\").reverse()[0];
                        this.props.loadDataset(path);
                    }
                } />
                <label className="dataset" key="sample" tabIndex={ 1 } style={{
                    display: "inline-block",
                    cursor: "pointer",
                    padding: "3px 8px 1.5px",
                    userSelect: "none"
                }}
                onClick={
                    () => {
                        axios.get(`/sample/${ encodePath(this.props.path) }`).then(res => {
                            if (res.data.status) {
                                this.props.loadSample();
                            } else {
                                console.error(res.data.message);
                            }
                        }).catch(reason => {
                            console.error(reason);
                        });
                    }
                } >
                    { `sample` }
                </label>
            </div>
        );
    }

};

export const ControlStrip: React.FC = _props => {
    return (
        // @ts-ignore
        <FfControlStrip />
    );
};
