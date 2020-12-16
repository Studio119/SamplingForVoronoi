/*
 * @Author: Kanata You 
 * @Date: 2020-12-15 14:25:15 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-16 19:28:51
 */

import React, { Component } from "react";
import axios from "axios";
import { connect } from "react-redux";
import { DataCenter } from "../reducers/DataCenter";
import encodePath from "../Tools/pathEncoder";
import { Map } from "./Map";


export interface ControlStripProps {
    path: string;
    sampled: boolean;
    loadDataset: (path: string) => any;
    loadSample: () => any;
    reset: () => any
};

export interface ControlStripState {
    sampleLock: boolean;
};

// @ts-ignore
@connect(DataCenter.mapStateToProps, DataCenter.mapDispatchToProps)
class FfControlStrip extends Component<ControlStripProps, ControlStripState> {

    protected button: React.RefObject<HTMLInputElement>;

    public constructor(props: ControlStripProps) {
        super(props);

        this.button = React.createRef<HTMLInputElement>();
        this.state = {
            sampleLock: false
        };
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
                <label className="button" key="dataset" tabIndex={ 1 } style={{
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
                <label className="button" key="origin" tabIndex={ 1 } style={{
                    display: "inline-block",
                    cursor: "pointer",
                    padding: "3px 8px 1.5px",
                    userSelect: "none"
                }}
                onClick={
                    () => {
                        this.props.reset();
                    }
                } >
                    { `origin` }
                </label>
                <label className="button" key="sample" tabIndex={ 1 } style={{
                    pointerEvents: this.state.sampleLock || this.props.sampled ? "none" : "inherit",
                    opacity: this.state.sampleLock || this.props.sampled ? 0.5 : undefined,
                    display: "inline-block",
                    cursor: this.state.sampleLock || this.props.sampled ? undefined : "pointer",
                    padding: "3px 8px 1.5px",
                    userSelect: "none"
                }}
                onClick={
                    () => {
                        if (this.state.sampleLock) {
                            return;
                        }
                        if (this.props.sampled) {
                            alert("Do not apply sampling on sampled data.");
                            return;
                        }
                        this.setState({
                            sampleLock: true
                        });
                        const snapshot = Map.takeSnapshot();
                        snapshot.then(data => {
                            axios.post(`/snapshot`, {
                                path: encodePath(this.props.path),
                                data: data
                            }).then(res0 => {
                                if (res0.data.status) {
                                    axios.get(`/sample/${ encodePath(this.props.path) }`).then(res => {
                                        if (res.data.status) {
                                            this.props.loadSample();
                                        } else {
                                            console.error(res.data.message);
                                        }
                                    }).catch(reason => {
                                        console.error(reason);
                                    });
                                } else {
                                    console.error(res0.data.message);
                                }
                            });
                        }).catch(err => {
                            console.error(err);
                        }).finally(() => {
                            this.setState({
                                sampleLock: false
                            });
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
