// components/ui/button.tsx
import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/app/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  asChild?: boolean;
}

export function Button({
  className,
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  asChild = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost: "text-indigo-600 hover:bg-indigo-50"
  };
  
  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3"
  };
  
  const isDisabled = disabled || isLoading;
  
  const buttonContent = (
    <>
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </>
  );

  if (asChild) {
    return (
      <Slot
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          isDisabled && "opacity-70 cursor-not-allowed",
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        isDisabled && "opacity-70 cursor-not-allowed",
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {buttonContent}
    </button>
  );
}