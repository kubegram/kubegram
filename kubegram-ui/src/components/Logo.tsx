import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <img
        src="/logo.png"
        alt="Kubegram Logo"
        className={`${sizeClasses[size]} w-auto flex-shrink-0`}
      />
    </div>
  );
};

export default Logo;
