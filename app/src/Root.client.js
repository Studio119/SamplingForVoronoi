/*
 * @Author: Kanata You 
 * @Date: 2021-01-20 18:22:31 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-02-02 17:48:41
 */

import { useState, createRef, useEffect } from 'react';
import App, { Root } from "./App.server";
import { createPortal } from 'react-dom';
import WorkSpace from './container/WorkSpace.client';
import SampleDialog from './UI/SampleDialog.server';
import ContextMenu from './container/ContextMenu.client';
import Settings from './UI/Settings.server';


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

const getSuggestedExp = data => {
  let [min, max, sum] = [Infinity, -Infinity, 0];
  data.forEach(d => {
    [min, max, sum] = [Math.min(min, d.value), Math.max(max, d.value), sum + d.value];
  });
  const rMean = (sum / data.length - min) / (max - min);
  return parseFloat((Math.log(0.5) / Math.log(rMean)).toFixed(1));
};

const createChart = (src, rename=undefined) => {
  let layers = [{
    label:  "scatters",
    active: true,
    opacity: 1
  }, {
    label:  "polygons",
    active: false,
    opacity: 1
  }];

  if (src.toLowerCase().includes("bns")) {
    layers.push({
      label:  "disks",
      active: false,
      opacity: 0.7
    });
  }

  layers.push({
    label:  "interpolation",
    active: false,
    opacity: 1
  });

  return {
    name: rename || src,
    src:  src,
    layers
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

  const sampleDialog = createRef();
  const settings = createRef();

  const fileDialogRef = createRef();

  const fileDialog = createPortal(
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
            fr.onload = function(_) {
              const content = loadJSON(this.result);
              const exp = getSuggestedExp(content);
              setState({
                ...state,
                time:   (new Date()).getTime(),
                datasets: state.datasets.concat({
                  name: name.split("\\").reverse()[0].replace(/\.json/, ""),
                  data: content,
                  exp:  exp,
                  colorize: ["rgb(38,178,27)", "rgb(255,0,0)", exp],
                  samples:  [{
                    name: "total",
                    data: content
                  }],
                  charts:   [
                    createChart("total")
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
        return dataset.name === datasetName ? {
          ...dataset,
          samples: dataset.samples.concat({ name, data }),
          charts: dataset.charts.concat(createChart(name))
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
