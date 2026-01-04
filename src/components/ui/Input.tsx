import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    icon,
    rightIcon,
    className = '',
    ...props
}, ref) => {
    return (
        <div className="w-full space-y-2">
            {label && (
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    className={`
                        w-full bg-zinc-950/50 border border-zinc-800 
                        text-white placeholder:text-zinc-600 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50
                        transition-all duration-200
                        ${icon ? 'pl-10' : 'pl-4'} ${rightIcon ? 'pr-10' : 'pr-4'} py-3
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${error ? 'border-red-500 focus:ring-red-500/50' : ''}
                        ${className}
                    `}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-orange-500 transition-colors cursor-pointer">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && (
                <p className="text-sm text-red-500 mt-1 ml-1">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';