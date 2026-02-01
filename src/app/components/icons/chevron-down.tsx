import React from "react";

interface ChevronDownProps {
  style?: React.CSSProperties;
}

const ChevronDown = ({ style }: ChevronDownProps) => {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={style}
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="#595959"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default ChevronDown;
