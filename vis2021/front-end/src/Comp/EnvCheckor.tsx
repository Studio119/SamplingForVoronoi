/*
 * @Author: Kanata You 
 * @Date: 2020-12-15 16:54:13 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-15 19:20:42
 */

import React, { useCallback } from "react";


export interface EnvCheckorProps {
    checkors: ((fulfill: (res: any) => void, reject: (reason: any, fixable?: (
        fulfill: (res: any) => void, reject: (reason: any) => void
    ) => void) => void) => void)[];
};

export interface EnvCheckorState {
    active: boolean;
    status: "checking" | "fulfilled" | "rejected" | "fixable" | "fixing";
    data: any;
    index: number;
    autofix: (fulfill: (res: any) => void, reject: (reason: any) => void) => void;
};

export const EnvCheckor: React.FC<EnvCheckorProps> = props => {
    const [state, setState] = React.useState<EnvCheckorState>({
        active: true,
        status: "checking",
        data: null,
        index: 0,
        autofix: () => {}
    });
    
    const onrejected: (reason: any, fixable?: (
        fulfill: (res: any) => void, reject: (reason: any) => void
    ) => void) => void = useCallback(
        (reason: any, fixable?: (
            fulfill: (res: any) => void, reject: (reason: any) => void
        ) => void) => {
            if (fixable) {
                setState({
                    autofix: fixable,
                    active: true,
                    status: "fixable",
                    data: reason,
                    index: state.index
                });
            } else {
                setState({
                    autofix: () => void 0,
                    active: true,
                    status: "rejected",
                    data: reason,
                    index: state.index
                });
            }
        },
        [state, setState]
    );

    const onfulfilled: (res: any) => void = useCallback(
        res => {
            if (state.index + 1 === props.checkors.length) {
                // 已结束
                setState({
                    autofix: () => void 0,
                    active: true,
                    status: "fulfilled",
                    data: res,
                    index: state.index + 1
                });
            } else {
                setState({
                    autofix: () => void 0,
                    active: true,
                    status: "checking",
                    data: res,
                    index: state.index + 1
                });
            }
        },
        [state, props.checkors, setState]
    );

    React.useEffect(() => {
        if (state.status === "checking" && state.index < props.checkors.length) {
            props.checkors[state.index](onfulfilled, onrejected);
        }
    }, [onfulfilled, onrejected, props.checkors, state]);

    return (
        <div style={{
            display: state.active ? "flex" : "none",
            alignItems: "center",
            justifyContent: "center",
            width: "100vw",
            height: "100vh",
            position: "fixed",
            top: 0,
            left: 0,
            backgroundColor: "rgba(47,47,47,0.8)",
            zIndex: 9999
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
                <h2>{ state.status }</h2>
                <p style={{
                    fontSize: "120%"
                }} >
                    {
                        state.status !== "checking"
                            ? state.data
                            : "Checking your local environment..."
                    }
                </p>
                {
                    state.status === "fixable" ? (
                        <p style={{
                            fontSize: "120%"
                        }} >
                            { "Click 'Autofix' to call the fixation." }
                        </p>
                    ) : null
                }
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-around",
                    marginTop: "2em"
                }} >
                    {
                        state.status === "fixable" ? (
                            <label className="button" style={{
                                border: "1px solid black",
                                padding: "0.1em 0.5em",
                                color: "rgb(115,93,61)",
                                cursor: "pointer"
                            }}
                            onClick={
                                () => {
                                    const autofix = state.autofix;
                                    setState({
                                        autofix: () => void 0,
                                        active: true,
                                        status: "fixing",
                                        data: "Running auto fixation, it may takes a long time...",
                                        index: state.index
                                    });
                                    autofix(onfulfilled, onrejected);
                                }
                            } >
                                Autofix
                            </label>
                        ) : null
                    }
                    <label
                    className={
                        state.status !== "checking" && state.status !== "fixing"
                            ? "button" : undefined
                    } style={{
                        opacity: state.status === "checking" || state.status === "fixing"
                            ? 0.4 : "",
                        border: "1px solid black",
                        padding: "0.1em 0.5em",
                        cursor: state.status === "checking" || state.status === "fixing"
                            ? "" : "pointer"
                    }}
                    onClick={
                        () => {
                            if (state.status === "fulfilled") {
                                setState({
                                    ...state,
                                    active: false
                                });
                            } else if (state.status === "rejected" || state.status === "fixable") {
                                window.location.reload();
                            }
                        }
                    } >
                        { state.status === "checking" || state.status === "fixing" ? "..."
                            : state.status === "fulfilled" ? "Continue"
                            : "Refresh" }
                    </label>
                </div>
            </div>
        </div>
    );
};
