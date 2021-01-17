/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 20:08:02 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-17 20:31:19
 */

import { Component } from 'react';
import { createPortal } from 'react-dom';


class ContextMenu extends Component {
  render() {
    const contextMenu = createPortal(
      <div ref={ this.props.menu } className="contextMenu" >
          { this.props.children }
      </div>,
      document.body
    );
  
    return contextMenu;
  }
};

export const ContextMenuItem = props => {
  return (
    <label
      onClick={ props.listener } >
        { props.children }
    </label>
  );
};

export default ContextMenu;
