import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  textColor?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 24, textColor = "text-orange-500" }) => {
  return (
    <div 
      className={`flex items-center justify-center font-bold ${textColor} ${className}`}
      style={{ fontSize: size * 0.6, width: size, height: size }}
    >
      AM
    </div>
  );
};

export default Logo; 