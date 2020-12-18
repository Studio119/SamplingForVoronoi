/*
 * @Author: Kanata You 
 * @Date: 2020-12-19 00:56:20 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-19 01:47:59
 */

import React, { Component } from "react";


export interface WaitingProps {};

export interface WaitingState {
    active: boolean;
    message: string | null;
};

export class Waiting extends Component<WaitingProps, WaitingState> {

    protected static ref: Waiting;

    public constructor(props: WaitingProps) {
        super(props);

        if (Waiting.ref) {
            throw ReferenceError("Cannot create Waiting object more than 1.");
        }

        this.state = {
            active: false,
            message: null
        };
    }

    public render(): JSX.Element {
        return (
            <div style={{
                display: this.state.active ? "flex" : "none",
                alignItems: "center",
                justifyContent: "center",
                width: "100vw",
                height: "100vh",
                position: "fixed",
                top: 0,
                left: 0,
                backgroundColor: "rgba(47,47,47,0.8)",
                zIndex: 999
            }} >
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "30px 60px 40px",
                    border: "1px solid black",
                    borderRadius: "8px",
                    backgroundColor: "rgb(250,250,250)"
                }} >
                    <h2>
                        {
                            `${ (this.state.message === null ? "Waiting..." : "Closed") }`
                        }
                        <small>
                            { ` (${ new Date().toLocaleTimeString() })` }
                        </small>
                    </h2>
                    {
                        this.state.message === null ? null : (
                            <div key="msg" style={{
                                textAlign: "left",
                                marginTop: "1em",
                                maxHeight: "30vh",
                                maxWidth: "30vw",
                                overflow: "hidden scroll",
                                wordBreak: "break-all"
                            }} >
                                { this.state.message }
                            </div>
                        )
                    }
                    <div key="btn" style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-around",
                        marginTop: "2em"
                    }} >
                        {
                            this.state.message !== null ? (
                                <label className="button" style={{
                                    border: "1px solid black",
                                    padding: "0.1em 0.5em",
                                    color: "rgb(115,93,61)",
                                    cursor: "pointer"
                                }}
                                onClick={
                                    () => {
                                        this.setState({
                                            active: false,
                                            message: null
                                        });
                                    }
                                } >
                                    Continue
                                </label>
                            ) : null
                        }
                    </div>
                </div>
            </div>
        );
    }

    public componentDidMount(): void {
        Waiting.ref = this;
    }

    public static start(executor: (close: (msg: string) => void) => void): void {
        if (!this.ref) {
            console.error("Cannot get the Waiting object reference.");
            return;
        } else if (this.ref.state.active) {
            console.error("Failed to start: a task is running.");
            return;
        }

        this.ref.setState({
            active: true,
            message: null
        });
        
        executor(msg => {
            this.ref.setState({
                message: msg
            });
        });
    }

};
