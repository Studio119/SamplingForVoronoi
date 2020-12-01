/*
 * @Author: Wenyari 
 * @Date: 2020-11-12 19:19:16 
 * @Last Modified by: Wenyari
 * @Last Modified time: 2020-12-01 17:36:39
 */
const express = require('express');
const app = express();
const fs = require("fs");
const process = require('child_process');
const bodyParser = require('body-parser');

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json());

app.get("/oridata", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    res.json(
        JSON.parse(fs.readFileSync('./storage/crimes.json'))
    );
});

app.get("/kmeans", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    res.json(
        JSON.parse(fs.readFileSync('./storage/Kmeans_result.json'))
    );
});

app.get("/merge/:clusters", (req, res) => {
    const cmd = "CHCP 65001 & conda activate tf-fed & python ./public/py/Kmeans.py " + req.params["clusters"];
    
    process.exec(cmd, (error, _, stderr) => {
        if (stderr) {
        } else if (error) {
        } else {
            res.json(
                    JSON.parse(fs.readFileSync("./storage/k_temp.json"))
            );
        }
    });
});

const server = app.listen(2369, () => {
    const addr = server.address().address;
    const host = addr === "::" ? "127.0.0.1" : addr;
    const port = server.address().port;
    console.log("Back-end server opened at http://" + host + ":" + port);
});
