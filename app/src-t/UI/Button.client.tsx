/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 17:17:27 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-17 17:23:08
 */

import React from "react";


export interface ButtonProps {
  listener: (event: React.MouseEvent<HTMLLabelElement, MouseEvent>) => void;
  style?:   React.CSSProperties;
};

const Button: React.FC<ButtonProps> = props => {
  return (
    <label className="Button"
      onClick={ props.listener }
      style={{ ...props.style }} >
        { props.children }
    </label>
  );
};

export default Button;
