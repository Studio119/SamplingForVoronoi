/*
 * @Author: Kanata You 
 * @Date: 2021-01-20 18:22:23 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-29 21:58:03
 */

import ActivityBar from './container/ActivityBar.client';


export const Root = {
  close:          () => {},
  closeSample:    () => {},
  exportSample:   () => {},
  closeChart:     () => {},
  sample:         () => {},
  paint:          () => {},
  pushSample:     () => {},
  refresh:        () => {},
  fileDialogOpen: () => {},
  getPopulation:  () => {},
  getDataset:     () => {},
  openChart:      () => {},
  colorizeChanged:false
};

export default function App(props) {
  return (
    <ActivityBar datasets={ props.datasets } />
  );
}
