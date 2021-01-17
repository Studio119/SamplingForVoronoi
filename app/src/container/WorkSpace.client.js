/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 22:40:59 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-18 02:45:40
 */

import { createRef, useState, useEffect } from 'react';
import { Root } from '../App.server';
import ContextMenu from './ContextMenu.client';
import Map from '../UI/Map.client';


let lastOpen = undefined;

const WorkSpace = props => {
  const charts = props.datasets.map(dataset => {
    return dataset.charts.map(chart => {
      return {
        dataset: dataset.name,
        src: chart.src,
        colorize: chart.colorize,
        layers: chart.layers.map(layer => {
          return {
            label: layer.label,
            active: layer.active
          };
        })
      };
    });
  }).flat(1);
  
  const menu = createRef();
  let initIdx = 0;
  if (lastOpen) {
    for (let i = 0; i < charts.length; i++) {
      if (charts[i].dataset === lastOpen[0] && charts[i].src === lastOpen[1]) {
        initIdx = i;
        break;
      }
    }
  }
  
  const [state, setState] = useState({
    idx: initIdx
  });
  const tabs = charts.map((chart, n) => {
    let data = [];
    for (let i = 0; i < props.datasets.length; i++) {
      if (props.datasets[i].name === chart.dataset) {
        for (let j = 0; j < props.datasets[i].samples.length; j++) {
          if (props.datasets[i].samples[j].name === chart.src) {
            data = props.datasets[i].samples[j].data;
            break;
          }
        }
        break;
      }
    }
    return (
      <Map key={ n } index={ n }
        data={ data } layers={ chart.layers }
        colorize={ chart.colorize } />
    );
  });

  useEffect(() => {
    if (charts[state.idx]) {
      lastOpen = [charts[state.idx].dataset, charts[state.idx].src];
    }
  });
  
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
                  <label key={ i }
                    style={{
                      padding:  "0.2rem 1rem",
                      fontSize: "90%",
                      fontWeight: "600",
                      borderLeft:   "1px solid rgb(98,99,196)",
                      borderRight:  "1px solid rgb(98,99,196)",
                      background: i === state.idx ? "rgb(246,242,250)" : "rgb(196,204,232)",
                      cursor:   "pointer"
                    }}
                    onClick={
                      () => {
                        if (i !== state.idx) {
                          setState({
                            idx: i
                          });
                        }
                      }
                    } >
                      { chart.dataset + "." + chart.src }
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
            { tabs[state.idx] || null }
            <ContextMenu menu={ menu } >
            </ContextMenu>
        </section>
    </section>
  );
};

export default WorkSpace;
