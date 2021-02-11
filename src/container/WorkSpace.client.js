/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 22:40:59 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-31 19:08:04
 */

import { createRef, Component } from 'react';
import { Root } from '../App.server';
import Map from '../UI/Map.client';


let lastOpen = undefined;

class WorkSpace extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      charts: [],
      idx:    0
    };
    this.map = createRef();

    Root.openChart = (datasetName, src) => {
      let idx = -1;
      for (let i = 0; i < this.state.charts.length; i++) {
        if (this.state.charts[i].dataset === datasetName && this.state.charts[i].src === src) {
          idx = i;
          break;
        }
      }
      if (idx === -1) {
        Root.paint(datasetName, src);
        return false;
      } else if (idx !== this.state.idx) {
        this.setState({ idx });
        return true;
      } else {
        return true;
      }
    };
  }

  setDatasets(datasets) {
    const charts = datasets.map(dataset => {
      return dataset.charts.map(chart => {
        let data = [];
        for (let i = 0; i < dataset.samples.length; i++) {
          if (dataset.samples[i].name === chart.src) {
            data = dataset.samples[i].data;
            break;
          }
        }
        return {
          dataset: dataset.name,
          name: chart.name,
          src: chart.src,
          data: data,
          colorize: dataset.colorize,
          layers: chart.layers.map(layer => {
            return {
              label: layer.label,
              active: layer.active,
              opacity: layer.opacity
            };
          })
        };
      });
    }).flat(1);
    
    let idx = 0;
    if (lastOpen) {
      for (let i = 0; i < charts.length; i++) {
        if (charts[i].dataset === lastOpen[0] && charts[i].src === lastOpen[1]) {
          idx = i;
          break;
        }
      }
    }

    this.setState({ charts, idx });
  }

  page(dataset, src) {
    let initIdx = NaN;
    const charts = this.state.charts;
    for (let i = 0; i < charts.length; i++) {
      if (charts[i].dataset === dataset && charts[i].src === src) {
        initIdx = i;
        break;
      }
    }
    if (!isNaN(initIdx)) {
      this.setState({
        idx:  initIdx
      });
    }
  }

  render() {
    const charts = this.state.charts;

    if (charts[this.state.idx]) {
      lastOpen = [charts[this.state.idx].dataset, charts[this.state.idx].src];
    }
    
    return (
      <section className="WorkSpace"
        style={{
          flex: 1,
          display:      "flex",
          flexDirection:    "column",
          alignItems:       "stretch",
          justifyContent:   "stretch",
          overflowX:    "hidden",
          userSelect:   "none"
        }} >
          <section key="header" className="bar"
            style={{
              background:   "rgb(236,229,244)"
            }}
            onMouseMove={
              e => {
                const bar = document.getElementsByClassName("WorkSpace")[0].children[0];
                if (bar.scrollWidth > bar.offsetWidth) {
                  const x = (e.clientX - bar.offsetLeft);
                  if (x < 150 || x / bar.offsetWidth < 0.2) {
                    bar.scrollTo(bar.scrollLeft - 2, 0);
                  } else if (x + 150 > bar.offsetWidth || x / bar.offsetWidth > 0.8) {
                    bar.scrollTo(bar.scrollLeft + 2, 0);
                  }
                }
              }
            } >
              <section>
                {
                  charts.map((chart, i) => {
                    return (
                      <label key={ i } tabIndex={ 1 }
                        style={{
                          padding:  "0.2rem 1rem",
                          fontSize: "90%",
                          fontWeight: "600",
                          borderLeft:   "1px solid rgb(98,99,196)",
                          borderRight:  "1px solid rgb(98,99,196)",
                          background: i === this.state.idx ? "rgb(246,242,250)" : "rgb(196,204,232)",
                          cursor:   "pointer"
                        }}
                        onClick={
                          () => {
                            if (i !== this.state.idx) {
                              this.setState({
                                idx: i
                              });
                            }
                          }
                        } >
                          { chart.dataset + "." + chart.name }
                      </label>
                    );
                  })
                }
              </section>
          </section>
          <section key="datasets"
            style={{
              flex:         1,
              display:      "flex",
              flexDirection:    "column",
              alignItems:       "stretch",
              justifyContent:   "flex-start",
              padding:      "2px 0"
            }} >
              <Map ref={ this.map } />
          </section>
      </section>
    );
  }

  componentDidUpdate() {
    if (this.map.current) {
      const chart = this.state.charts[this.state.idx];
      if (chart) {
        const name = chart.dataset + "." + chart.name;
        this.map.current.update(name, chart.data, chart.layers, chart.colorize);
      } else {
        this.map.current.update(null, [], [], ["#888888", "#888888", 1]);
      }
    }
  }

};

export default WorkSpace;