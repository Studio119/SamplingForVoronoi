/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 15:28:10 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-02-18 19:13:39
 */

import Button from '../UI/Button.client';
import { Root } from '../App.server';
import DatasetItem from './DatasetItem.client';
import { callContextMenu } from './ContextMenu.client';


const ActivityBar = props => {
  return (
    <section className="ActivityBar"
      style={{
        width:        "240px",
        height:       "100vh",
        padding:      "8px 10px",
        overflow:     "hidden",
        background:   "rgb(232,235,248)",
        userSelect:   "none",
        display:      "flex",
        flexDirection:"column",
        alignItems:   "stretch",
        justifyContent: "space-between",
      }} >
        <section key="datasets"
          style={{
            display:          "flex",
            flexDirection:    "column",
            alignItems:       "stretch",
            justifyContent:   "flex-start",
            minHeight:        "40vh",
            maxHeight:        "calc(89vh - 28px)",
            background:       "rgba(255,255,255,0.7)"
          }}
          onContextMenu={
            e => {
              callContextMenu(
                e, [{
                  action: Root.fileDialogOpen,
                  text:   "Import"
                }]
              );
            }
          } >
            <label key="title"
              style={{
                padding:      "3px 1.2rem",
                background:   "rgb(186,227,255)"
              }} >
                DATASETS
            </label>
            <section key="datasets"
              style={{
                display:          "flex",
                flexDirection:    "column",
                alignItems:       "stretch",
                justifyContent:   "flex-start",
                padding:          "2px 0 4px",
                overflow:         "hidden scroll"
              }} >
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
            </section>
        </section>
        <section key="settings"
          style={{
            display:          "flex",
            flexDirection:    "column",
            alignItems:       "stretch",
            justifyContent:   "flex-start",
            marginTop:        "12px",
            padding:          "0 0 8px",
            height:           "11vh",
            overflow:         "hidden"
          }} >
            <Button key="settings"
              listener={ Root.settings }
              style={{
                margin: "6px 0.8rem"
              }} >
                SETTINGS
            </Button>
            <Button key="readme"
              listener={ () => {
                const a = document.createElement("a");
                a.href = "https://github.com/Studio119/SamplingForVoronoi#readme";
                a.target = "_blank";
                document.body.appendChild(a);
                a.click();
                a.remove();
              } }
              style={{
                margin: "6px 0.8rem"
              }} >
                README
            </Button>
        </section>
    </section>
  );
};

export default ActivityBar;
