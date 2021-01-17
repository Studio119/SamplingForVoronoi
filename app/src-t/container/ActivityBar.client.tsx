/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 15:28:10 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-17 17:24:49
 */

import React from "react";
import { Dataset } from "../types";
import Button from "../UI/Button.client";


export interface ActivityBarProps {
  datasets: Dataset[];
};

const ActivityBar: React.FC<ActivityBarProps> = props => {
  return (
    <section className="ActivityBar"
      style={{
        width:        "240px",
        padding:      "8px 16px",
        overflowX:    "hidden",
        background:   "rgb(232,245,248)"
      }} >
      {
        props.datasets.length ? null : (
          <Button
            listener={
              () => {}
            } >
              Import dataset
          </Button>
        )
      }
    </section>
  );
};

export default ActivityBar;
