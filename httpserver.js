/*
 * @Author: Kanata You 
 * @Date: 2021-03-27 17:00:17 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-03-27 17:31:22
 */

'use strict';

const process = require('child_process');
const fs = require('fs');

let logName = "";

const log = data => {
  data = { ...data, data: (data.data).toString(), time: new Date().toUTCString() };
  console.log(data);
  fs.appendFileSync(logName, JSON.stringify(data) + "\n");
};

const main = async () => {
  while (true) {
    logName = `./logs/log(${ (new Date()).toISOString().split(".")[0].split(":").join("+") }).log`;
    await new Promise(res => {
      const task = process.spawn("npm.cmd", ["run", "hs:prod"]);
      log({type: "start", data: ""});
      task.stdout.on('data', data => {
        log({type: "stdout", data});
      });
      task.stderr.on('data', data => {
        log({type: "stderr", data});
      })
      task.on("close", (code, signal) => {
        log({type: "close", data: {code, signal}});
        res({code, signal});
      });
    }).then(d => {
      log({type: "closed"});
    });
  }
};

main();
