/*
 * @Author: Kanata You 
 * @Date: 2021-01-20 18:22:23 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-03-05 18:47:46
 */

import ActivityBar from './container/ActivityBar.client';


export const Root = {
  close:          () => {},
  closeSample:    () => {},
  exportSample:   () => {},
  closeChart:     () => {},
  sample:         () => {},
  settings:       () => {},
  paint:          () => {},
  pushSample:     () => {},
  refresh:        () => {},
  fileDialogOpen: () => {},
  getPopulation:  () => {},
  getDataset:     () => {},
  openChart:      () => {},
  pickBorders:    () => {},
  colorizeChanged:false,
  storeBorders:   true
};

export default function App(props) {
  return (
    <ActivityBar datasets={ props.datasets } />
  );
}
