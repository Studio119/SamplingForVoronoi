/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import ActivityBar from './container/ActivityBar.client';
import WorkSpace from './container/WorkSpace.client';

export const Root = {
  refresh:        () => {},
  fileDialogOpen: () => {}
};

export default function App(props) {
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
        <ActivityBar datasets={ props.datasets } />
        <WorkSpace datasets={ props.datasets } />
    </div>
  );
}
