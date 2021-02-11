/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 17:17:27 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-26 16:22:32
 */

import React from "react";


const Button = props => {
  return (
    <label className="Button" tabIndex={ 1 }
      onClick={ props.listener }
      onContextMenu={ e => e.preventDefault() || e.stopPropagation() }
      style={{ userSelect: "none", ...props.style }} >
        { props.children }
    </label>
  );
};

export default Button;
