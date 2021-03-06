/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 20:08:02 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-29 22:23:50
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';


export let callContextMenu = (_e, _children) => {};
let closeContextMenu = () => {};


const ContextMenu = () => {
  const [state, setState] = useState({
    open:     false,
    x:        0,
    y:        0,
    children: null
  });

  callContextMenu = (e, children) => {
    e.preventDefault();
    e.stopPropagation();
    setState({
      open:     true,
      x:        e.clientX,
      y:        e.clientY,
      children: children.map((d, i) => {
        return (
          <ContextMenuItem key={ i } action={ d.action } text={ d.text } />
        );
      })
    });
  };

  closeContextMenu = () => {
    if (state.open) {
      setState({
        ...state,
        open:     false,
        children: null
      });
    }
  };

  document.body.addEventListener("click", closeContextMenu);
  document.body.addEventListener("keypress", closeContextMenu);
  document.body.addEventListener("contextmenu", closeContextMenu);

  return createPortal(
    <div className="contextMenu"
      style={{
        display: state.open ? "flex" : "none",
        left:     state.x,
        top:      state.y
      }} >
        {
          state.open && state.children
        }
    </div>,
    document.body
  );
};

export const ContextMenuItem = props => {
  return props.action ? (
    <label
      onClick={
        () => {
          props.action();
          closeContextMenu();
        }
      } >
        { props.text }
    </label>
  ) : (
    <label
      style={{
        cursor:         "default",
        pointerEvents:  "none",
        margin:         "0 0.4rem 4px",
        borderBottom:   "2px solid #8888",
        padding:        "0.1rem 0.2rem 4px",
        fontWeight:     600
      }} >
        { props.text }
    </label>
  );
};

export default ContextMenu;
