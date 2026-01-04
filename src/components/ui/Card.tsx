import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    variant?: string;
    hover?: boolean;
}

export function Card({ children, className = '', padding = 'md', variant, hover, ...props }: CardProps) {
    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    const hoverStyles = hover 
        ? 'hover:border-orange-500/50 hover:bg-zinc-900/60 transition-all duration-300 cursor-pointer' 
        : '';

    return (
        <div className={`bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-2xl shadow-xl ${paddings[padding]} ${hoverStyles} ${className}`} {...props}>
            {children}
        </div>
    );
}