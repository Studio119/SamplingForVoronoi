/*
 * @Author: Kanata You 
 * @Date: 2021-01-17 21:06:21 
 * @Last Modified by: Kanata You
 * @Last Modified time: 2021-01-17 21:12:39
 */

const ExpandSign = props => {
  return (
    <svg className="expand" width="0.8rem" height="0.8rem" viewBox="0 0 10 10" >
      <path
        d="M2,3.2 L5,6.5 L8,3.2"
        style={{
          transform: props.expanded ? "rotate(0deg)" : "rotate(-90deg)"
        }} />
    </svg>
  );
};

export default ExpandSign;
