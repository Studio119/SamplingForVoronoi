/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 15:28:10 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-20 14:11:53
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
        </section>
    </section>
  );
};

export default ActivityBar;
