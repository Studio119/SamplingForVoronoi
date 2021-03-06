/*
 * @Author: Kanata You 
 * @Date: 2021-01-20 18:22:31 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-03-31 20:58:50
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
  // if (Math.random() < 15) {
  //   const res = [];
  //   for (let i = 0; i < k; i++) {
  //     res.push(i / k);
  //   }
  //   return res;
  // }
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
    centers.push([sorted[pos], [], 0]);
  }

  let ifContinue = true;
  while (ifContinue) {
    ifContinue = false;

    sorted.forEach((d, i) => {
      let idx = 0;
      let min = Math.abs(d - centers[0][0]) * (1 + centers[0][2] / data.length * 64);
      for (let j = 1; j < centers.length; j++) {
        const dist = Math.abs(d - centers[j][0]) * (1 + centers[j][2] / data.length);
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
          [],
          centers[i][1].length
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

  if (src.toLowerCase().includes("valmn")) {
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

export const colorLists = [
  /** default VAE blue */ [
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
  ],
  /** VAE green */ [
    "rgb(230,248,96)",
    "rgb(211,239,71)",
    "rgb(195,227,58)",
    "rgb(178,215,43)",
    "rgb(157,204,30)",
    "rgb(133,194,21)",
    "rgb(100,177,15)",
    "rgb(66,154,10)",
    "rgb(38,120,6)",
    "rgb(18,84,3)"
  ],
  /** VAE red */ [
    "rgb(251,246,187)",
    "rgb(249,222,147)",
    "rgb(247,193,114)",
    "rgb(243,168,86)",
    "rgb(238,138,59)",
    "rgb(235,106,38)",
    "rgb(225,76,26)",
    "rgb(205,48,18)",
    "rgb(174,30,12)",
    "rgb(131,18,9)"
  ],
  /** VAE purple */ [
    "rgb(243,217,239)",
    "rgb(232,181,226)",
    "rgb(220,160,212)",
    "rgb(213,130,192)",
    "rgb(197,104,179)",
    "rgb(185,77,154)",
    "rgb(167,49,137)",
    "rgb(140,36,112)",
    "rgb(111,24,98)",
    "rgb(93,32,77)"
  ],
  /** continuous */ [
    "rgb(200,55,54)",
    "rgb(197,127,53)",
    "rgb(202,189,52)",
    "rgb(150,202,51)",
    "rgb(82,199,47)",
    "rgb(48,200,84)",
    "rgb(51,203,149)",
    "rgb(53,191,198)",
    "rgb(55,124,200)",
    "rgb(59,59,203)"
  ],
  /** continuous reversed */ [
    "rgb(59,59,203)",
    "rgb(55,124,200)",
    "rgb(53,191,198)",
    "rgb(51,203,149)",
    "rgb(48,200,84)",
    "rgb(82,199,47)",
    "rgb(150,202,51)",
    "rgb(202,189,52)",
    "rgb(197,127,53)",
    "rgb(200,55,54)"
  ],
  /** arcgis continuous */ [
    "rgb(40,146,199)",
    "rgb(94,163,184)",
    "rgb(134,181,168)",
    "rgb(168,199,149)",
    "rgb(202,219,132)",
    "rgb(233,240,110)",
    "rgb(252,234,91)",
    "rgb(252,193,73)",
    "rgb(250,154,57)",
    "rgb(247,114,42)",
    "rgb(240,76,31)",
    "rgb(232,16,20)"
  ],
  /** arcgis continuous 15/20 */ [
    "rgb(40,146,199)",
    "rgb(75,156,191)",
    "rgb(98,164,181)",
    "rgb(123,176,172)",
    "rgb(143,186,163)",
    "rgb(164,196,151)",
    "rgb(182,207,140)",
    "rgb(203,219,129)",
    "rgb(223,232,121)",
    "rgb(243,245,108)",
    "rgb(250,240,95)",
    "rgb(252,216,83)",
    "rgb(252,194,76)",
    "rgb(252,171,66)",
    "rgb(250,149,55)",
    "rgb(247,127,47)",
    "rgb(245,104,39)",
    "rgb(242,81,31)",
    "rgb(237,54,26)",
    "rgb(232,21,21)"
  ].slice(0, 15),
  /** arcgis continuous 20 */ [
    "rgb(40,146,199)",
    "rgb(75,156,191)",
    "rgb(98,164,181)",
    "rgb(123,176,172)",
    "rgb(143,186,163)",
    "rgb(164,196,151)",
    "rgb(182,207,140)",
    "rgb(203,219,129)",
    "rgb(223,232,121)",
    "rgb(243,245,108)",
    "rgb(250,240,95)",
    "rgb(252,216,83)",
    "rgb(252,194,76)",
    "rgb(252,171,66)",
    "rgb(250,149,55)",
    "rgb(247,127,47)",
    "rgb(245,104,39)",
    "rgb(242,81,31)",
    "rgb(237,54,26)",
    "rgb(232,21,21)"
  ],
  /** arcgis continuous 20 reversed */ [
    "rgb(40,146,199)",
    "rgb(75,156,191)",
    "rgb(98,164,181)",
    "rgb(123,176,172)",
    "rgb(143,186,163)",
    "rgb(164,196,151)",
    "rgb(182,207,140)",
    "rgb(203,219,129)",
    "rgb(223,232,121)",
    "rgb(243,245,108)",
    "rgb(250,240,95)",
    "rgb(252,216,83)",
    "rgb(252,194,76)",
    "rgb(252,171,66)",
    "rgb(250,149,55)",
    "rgb(247,127,47)",
    "rgb(245,104,39)",
    "rgb(242,81,31)",
    "rgb(237,54,26)",
    "rgb(232,21,21)"
  ].reverse()
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
              const colorMap = new ColorMap(colorLists[0], content);
              setState({
                ...state,
                time:   (new Date()).getTime(),
                datasets: state.datasets.concat({
                  name: _name,
                  data: content,
                  grouping: {},
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
