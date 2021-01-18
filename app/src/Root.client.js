/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState, createRef, useEffect } from 'react';
import App, { Root } from "./App.server";
import { createPortal } from 'react-dom';
import Color from "./UI/Color.js";
import WorkSpace from './container/WorkSpace.client';


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

const createChart = (src, rename=undefined) => {
  return {
    name: rename || src,
    src:  src,
    colorize: (val, max) => {
      return Color.interpolate(
        "rgb(100,156,247)",
        "rgb(255,13,10)",
        Math.pow(val / max, 2)
      );
    },
    layers: [{
      label:  "scatters",
      active: true,
      opacity: 1
    }, {
      label:  "trace",
      active: false,
      opacity: 1
    }, {
      label:  "polygons",
      active: false,
      opacity: 0.8
    }, {
      label:  "disks",
      active: false,
      opacity: 0.4
    }]
  };
};

const AppRoot = () => {
  const [state, setState] = useState({
    time:     (new Date()).getTime(),
    datasets: []
  });

  const workSpace = createRef();
  useEffect(() => {
    if (workSpace.current) {
      workSpace.current.setDatasets(state.datasets);
    }
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
              if (name === state.datasets[i].name) {
                return;
              }
            }
          }
          if (e.currentTarget.files) {
            const fn = e.currentTarget.files[0];
            const fr = new FileReader();
            fr.readAsText(fn);
            e.currentTarget.value = null;
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
                    name: "20%",
                    data: content.filter(_ => Math.random() < 0.2)
                  }, {
                    name: "10%",
                    data: content.filter(_ => Math.random() < 0.1)
                  }],
                  charts:   [
                    createChart("total"),
                    // createChart("20%"),
                    // createChart("10%")
                  ]
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

  Root.close = name => {
    setState({
      ...state,
      time:   (new Date()).getTime(),
      datasets: state.datasets.filter(dataset => dataset.name !== name)
    });
  };

  Root.closeSample = (name, src) => {
    setState({
      ...state,
      time:   (new Date()).getTime(),
      datasets: state.datasets.map(dataset => {
        return dataset.name === name ? {
          ...dataset,
          samples: dataset.samples.filter(s => s.name !== src),
          charts: dataset.charts.filter(c => c.src !== src)
        } : dataset;
      })
    });
  };

  Root.paint = (name, src) => {
    setState({
      ...state,
      time:   (new Date()).getTime(),
      datasets: state.datasets.map(dataset => {
        if (dataset.name === name) {
          let name = src;
          let count = 0;
          for (let i = 0; i < dataset.charts.length; i++) {
            const t = dataset.charts[i].name.replace(/\(\d+\)/, "");
            if (t === name) {
              const p = /(?<=\()\d+(?=\))/.exec(dataset.charts[i].name);
              if (p) {
                const n = parseInt(p[0]);
                count = Math.max(count, n + 1);
              } else {
                count = Math.max(count, 1);
              }
            }
          }
          return {
            ...dataset,
            charts: dataset.charts.concat(
              createChart(src, count === 0 ? undefined : (src + "(" + count + ")"))
            )
          };
        }
        return dataset;
      })
    });
  };

  return (
    <div className="main"
      style={{
        width:      "100vw",
        minHeight:  "100vh",
        display:        "flex",
        alignItems:     "stretch",
        justifyContent: "space-between"
      }}
      onContextMenu={
        e => e.preventDefault()
      } >
        <App datasets={ state.datasets } />
        <WorkSpace key="only" ref={ workSpace } />
        { fileDialog }
    </div>
  );
};

export default AppRoot;
