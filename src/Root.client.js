/*
 * @Author: Kanata You 
 * @Date: 2021-01-20 18:22:31 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-03-23 14:29:34
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import App, { Root } from "./App.server";
import { createPortal } from 'react-dom';
import WorkSpace from './container/WorkSpace.client';
import SampleDialog from './UI/SampleDialog.server';
import ContextMenu from './container/ContextMenu.client';
import Settings from './UI/Settings.server';
import * as d3 from 'd3';


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

export class ColorMap {

  constructor(colorList, data) {
    this.colorList = [];
    this.length = 0;
    this.breaksD = [];
    this.breaksC = [];
    this.data = data;
    this.discrete = true;
    this.update(colorList);
  }

  update(colorList) {
    this.colorList = [...colorList];
    this.length = this.colorList.length;
    this.breaksD = getNaturalBreak(this.data, this.length);
    this.breaksC = this.length > 1 ? getNaturalBreak(this.data, this.length - 1) : [];
  }

  project(val) {
    if (this.length === 1) {
      return this.colorList[0];
    }
    val = val < 0 ? 0 : val > 1 ? 1 : val;
    if (this.discrete) {
      let floor = 0;
      while (floor < this.length - 1 && val > this.breaksD[floor]) {
        floor += 1;
      }
      return this.colorList[floor];
    } else {
      let floor = 0;
      let span = [0, this.breaksC[1]];
      while (floor < this.length - 2 && val > this.breaksC[floor]) {
        span[0] = this.breaksC[floor];
        floor += 1;
      }
      span[1] = this.breaksC[floor || 1];
      const pos = (val - span[0]) / (span[1] - span[0]);
      return d3.interpolateHsl(
        this.colorList[floor], this.colorList[floor + 1]
      )(Math.min(Math.max(pos, 0), 1));
    }
  }

};

const getNaturalBreak = (data, k) => {
  k = Math.max(1, Math.round(k));
  let [min, max] = [Infinity, -Infinity];
  const sorted = data.map(d => {
    [min, max] = [Math.min(min, d.value), Math.max(max, d.value)];
    return d.value;
  }).sort((a, b) => a - b);
  const labels = [];

  for (let i = 0; i < sorted.length; i++) {
    sorted[i] = (sorted[i] - min) / (max - min);
    labels[i] = -1;
  }

  const centers = [];

  for (let i = 0; i < k; i++) {
    const pos = Math.floor(data.length / k * (i + 0.5));
    centers.push([sorted[pos], []]);
  }

  let ifContinue = true;
  while (ifContinue) {
    ifContinue = false;

    sorted.forEach((d, i) => {
      let idx = 0;
      let min = Math.abs(d - centers[0][0]);
      for (let j = 1; j < centers.length; j++) {
        const dist = Math.abs(d - centers[j][0]);
        if (dist < min) {
          idx = j;
          min = dist;
        }
      }
      centers[idx][1].push(d);
      if (labels[i] !== idx) {
        labels[i] = idx;
        ifContinue = true;
      }
    });

    if (ifContinue) {
      for (let i = 0; i < centers.length; i++) {
        centers[i] = [
          centers[i][1].reduce((p, c) => p + c) / centers[i][1].length,
          []
        ];
      }
    } else {
      for (let i = 0; i < centers.length; i++) {
        centers[i] = Math.min(...centers[i][1]);
      }
    }
  }

  return centers;
};

const createChart = (src, rename=undefined) => {
  let layers = [{
    label:  "scatters",
    active: true,
    opacity: 1
  }, {
    label:  "delaunay",
    active: false,
    opacity: 1
  }, {
    label:  "p_strokes",
    active: false,
    opacity: 1
  }, {
    label:  "polygons",
    active: false,
    opacity: 1
  }];

  if (src.toLowerCase().includes("saa")) {
    layers.push({
      label:  "groups",
      active: false,
      opacity:  1
    }, {
      label:  "disks",
      active: false,
      opacity: 0.7
    });
  } else if (src.toLowerCase().includes("bns")) {
    layers.push({
      label:  "disks",
      active: false,
      opacity: 0.7
    });
  }

  // layers.push({
  //   label:  "links",
  //   active: false,
  //   opacity: 1
  // }, {
  //   label:  "interpolation",
  //   active: false,
  //   opacity: 1
  // });

  return {
    name: rename || src,
    src:  src,
    layers
  };
};


// const colors = [
//   "rgb(213,201,255)",
//   "rgb(196,180,254)",
//   "rgb(182,163,255)",
//   "rgb(169,145,254)",
//   "rgb(160,131,255)",
//   "rgb(130,94,250)",
//   "rgb(76,31,238)",
//   "rgb(45,0,201)",
//   "rgb(39,0,166)",
//   "rgb(30,0,130)"
// ];
const colors = [
  "rgb(212,229,244)",
  "rgb(196,219,239)",
  "rgb(182,211,236)",
  "rgb(168,202,232)",
  "rgb(156,194,230)",
  "rgb(127,174,218)",
  "rgb(74,138,195)",
  "rgb(27,104,174)",
  "rgb(18,85,148)",
  "rgb(12,67,118)"
];

const AppRoot = () => {
  const [state, setState] = useState({
    time:     (new Date()).getTime(),
    datasets: []
  });

  const workSpace = useRef();
  useEffect(() => {
    if (workSpace.current) {
      workSpace.current.setDatasets(state.datasets);
    }
  });

  const sampleDialog = useRef();
  const settings = useRef();

  const fileDialogRef = useRef();

  const fileDialog = useMemo(() => createPortal(
    <input type="file"
      style={{ display: "none" }}
      ref={ fileDialogRef }
      onChange={
        e => {
          const name = e.currentTarget.value.split("\\").reverse()[0].replace(/\.json/, "");
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
            const _name = name.split("\\").reverse()[0].replace(/\.json/, "");
            const borders = window.localStorage.getItem("borders") ? (
              JSON.parse(window.localStorage.getItem("borders"))[_name] || []
            ) : [];
            fr.onload = function() {
              const content = loadJSON(this.result);
              const colorMap = new ColorMap(colors, content);
              setState({
                ...state,
                time:   (new Date()).getTime(),
                datasets: state.datasets.concat({
                  name: _name,
                  data: content,
                  colorMap,
                  samples:  [{
                    name: "total",
                    data: content
                  }],
                  charts:   [
                    createChart("total")
                  ],
                  borders: Root.storeBorders ? (
                    borders
                  ) : []
                })
              });
            };
          }
        }
      } />,
    document.body
  ));

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

  Root.close = src => {
    setState({
      ...state,
      time:   (new Date()).getTime(),
      datasets: state.datasets.filter(dataset => dataset.name !== src.name)
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

  Root.exportSample = (name, src) => {
    const sample = state.datasets.filter(dataset => {
      return dataset.name === name;
    })[0].samples.filter(s => s.name === src)[0].data;

    const a = document.createElement("a");
    a.download = "sample(" + name + "," + src + ").json";
    a.style.display = "none";
    document.body.appendChild(a);
    const dataBlob = new Blob([JSON.stringify(sample)]);
    a.href = URL.createObjectURL(dataBlob);
    a.click();
    a.remove();
  };

  Root.closeChart = (datasetName, name) => {
    setState({
      ...state,
      time:   (new Date()).getTime(),
      datasets: state.datasets.map(dataset => {
        return dataset.name === datasetName ? {
          ...dataset,
          charts: dataset.charts.filter(c => c.name !== name)
        } : dataset;
      })
    });
  };

  Root.sample = dataset => {
    sampleDialog.current.setState({
      show: true,
      dataset
    });
  };

  Root.settings = () => {
    settings.current.setState({
      show: true
    });
  };

  Root.pushSample = (datasetName, name, data) => {
    setState({
      ...state,
      time:   (new Date()).getTime(),
      datasets: state.datasets.map(dataset => {
        if (dataset.name === datasetName) {
          const others = dataset.samples;
          let count = 0;
          others.forEach(s => {
            if (s.name.includes(name)) {
              if (count) {
                const code = /(?<=\()\d+(?=\))/.exec(s.name);
                if (code) {
                  count = Math.max(count, ~~code + 1);
                } else {
                  count = 1;
                }
              } else {
                count = 1;
              }
            }
          });
          if (count) {
            name += ` (${count})`;
          }
          return {
            ...dataset,
            samples: dataset.samples.concat({ name, data }),
            charts: dataset.charts.concat(createChart(name))
          };
        } else {
          return dataset;
        }
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

  Root.getDataset = name => {
    return state.datasets.filter(dataset => dataset.name === name)[0];
  };

  Root.getPopulation = name => {
    let data = [];
    for (let i = 0; i < state.datasets.length; i++) {
      if (state.datasets[i].name === name) {
        data = state.datasets[i].data;
        break;
      }
    }
    return data;
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
        <SampleDialog ref={ sampleDialog } />
        <Settings ref={ settings } />
        <ContextMenu />
    </div>
  );
};

export default AppRoot;
