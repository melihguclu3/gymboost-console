import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
    variant?: string;
}

export function Card({ children, className = '', padding = 'md', hover, variant, ...props }: CardProps) {
    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    return (
        <div 
            className={cn(
                "bg-zinc-950/40 backdrop-blur-md border border-white/5 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.5)] transition-all duration-300",
                paddings[padding],
                hover && "hover:border-orange-500/20 hover:bg-zinc-900/40 hover:shadow-[0_10px_40px_-10px_rgba(249,115,22,0.1)] cursor-pointer",
                className
            )} 
            {...props}
        >
            {children}
        </div>
    );
}
