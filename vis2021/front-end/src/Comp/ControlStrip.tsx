/*
 * @Author: Kanata You 
 * @Date: 2020-12-15 14:25:15 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-25 15:58:00
 */

import React, { Component } from "react";
import axios from "axios";
import { connect } from "react-redux";
import { DataCenter } from "../reducers/DataCenter";
import encodePath from "../Tools/pathEncoder";
import { Map } from "./Map";
import { Waiting } from "./Waiting";


export interface ControlStripProps {
    filter: "population" | "sample" | "drifted";
    path: string;
    loadDataset: (path: string) => any;
    loadSample: () => any;
    home: () => any;
    loadDrift: () => any;
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
        const dataset = this.props.path !== "undefined";
        
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
                    { dataset
                        ? `dataset = ${ this.props.path }`
                        : "load dataset"
                    }
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
                { dataset && this.props.filter !== "population"
                    ? (
                        <label className="button" key="origin" tabIndex={ 1 } style={{
                            display: "inline-block",
                            cursor: "pointer",
                            padding: "3px 8px 1.5px",
                            userSelect: "none"
                        }}
                        onClick={
                            () => {
                                this.props.home();
                            }
                        } >
                            { `origin` }
                        </label>
                    )
                    : null
                }
                { dataset && this.props.filter === "population"
                    ? (
                        <label className="button" key="take snapshot" tabIndex={ 1 } style={{
                            pointerEvents: this.state.sampleLock ? "none" : "inherit",
                            opacity: this.state.sampleLock ? 0.5 : undefined,
                            display: "inline-block",
                            cursor: this.state.sampleLock ? undefined : "pointer",
                            padding: "3px 8px 1.5px",
                            userSelect: "none"
                        }}
                        onClick={
                            () => {
                                if (this.state.sampleLock) {
                                    return;
                                }
                                this.setState({
                                    sampleLock: true
                                });
                                Waiting.start(close => {
                                    const snapshot = Map.takeSnapshot();
                                    snapshot.then(data => {
                                        axios.post(`/snapshot`, {
                                            path: encodePath(this.props.path),
                                            data: data
                                        }).then(res0 => {
                                            if (res0.data.status) {
                                                // pass
                                                close("Succeeded.");
                                            } else {
                                                console.error(res0.data.message);
                                                close(JSON.stringify(res0.data.message));
                                            }
                                        }).catch(reason => {
                                            close(JSON.stringify(reason));
                                        }).finally(() => {
                                            this.setState({
                                                sampleLock: false
                                            });
                                        });
                                    }).catch(err => {
                                        console.error(err);
                                        close(JSON.stringify(err));
                                    });
                                });
                            }
                        } >
                            { `take snapshot` }
                        </label>
                    )
                    : null
                }
                { dataset
                    ? (
                        <label className="button" key="sample-GRP" tabIndex={ 1 } style={{
                            pointerEvents: this.state.sampleLock ? "none" : "inherit",
                            opacity: this.state.sampleLock ? 0.5 : undefined,
                            display: "inline-block",
                            cursor: this.state.sampleLock ? undefined : "pointer",
                            padding: "3px 8px 1.5px",
                            userSelect: "none"
                        }}
                        onClick={
                            () => {
                                if (this.state.sampleLock) {
                                    return;
                                }
                                this.setState({
                                    sampleLock: true
                                });
                                Waiting.start(close => {
                                    axios.get(`/sample/grp/${ encodePath(this.props.path) }/6`).then(res => {
                                        if (res.data.status) {
                                            this.props.loadSample();
                                            close("Succeeded.");
                                        } else {
                                            console.error(res.data.message);
                                            close(JSON.stringify(res.data.message));
                                        }
                                    }).catch(reason => {
                                        console.error(reason);
                                        close(JSON.stringify(reason));
                                    }).finally(() => {
                                        this.setState({
                                            sampleLock: false
                                        });
                                    });
                                });
                            }
                        } >
                            { `sample-A` }
                        </label>
                    )
                    : null
                }
                { dataset
                    ? (
                        <label className="button" key="sample-YZD" tabIndex={ 1 } style={{
                            pointerEvents: this.state.sampleLock ? "none" : "inherit",
                            opacity: this.state.sampleLock ? 0.5 : undefined,
                            display: "inline-block",
                            cursor: this.state.sampleLock ? undefined : "pointer",
                            padding: "3px 8px 1.5px",
                            userSelect: "none"
                        }}
                        onClick={
                            () => {
                                if (this.state.sampleLock) {
                                    return;
                                }
                                this.setState({
                                    sampleLock: true
                                });
                                Waiting.start(close => {
                                    axios.get(`/sample/this/${ encodePath(this.props.path) }/8`).then(res => {
                                        if (res.data.status) {
                                            this.props.loadSample();
                                            close("Succeeded.");
                                        } else {
                                            console.error(res.data.message);
                                            close(JSON.stringify(res.data.message));
                                        }
                                    }).catch(reason => {
                                        console.error(reason);
                                        close(JSON.stringify(reason));
                                    }).finally(() => {
                                        this.setState({
                                            sampleLock: false
                                        });
                                    });
                                });
                            }
                        } >
                            { `sample-YZD` }
                        </label>
                    )
                    : null
                }
                { dataset && (this.props.filter === "sample" || this.props.filter === "drifted")
                    ? (
                        <label className="button" key="drift-A" tabIndex={ 1 } style={{
                            pointerEvents: this.state.sampleLock ? "none" : "inherit",
                            opacity: this.state.sampleLock ? 0.5 : undefined,
                            display: "inline-block",
                            cursor: this.state.sampleLock ? undefined : "pointer",
                            padding: "3px 8px 1.5px",
                            userSelect: "none"
                        }}
                        onClick={
                            () => {
                                if (this.state.sampleLock) {
                                    return;
                                }
                                this.setState({
                                    sampleLock: true
                                });
                                Waiting.start(close => {
                                    axios.post(`/drift/grp`, {
                                        data: Map.getVoronoiPolygons(),
                                        path: this.props.filter === "drifted"
                                            ? "drifted_" + this.props.path
                                            : "sampled_" + this.props.path,
                                        ticks: 100
                                    }).then(res => {
                                        if (res.data.status) {
                                            this.props.loadDrift();
                                            close("Succeeded.");
                                        } else {
                                            console.error(res.data.message);
                                            close(JSON.stringify(res.data.message));
                                        }
                                    }).catch(reason => {
                                        console.error(reason);
                                        close(JSON.stringify(reason));
                                    }).finally(() => {
                                        this.setState({
                                            sampleLock: false
                                        });
                                    });
                                });
                            }
                        } >
                            { `drift-A` }
                        </label>
                    )
                    : null
                }
                { dataset && (this.props.filter === "sample" || this.props.filter === "drifted")
                    ? (
                        <label className="button" key="drift-YZD" tabIndex={ 1 } style={{
                            pointerEvents: this.state.sampleLock ? "none" : "inherit",
                            opacity: this.state.sampleLock ? 0.5 : undefined,
                            display: "inline-block",
                            cursor: this.state.sampleLock ? undefined : "pointer",
                            padding: "3px 8px 1.5px",
                            userSelect: "none"
                        }}
                        onClick={
                            () => {
                                if (this.state.sampleLock) {
                                    return;
                                }
                                this.setState({
                                    sampleLock: true
                                });
                                Waiting.start(close => {
                                    axios.get(`/drift/this/${ encodePath(
                                        this.props.filter === "drifted"
                                            ? "drifted_" + this.props.path
                                            : "sampled_" + this.props.path
                                    ) }/100`).then(res => {
                                        if (res.data.status) {
                                            this.props.loadDrift();
                                            close("Succeeded.");
                                        } else {
                                            console.error(res.data.message);
                                            close(JSON.stringify(res.data.message));
                                        }
                                    }).catch(reason => {
                                        console.error(reason);
                                        close(JSON.stringify(reason));
                                    }).finally(() => {
                                        this.setState({
                                            sampleLock: false
                                        });
                                    });
                                });
                            }
                        } >
                            { `drift-YZD` }
                        </label>
                    )
                    : null
                }
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
