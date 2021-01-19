/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 22:40:59 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-19 15:26:03
 */

import { createRef, Component } from 'react';
// import { Root } from '../App.server';
import ContextMenu from './ContextMenu.client';
import Map from '../UI/Map.client';


let lastOpen = undefined;

class WorkSpace extends Component {
  
  constructor(props) {
    super(props);
    this.state = {
      charts: [],
      idx:    0
    };
    this.menu = createRef();
    this.map = createRef();
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
          <section key="header"
            style={{
              background:   "rgb(236,229,244)",
              display:      "flex",
              alignItems:       "center",
              justifyContent:   "flex-start"
            }}>
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
          <section key="datasets"
            style={{
              flex:         1,
              display:      "flex",
              flexDirection:    "column",
              alignItems:       "stretch",
              justifyContent:   "flex-start",
              padding:      "6px 0"
            }}
            onContextMenu={
              e => {
                if (menu.current) {
                  const x = e.clientX;
                  const y = e.clientY;
                  menu.current.style.display = "flex";
                  menu.current.style.left = x + "px";
                  menu.current.style.top = y + "px";
                  const close = document.addEventListener('click', ev => {
                    if (!menu.current) {
                      document.removeEventListener('click', close);
                      return;
                    }
                    const dx = ev.clientX - x;
                    const dy = ev.clientY - y;
                    if (dx < -2 || dx > menu.current.offsetWidth + 2) {
                      menu.current.style.display = "none";
                      document.removeEventListener('click', close);
                    } else if (dy < -2 || dy > menu.current.offsetHeight + 2) {
                      menu.current.style.display = "none";
                      document.removeEventListener('click', close);
                    }
                  });
                }
              }
            } >
              <Map ref={ this.map } />
              <ContextMenu menu={ this.menu } >
              </ContextMenu>
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
        this.map.current.update(null, [], [], () => "#888888");
      }
    }
  }

};

export default WorkSpace;
