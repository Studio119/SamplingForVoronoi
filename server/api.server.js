/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const process = require('child_process');

const register = require('react-server-dom-webpack/node-register');
register();
const babelRegister = require('@babel/register');

babelRegister({
  ignore: [/[\\\/](build|server|node_modules)[\\\/]/],
  presets: [['react-app', {runtime: 'automatic'}]],
  plugins: ['@babel/transform-modules-commonjs'],
});

const express = require('express');
const compress = require('compression');
const fs = require('fs');
const {unlink, writeFile} = require('fs/promises');
const {pipeToNodeWritable} = require('react-server-dom-webpack/writer');
const path = require('path');
const ReactApp = require('../src/App.server').default;
const React = require('react');

// Don't keep credentials in the source tree in a real app!

const PORT = 4000;
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json());

app.use(compress());
app.use(express.json());

app.listen(PORT, () => {
  console.log('React app listening at 4000...');
}).setTimeout(60 * 1e3 * 10);

function handleErrors(fn) {
  return async function(req, res, next) {
    try {
      return await fn(req, res);
    } catch (x) {
      next(x);
    }
  };
}

app.get(
  '/',
  handleErrors(async function(_req, res) {
    await waitForWebpack();
    const html = fs.readFileSync(
      path.resolve(__dirname, '../build/index.html'),
      'utf8'
    );
    // Note: this is sending an empty HTML shell, like a client-side-only app.
    // However, the intended solution (which isn't built out yet) is to read
    // from the Server endpoint and turn its response into an HTML stream.
    res.send(html);
  })
);

app.get('/process', (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
  if (fs.existsSync("./storage/log.txt")) {
    res.json({
      status: true,
      data:   fs.readFileSync("./storage/log.txt").toString()
    });
  } else {
    res.json({
      status: false
    });
  }
});

app.post("/snapshot", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
  const name = req.body["name"];
  const data = req.body["data"];

  const target = "./storage/snapshot_" + name + ".json";

  if (fs.existsSync(target)) {
    res.json({
      status: true,
      message: "Snapshot already storaged."
    });
    return;
  }
  
  fs.writeFileSync(target, JSON.stringify(data));
  
  process.exec(
    `conda activate vis2021 && python ./python/kde.py ${ name }.json`,
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

app.get("/sample/sb/:dataset/:n_cols/:Rm", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const path = req.params["dataset"];
    const n_cols = req.params["n_cols"];
    const Rm = req.params["Rm"];
    process.exec(
      `conda activate vis2021 && python ./python/sample_sb.py ${ path } ${ n_cols } ${ Rm }`,
      (error, stdout, stderr) => {
        if (fs.existsSync("./storage/log.txt")) {
          fs.unlinkSync("./storage/log.txt");
        }
        if (error || stderr) {
          res.json({
            status: false,
            message: stdout || stderr || error
          });
        } else if (!stdout.includes('Error')) {
          res.json({
            status: true,
            message: "Completed",
            data: JSON.parse(
              fs.readFileSync(
                "./storage/sb_" + path + "$n_cols=" + n_cols + "$R=" + Rm + ".json"
              )
            )
          });
        } else {
          res.json({
            status: false,
            message: stdout
          });
        }
        if (fs.existsSync("./storage/log.txt")) {
          fs.unlinkSync("./storage/log.txt");
        }
      }
    );
});

app.get("/sample/b3/:dataset/:n_cols/:Rm", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const path = req.params["dataset"];
    const n_cols = req.params["n_cols"];
    const Rm = req.params["Rm"];
    process.exec(
      `conda activate vis2021 && python ./python/sample_b3.py ${ path } ${ n_cols } ${ Rm }`,
      (error, stdout, stderr) => {
        if (fs.existsSync("./storage/log.txt")) {
          fs.unlinkSync("./storage/log.txt");
        }
        if (error || stderr) {
          res.json({
            status: false,
            message: stdout || stderr || error
          });
        } else if (!stdout.includes('Error')) {
          res.json({
            status: true,
            message: "Completed",
            data: JSON.parse(
              fs.readFileSync(
                "./storage/b3_" + path + "$n_cols=" + n_cols + "$R=" + Rm + ".json"
              )
            )
          });
        } else {
          res.json({
            status: false,
            message: stdout
          });
        }
        if (fs.existsSync("./storage/log.txt")) {
          fs.unlinkSync("./storage/log.txt");
        }
      }
    );
});

app.get("/sample/ab/:dataset/:n_cols/:Rm/:extending", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const path = req.params["dataset"];
    const n_cols = req.params["n_cols"];
    const Rm = req.params["Rm"];
    const extending = req.params["extending"];
    process.exec(
      `conda activate vis2021 && python ./python/sample_ab.py ${
        path } ${ n_cols } ${ Rm } ${ extending }`,
      (error, stdout, stderr) => {
        if (fs.existsSync("./storage/log.txt")) {
          fs.unlinkSync("./storage/log.txt");
        }
        console.log({error, stdout, stderr})
        if (error || stderr) {
          res.json({
            status: false,
            message: stdout || stderr || error
          });
        } else if (!stdout.includes('Error')) {
          res.json({
            status: true,
            message: "Completed",
            data: JSON.parse(
              fs.readFileSync(
                "./storage/ab_" + path + "$n_cols=" + n_cols + "$R=" + Rm
                  + "$extending=" + extending + ".json"
              )
            )
          });
        } else {
          res.json({
            status: false,
            message: stdout
          });
        }
        if (fs.existsSync("./storage/log.txt")) {
          fs.unlinkSync("./storage/log.txt");
        }
      }
    );
});

app.get("/sample/ssb/:dataset/:Rm/:num", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const path = req.params["dataset"];
    const Rm = req.params["Rm"];
    const num = req.params["num"];

    process.exec(
      `conda activate vis2021 && python ./python/sample_ssb.py ${
        path } ${ Rm } ${ num }`,
      (error, stdout, stderr) => {
        if (fs.existsSync("./storage/log.txt")) {
          fs.unlinkSync("./storage/log.txt");
        }
        if (error || stderr) {
          res.json({
            status: false,
            message: stdout || stderr || error
          });
        } else if (!stdout.includes('Error')) {
          res.json({
            status: true,
            message: "Completed",
            data: JSON.parse(
              fs.readFileSync(
                "./storage/ssb_" + path + "$R=" + Rm + "$num=" + num + ".json"
              )
            )
          });
        } else {
          res.json({
            status: false,
            message: stdout
          });
        }
        if (fs.existsSync("./storage/log.txt")) {
          fs.unlinkSync("./storage/log.txt");
        }
      }
    );
});

app.get("/clustering/:dataset", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const path = "./storage/oc_" + req.params["dataset"] + ".json"
    if (fs.existsSync(path)) {
      res.json({
        status: true,
        message: "Completed",
        data: JSON.parse(
          fs.readFileSync(path)
        )
      });
    } else {
      res.json({
        status: false,
        message: "Not exist",
        data: null
      });
    }
});

app.get("/cluster/:dataset/:k", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const path = req.params["dataset"];
    const k = req.params["k"];
    process.exec(
      `conda activate vis2021 && python ./python/kmeans.py ${ path } ${ k }`,
      (error, stdout, stderr) => {
        if (fs.existsSync("./storage/log.txt")) {
          fs.unlinkSync("./storage/log.txt");
        }
        if (error || stderr) {
          res.json({
            status: false,
            message: stdout || stderr || error
          });
        } else if (!stdout.includes('Error')) {
          res.json({
            status: true,
            message: "Completed",
            data: JSON.parse(
              fs.readFileSync(
                "./storage/km_" + path + "$k=" + k + ".json"
              )
            )
          });
        } else {
          res.json({
            status: false,
            message: stdout
          });
        }
        if (fs.existsSync("./storage/log.txt")) {
          fs.unlinkSync("./storage/log.txt");
        }
      }
    );
});

app.get("/onlycluster/:dataset/:k/:rVal", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
    const path = req.params["dataset"];
    const k = req.params["k"];
    const rVal = req.params["rVal"];
    process.exec(
      `conda activate vis2021 && python ./python/skmeans.py ${ path } ${ k } ${ rVal }`,
      (error, stdout, stderr) => {
        if (fs.existsSync("./storage/log.txt")) {
          fs.unlinkSync("./storage/log.txt");
        }
        if (error || stderr) {
          res.json({
            status: false,
            message: stdout || stderr || error
          });
        } else if (!stdout.includes('Error')) {
          res.json({
            status: true,
            message: "Completed",
            data: JSON.parse(
              fs.readFileSync(
                "./storage/skm_" + path + "$k=" + k + ".json"
              )
            )
          });
        } else {
          res.json({
            status: false,
            message: stdout
          });
        }
        if (fs.existsSync("./storage/log.txt")) {
          fs.unlinkSync("./storage/log.txt");
        }
      }
    );
});

let files = [];

app.get("/readStorage", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
  const dir = fs.readdirSync("./storage");
  files = dir.map(name => {
    const file = fs.statSync("./storage/" + name);
    return {
      name,
      size: file.size,
      type: name.startsWith("snapshot_") ? 0
            : name.startsWith("kde_") ? 1
            : name.startsWith("group_") ? 2
            : 3
    };
  });
  res.json({
    status: true,
    message: "Completed",
    data: files
  });
});

app.get("/clearStorage/:t0/:t1/:t2/:t3", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3000");
  const types = [
    req.params["t0"] === "1",
    req.params["t1"] === "1",
    req.params["t2"] === "1",
    req.params["t3"] === "1"
  ];
  let stat = {
    count:  0,
    size:   0
  };
  files.forEach(file => {
    if (types[file.type]) {
      try {
        fs.unlinkSync("./storage/" + file.name);
        stat.count += 1;
        stat.size += file.size;
      } catch {}
    }
  });
  res.json({
    status: true,
    message: "Completed",
    data: stat
  });
});

async function renderReactTree(res, props) {
  await waitForWebpack();
  const manifest = fs.readFileSync(
    path.resolve(__dirname, '../build/react-client-manifest.json'),
    'utf8'
  );
  const moduleMap = JSON.parse(manifest);
  pipeToNodeWritable(React.createElement(ReactApp, props), res, moduleMap);
}

function sendResponse(req, res, redirectToId) {
  const location = JSON.parse(req.query.location);
  if (redirectToId) {
    location.selectedId = redirectToId;
  }
  res.set('X-Location', JSON.stringify(location));
  renderReactTree(res, {
    selectedId: location.selectedId,
    isEditing: location.isEditing,
    searchText: location.searchText,
  });
}

app.get('/react', function(req, res) {
  sendResponse(req, res, null);
});

app.use(express.static('build'));
app.use(express.static('public'));

app.on('error', function(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

async function waitForWebpack() {
  while (true) {
    try {
      fs.readFileSync(path.resolve(__dirname, '../build/index.html'));
      return;
    } catch (err) {
      console.log(
        'Could not find webpack build output. Will retry in a second...'
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
