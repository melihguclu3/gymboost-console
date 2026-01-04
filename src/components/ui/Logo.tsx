import React from 'react';

interface LogoProps {
    id?: string; // Her logo için benzersiz bir ID (Hydration ve Duplicate ID hatalarını önlemek için)
    className?: string;
    showText?: boolean;
    customLogo?: string | null;
}

export function Logo({ id = "main", className = "h-8", showText = true, customLogo }: LogoProps) {
    // Statik ve benzersiz ID'ler oluştur
    const brandGradientId = `gb-brand-gradient-${id}`;
    const textGradientId = `gb-text-gradient-${id}`;
    const glowId = `gb-glow-${id}`;

    if (customLogo) {
        return (
            <img
                src={customLogo}
                alt="Logo"
                className={`${className} w-auto object-contain select-none`}
            />
        );
    }

    const viewBox = showText ? "0 0 160 32" : "0 0 32 32";

    return (
        <div className={`flex items-center select-none ${className}`} style={{ width: 'fit-content' }}>
            <svg
                viewBox={viewBox}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-auto block"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <linearGradient id={brandGradientId} x1="4" y1="2.66666" x2="28" y2="29.3333" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F97316" />
                        <stop offset="1" stopColor="#EA580C" />
                    </linearGradient>

                    <linearGradient id={textGradientId} x1="38" y1="0" x2="140" y2="0" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#FFFFFF" />
                        <stop offset="1" stopColor="#F4F4F5" />
                    </linearGradient>

                    <filter id={glowId} x="-4" y="-4" width="40" height="40" filterUnits="userSpaceOnUse">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                <path
                    d="M18.6667 2.66666L4 17.3333H14.6667L13.3333 29.3333L28 14.6667H17.3333L18.6667 2.66666Z"
                    fill={`url(#${brandGradientId})`}
                    filter={`url(#${glowId})`}
                />

                {showText && (
                    <text
                        x="38"
                        y="22"
                        fill={`url(#${textGradientId})`}
                        style={{
                            fontFamily: 'system-ui, sans-serif',
                            fontWeight: '900',
                            fontSize: '22px',
                            letterSpacing: '-0.04em',
                        }}
                    >
                        GymBoost
                    </text>
                )}
            </svg>
        </div>
    );
}
