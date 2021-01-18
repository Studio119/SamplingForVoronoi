/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import ActivityBar from './container/ActivityBar.client';


export const Root = {
  close:          () => {},
  closeSample:    () => {},
  paint:          () => {},
  refresh:        () => {},
  fileDialogOpen: () => {}
};

export default function App(props) {
  return (
    <ActivityBar datasets={ props.datasets } />
  );
}
