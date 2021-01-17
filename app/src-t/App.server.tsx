/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 15:28:15 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-17 17:42:24
 */

import React, { useState } from 'react';
import ActivityBar from './container/ActivityBar.client';
import { Dataset } from './types';


export interface AppState {
  datasets: Dataset[];
};

export const Root = {
  setRootState: (_state: Partial<AppState>) => {}
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    datasets: []
  });

  Root.setRootState = _state => {
    setState({
      ...state,
      ..._state
    });
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
        <ActivityBar datasets={ state.datasets } />
    </div>
  );
};

export default App;
