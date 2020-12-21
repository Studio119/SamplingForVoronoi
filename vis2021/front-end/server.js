/*
 * @Author: Antoine YANG 
 * @Date: 2019-11-15 21:47:38 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2020-12-21 13:13:23
 */

const express = require('express');
const app = express();
const fs = require("fs");
const process = require('child_process');
const bodyParser = require('body-parser');

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json());


const decodePath = path => {
    return path.split("@0x2F").join("/").split("@0x2E").join(".");
};


app.get("/fromfile/:path", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const path = "../dataset/" + decodePath(req.params["path"]);
    fs.readFile(path, (err, data) => {
        if (err) {
            res.json(err);
        } else {
            res.json(JSON.parse(data));
        }
    });
});

app.get("/fromsample/:path", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const path = "../storage/sampled_" + decodePath(req.params["path"]);
    fs.readFile(path, (err, data) => {
        if (err) {
            res.json(err);
        } else {
            res.json(JSON.parse(data));
        }
    });
});

app.get("/fromdrifted/:path", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const path = "../storage/drifted_" + decodePath(req.params["path"]);
    fs.readFile(path, (err, data) => {
        if (err) {
            res.json(err);
        } else {
            res.json(JSON.parse(data));
        }
    });
});

app.post("/snapshot", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const path = decodePath(req.body["path"]);
    const data = req.body["data"];
    fs.writeFileSync("../storage/snapshot_" + path, JSON.stringify(data));
    process.exec(
        `conda activate vis2021 && python ../back-end/kde.py ${ path }`,
        (error, stdout, stderr) => {
            if (error || stderr) {
                res.json({
                    status: false,
                    message: stdout || stderr || error
                });
            } else if (stdout.endsWith('0\r\n')) {
                res.json({
                    status: true,
                    message: "Snapshot storaged successfully."
                });
            } else {
                res.json({
                    status: false,
                    message: stdout
                });
            }
        }
    );
});

const envcheck = [{
    cmd: "conda --version",
    callback: (res, error, stdout, stderr) => {
        if (error || stderr) {
            res.json({
                status: false,
                message: "Failed to get Anaconda version info."
            });
            return;
        } else if (stdout) {
            if (/conda [0-9]+\.[0-9]+\.[0-9]+/.exec(stdout)) {
                res.json({
                    status: true,
                    message: "Anaconda already installed."
                });
                return;
            }
        }
        res.json({
            status: false,
            message: "unknown"
        });
    }
}, {
    cmd: "conda info --envs",
    callback: (res, error, stdout, stderr) => {
        if (error || stderr) {
            res.json({
                status: false,
                message: JSON.stringify(stderr || error)
            });
            return;
        } else if (stdout) {
            if (/\r\nvis2021 /.exec(stdout)) {
                res.json({
                    status: true,
                    message: "Anaconda virtual environment 'vis2021' exits."
                });
                return;
            } else {
                autofix = response => {
                    process.exec(
                        "echo Y | conda create -n vis2021 python=3.7"
                            + " numpy scipy matplotlib",
                        (err, _sout, serr) => {
                        if (err || serr) {
                            response.json({
                                status: false,
                                message: "Auto fixation failed. Run `conda"
                                    + " create -n vis2021 python=3.7"
                                    + " numpy scipy matplotlib`."
                            });
                        } else {
                            response.json({
                                status: true,
                                message: "Created Anaconda virtual environment 'vis2021'."
                            });
                        }
                    });
                };
                res.json({
                    status: false,
                    autofix: true,
                    message: "Failed to find Anaconda virtual environment 'vis2021'."
                });
                return;
            }
        }
    }
}];

app.get("/checkcondaenv/:step", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const step = envcheck[parseInt(req.params["step"])];
    process.exec(step.cmd, (error, stdout, stderr) => {
        step.callback(res, error, stdout, stderr);
    });
});

let autofix = _res => {};

app.get("/autofix", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    autofix(res);
    autofix = _res => {};
});

app.get("/sample/this/:path/:alpha", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const path = decodePath(req.params["path"]);
    const alpha = decodePath(req.params["alpha"]);
    process.exec(
        `conda activate vis2021 && python ../back-end/sample_this.py ${ path } ${ alpha }`,
        (error, stdout, stderr) => {
            // console.log(stdout);
            if (error || stderr) {
                res.json({
                    status: false,
                    message: stdout || stderr || error
                });
            } else if (!stdout.includes('Error')) {
                res.json({
                    status: true,
                    message: "done" + "\n\n" + stdout
                });
            } else {
                res.json({
                    status: false,
                    message: stdout
                });
            }
        }
    );
});

app.get("/drift/:path/:ticks", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const path = decodePath(req.params["path"]);
    const ticks = parseInt(req.params["ticks"]);
    process.exec(
        `conda activate vis2021 && python ../back-end/drift.py ${ path } ${ ticks }`,
        (error, stdout, stderr) => {
            // console.log(stdout);
            if (error || stderr) {
                res.json({
                    status: false,
                    message: stdout || stderr || error
                });
            } else if (!stdout.includes('Error')) {
                res.json({
                    status: true,
                    message: "done" + "\n\n" + stdout
                });
            } else {
                res.json({
                    status: false,
                    message: stdout
                });
            }
        }
    );
});


const server = app.listen(2369, () => {
    const addr = server.address().address;
    const host = addr === "::" ? "127.0.0.1" : addr;
    const port = server.address().port;
    console.log("Back-end server opened at http://" + host + ":" + port);
});

server.setTimeout(60 * 1e3 * 10);
