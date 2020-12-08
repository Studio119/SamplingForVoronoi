import React, { Component } from "react";
import { System } from "./System";
import ValueBar from "./tools/ValueBar";
// import Color, { ColorThemes } from "./preference/Color";
// import $ from 'jquery';


export interface ControlPanelProps {
    width: number;
    height: number;
    padding: [number, number];
    mapViewChange: () => void;
    merge: () => void;
    ifSample: () => void;
};

export interface ControlPanelState {
}

export class ControlPanel extends Component<ControlPanelProps, ControlPanelState> {

    public constructor(props: ControlPanelProps) {
        super(props);
    }

    public render() {
        return (
            <div key="main" style={{
                width: this.props.width,
                height: this.props.height,
                padding: `${ this.props.padding[0] }px ${ this.props.padding[1] }px`,
                fontSize: '15px'
            }}>
                <div key="buttonBox" style={{
                    display: "block",
                    float: "left",
                }}>
                <button key='sampled' style={{
                    height: this.props.height,
                    fontSize: '15px',
                    fontWeight: 600,
                    marginLeft: 5,
                    border: System.sampled ? '2px solid black' : '2px solid #aaaaaa',
                    borderRadius: System.sampled ? 5 : 0,
                    cursor: 'pointer',
                    backgroundColor: System.sampled ? '#dddddd' : '#ffffff',
                }}
                onClick={ () => {
                    System.sampled = !System.sampled;
                    this.props.ifSample();
                    this.forceUpdate();
                } }
                >{ System.sampled === true ? "sample" : "unsample" }
                </button>
                <button key='voronoi' style={{
                    height: this.props.height,
                    fontSize: '15px',
                    fontWeight: 600,
                    marginLeft: 5,
                    border: System.voronoi ? '2px solid black' : '2px solid #aaaaaa',
                    borderRadius: System.voronoi ? 5 : 0,
                    cursor: 'pointer',
                    backgroundColor: System.voronoi ? '#dddddd' : '#ffffff',

                }}
                onClick={ () => {
                    System.voronoi = !System.voronoi;
                    this.props.mapViewChange();
                    this.forceUpdate();
                } }>{ "voronoi" }
                </button>
                <button key='fill' style={{
                    height: this.props.height,
                    fontSize: '15px',
                    fontWeight: 600,
                    marginLeft: 5,
                    border: System.fill ? '2px solid black' : '2px solid #aaaaaa',
                    borderRadius: System.fill ? 5 : 0,
                    cursor: 'pointer',
                    backgroundColor: System.fill ? '#dddddd' : '#ffffff',

                }}
                onClick={ () => {
                    System.fill = !System.fill;
                    this.props.mapViewChange();
                    this.forceUpdate();
                } }>{ "fill" }
                </button>
                <button key='border' style={{
                    height: this.props.height,
                    fontSize: '15px',
                    fontWeight: 600,
                    marginLeft: 5,
                    border: System.border ? '2px solid black' : '2px solid #aaaaaa',
                    borderRadius: System.border ? 5 : 0,
                    cursor: 'pointer',
                    backgroundColor: System.border ? '#dddddd' : '#ffffff',

                }}
                onClick={ () => {
                    System.border = !System.border;
                    this.props.mapViewChange();
                    this.forceUpdate();
                } }>{ "border" }
                </button>
                <button key='merge' style={{
                    height: this.props.height,
                    fontSize: '15px',
                    fontWeight: 600,
                    marginLeft: 5,
                    border: System.merge ? '2px solid black' : '2px solid #aaaaaa',
                    borderRadius: System.merge ? 5 : 0,
                    cursor: 'pointer',
                    backgroundColor: System.merge ? '#dddddd' : '#ffffff',

                }}
                onClick={ () => {
                    System.merge = !System.merge;
                    this.props.mapViewChange();
                    this.forceUpdate();
                } }>{ "merge" }
                </button>
                
                <button key='kemean' style={{
                    height: this.props.height,
                    fontSize: '15px',
                    fontWeight: 600,
                    marginLeft: 5,
                    border: '2px solid black',
                    borderRadius: 5,
                    cursor: 'pointer',
                    backgroundColor: '#dddddd',

                }}
                onClick={ () => {
                    this.props.merge();
                    this.forceUpdate();
                } }>{ "Kmeans" }
                </button>
                </div>
                <div key="3"
                    style={{
                        width: "300px",
                        height: this.props.height,
                        paddingLeft: 20,
                        // float: "left",
                        display: "inline-flex",
                        // paddingTop: 20,
                        marginLeft: "-1200px"
                    }} >
                        <ValueBar width={ 160 } height={ 20 } label="clusters"
                        min={ 100 } max={ 3000 } step={ 100 } defaultValue={ 1000 }
                        style={{
                            transform: "unset",
                            alignItems: ""
                        }}
                        valueFormatter={
                            (value: number) => `${ value }`
                        }
                        onValueChange={
                            (value: number) => {
                                System.params.classes = value;
                            }
                        } />
                </div>
            </div>
        );
    }
}