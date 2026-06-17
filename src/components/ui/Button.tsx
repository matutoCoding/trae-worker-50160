import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-primary-700 text-white shadow-card hover:bg-primary-600 hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-0 focus:ring-primary-500',
    secondary:
      'bg-white text-primary-700 border border-primary-200 shadow-card hover:bg-primary-50 hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-0 focus:ring-primary-500',
    danger:
      'bg-rose-600 text-white shadow-card hover:bg-rose-500 hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-0 focus:ring-rose-500',
    success:
      'bg-emerald-600 text-white shadow-card hover:bg-emerald-500 hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-0 focus:ring-emerald-500',
    ghost:
      'text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {!loading && leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
