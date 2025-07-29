import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 24 }) => {
  return (
    <img 
      src="/LOGO.png" 
      alt="اصل مارکت" 
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
};

export default Logo; 