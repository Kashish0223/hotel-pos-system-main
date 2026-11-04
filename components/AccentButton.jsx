import React from 'react';

const AccentButton = ({
  onClick = () => { },
  title = 'Click Me',
  className = '',
  color = 'purple',
  type = 'button',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
  inline-flex items-center justify-center
  px-4 py-2
  rounded
  bg-gradient-to-r from-orange-500 to-orange-500
  text-white text-xs font-semibold
  hover:from-orange-600 hover:to-orange-600
  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
  shadow-md hover:shadow-lg active:scale-95
  ${className}
`}
    >
      {title}
    </button>
  );
};

export default AccentButton;
