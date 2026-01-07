'use client';

import { ButtonHTMLAttributes } from 'react';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export default function AnimatedButton({ 
  children, 
  variant = 'primary',
  className = '',
  ...props 
}: AnimatedButtonProps) {
  const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95';
  const variantClasses = variant === 'primary'
    ? 'bg-primary text-secondary hover:bg-gray-900'
    : 'bg-secondary text-primary border-2 border-primary hover:bg-gray-100';
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
