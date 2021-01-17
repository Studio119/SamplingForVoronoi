/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState, createRef } from 'react';
import App, { Root } from "./App.server";
import { createPortal } from 'react-dom';
import Color from "./UI/Color.js";


const loadJSON = content => {
  let data = [];
  JSON.parse(content).forEach(d => {
    if (typeof d.lng === "number" && typeof d.lat === "number" && typeof d.value === "number") {
      data.push({
        id:     d.id || data.length,
        lng:    d.lng,
        lat:    d.lat,
        value:  d.value
      });
    }
  });
  return data;
};

const AppRoot = () => {
  const [state, setState] = useState({
    time:     (new Date()).getTime(),
    datasets: []
  });

  const fileDialogRef = createRef();

  const fileDialog = createPortal(
    <input type="file"
      style={{ display: "none" }}
      ref={ fileDialogRef }
      onChange={
        e => {
          const name = e.currentTarget.value;
          if (name) {
            for (let i = 0; i < state.datasets.length; i++) {
              if (name === datasets[i].name) {
                return;
              }
            }
          }
          if (e.currentTarget.files) {
            const fn = e.currentTarget.files[0];
            const fr = new FileReader();
            fr.readAsText(fn);
            fr.onload = function(_) {
              const content = loadJSON(this.result);
              setState({
                ...state,
                time:   (new Date()).getTime(),
                datasets: state.datasets.concat({
                  name: name.split("\\").reverse()[0].replace(/\.json/, ""),
                  data: content,
                  samples:  [{
                    name: "total",
                    data: content
                  }, {
                    name: "10%",
                    data: content.filter(_ => Math.random() < 0.1)
                  }],
                  charts:   [{
                    src:  "total",
                    colorize: (val, max) => {
                      return Color.interpolate(
                        "rgb(100,156,247)",
                        "rgb(255,13,10)",
                        Math.pow(val / max, 2)
                      );
                    },
                    layers: [{
                      label:  "scatters",
                      active: false
                    }, {
                      label:  "trace",
                      active: false
                    }, {
                      label:  "polygons",
                      active: false
                    }, {
                      label:  "disks",
                      active: false
                    }]
                  }, {
                    src:  "10%",
                    colorize: (val, max) => {
                      return Color.interpolate(
                        "rgb(100,156,247)",
                        "rgb(255,13,10)",
                        Math.pow(val / max, 2)
                      );
                    },
                    layers: [{
                      label:  "scatters",
                      active: false
                    }, {
                      label:  "trace",
                      active: false
                    }, {
                      label:  "polygons",
                      active: false
                    }, {
                      label:  "disks",
                      active: false
                    }]
                  }]
                })
              });
            };
          }
        }
      } />,
    document.body
  );

  Root.fileDialogOpen = () => {
    if (fileDialogRef.current) {
      fileDialogRef.current.click();
    }
  };

  Root.refresh = () => {
    setState({
      ...state,
      time: (new Date()).getTime()
    });
  };

  return (
    <>
      { fileDialog }
      <App key={ (new Date()).getTime() } { ...state } />
    </>
  );
};

export default AppRoot;
