/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 17:17:27 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-17 20:24:27
 */

import React from "react";


const Button = props => {
  return (
    <label className="Button"
      onClick={ props.listener }
      onContextMenu={ e => e.preventDefault() || e.stopPropagation() }
      style={{ ...props.style }} >
        { props.children }
    </label>
  );
};

export default Button;
