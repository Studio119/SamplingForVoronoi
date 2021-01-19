/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 15:28:10 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-19 17:21:17
 */

import { createRef } from 'react';
import Button from '../UI/Button.client';
import { Root } from '../App.server';
import DatasetItem from './DatasetItem.client';
import ContextMenu, { ContextMenuItem } from './ContextMenu.client';


const ActivityBar = props => {
  const menu = createRef();
  
  return (
    <section className="ActivityBar"
      style={{
        width:        "240px",
        height:       "100vh",
        padding:      "8px 10px",
        overflow:     "hidden",
        background:   "rgb(232,235,248)",
        userSelect:   "none"
      }} >
        <section key="datasets"
          style={{
            flex:             1,
            display:          "flex",
            flexDirection:    "column",
            alignItems:       "stretch",
            justifyContent:   "flex-start",
            padding:          "0 0 8px",
            minHeight:        "40vh",
            maxHeight:        "calc(100vh - 24px)",
            overflow:         "hidden auto",
            background:       "rgba(255,255,255,0.7)"
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
            <label key="title"
              style={{
                padding:      "3px 1.2rem",
                marginBottom: "4px",
                background:   "rgb(186,227,255)"
              }} >
                DATASETS
            </label>
            {
              props.datasets.length ? (
                props.datasets.map(dataset => {
                  return (
                    <DatasetItem { ...dataset } key={ dataset.name } />
                  );
                })
              ) : (
                <Button
                  listener={ Root.fileDialogOpen }
                  style={{
                    margin: "6px 0.8rem"
                  }} >
                    Import dataset
                </Button>
              )
            }
            <ContextMenu menu={ menu } >
              <ContextMenuItem
                listener={ Root.fileDialogOpen } >
                  Import
              </ContextMenuItem>
            </ContextMenu>
        </section>
    </section>
  );
};

export default ActivityBar;
