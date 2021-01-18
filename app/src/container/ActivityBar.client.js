/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 15:28:10 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-18 17:36:41
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
        height:       "calc(100vh - 16px)",
        padding:      "8px 10px",
        overflow:     "hidden auto",
        background:   "rgb(232,235,248)",
        userSelect:   "none"
      }} >
        <section key="datasets"
          style={{
            flex:         1,
            display:      "flex",
            flexDirection:    "column",
            alignItems:       "stretch",
            justifyContent:   "flex-start",
            padding:      "8px 0"
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
            {
              props.datasets.length ? (
                props.datasets.map(dataset => {
                  return (
                    <DatasetItem { ...dataset } key={ dataset.name } />
                  );
                })
              ) : (
                <Button
                  listener={ Root.fileDialogOpen } >
                    Import dataset
                </Button>
              )
            }
            <ContextMenu menu={ menu } >
              <ContextMenuItem
                listener={ Root.fileDialogOpen } >
                  New dataset
              </ContextMenuItem>
            </ContextMenu>
        </section>
    </section>
  );
};

export default ActivityBar;
