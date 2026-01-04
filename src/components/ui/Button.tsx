import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export function Button({
    children,
    className = '',
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center font-bold tracking-widest uppercase transition-all duration-300 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.96] cursor-pointer rounded-2xl";

    const variants = {
        primary: "bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:bg-orange-400 border border-orange-400/20 hover:scale-[1.02]",
        secondary: "bg-white/5 text-zinc-400 hover:text-white border border-white/10 hover:border-orange-500/30 hover:bg-orange-500/5 hover:scale-[1.02]",
        outline: "bg-transparent border border-white/10 text-zinc-500 hover:text-white hover:border-white/30 hover:bg-white/5",
        ghost: "bg-transparent text-zinc-500 hover:text-white hover:bg-white/5",
        danger: "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]",
        glass: "bg-zinc-950/40 backdrop-blur-md border border-white/5 text-zinc-400 hover:text-orange-500 hover:border-orange-500/30 hover:bg-zinc-900/60"
    };

    const sizes = {
        sm: "h-9 px-4 text-[10px]",
        md: "h-12 px-6 text-[11px]",
        lg: "h-14 px-8 text-xs",
        icon: "h-12 w-12 p-0"
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {!isLoading && icon && <span className="mr-2">{icon}</span>}
            {children}
        </button>
    );
}
