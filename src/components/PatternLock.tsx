'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PatternLockProps {
    onComplete: (pattern: number[]) => void;
    error?: boolean;
    disabled?: boolean;
}

export function PatternLock({ onComplete, error, disabled }: PatternLockProps) {
    const [path, setPath] = useState<number[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const GRID_SIZE = 4;
    const DOTS = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setPath([]), 500);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const getTouchPoint = (e: React.PointerEvent | PointerEvent) => {
        if (!containerRef.current) return null;
        const rect = containerRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const getDotIndex = (x: number, y: number) => {
        if (!containerRef.current) return -1;
        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const cellWidth = width / GRID_SIZE;

        const sensitivity = cellWidth * 0.4;

        for (let i = 0; i < DOTS.length; i++) {
            const col = i % GRID_SIZE;
            const row = Math.floor(i / GRID_SIZE);
            const dotX = col * cellWidth + cellWidth / 2;
            const dotY = row * cellWidth + cellWidth / 2;

            const dist = Math.sqrt(Math.pow(x - dotX, 2) + Math.pow(y - dotY, 2));
            if (dist < sensitivity) return i;
        }
        return -1;
    };

    const handleStart = (e: React.PointerEvent) => {
        if (disabled) return;
        setIsDragging(true);
        const point = getTouchPoint(e);
        if (point) {
            setCursorPos(point);
            const dotIndex = getDotIndex(point.x, point.y);
            if (dotIndex !== -1) {
                setPath([dotIndex]);
                if (navigator.vibrate) navigator.vibrate(10);
            }
        }
    };

    const handleMove = (e: React.PointerEvent) => {
        if (!isDragging || disabled) return;
        e.preventDefault();
        const point = getTouchPoint(e);
        if (point) {
            setCursorPos(point);
            const dotIndex = getDotIndex(point.x, point.y);

            if (dotIndex !== -1 && !path.includes(dotIndex)) {
                setPath(prev => [...prev, dotIndex]);
                if (navigator.vibrate) navigator.vibrate(15);
            }
        }
    };

    const handleEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (path.length > 0) {
            onComplete(path);
        } else {
            setPath([]);
        }
    };

    const getDotCoords = (index: number) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const width = containerRef.current.offsetWidth;
        const cellWidth = width / GRID_SIZE;
        const col = index % GRID_SIZE;
        const row = Math.floor(index / GRID_SIZE);
        return {
            x: col * cellWidth + cellWidth / 2,
            y: row * cellWidth + cellWidth / 2
        };
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "w-full aspect-square max-w-[320px] relative touch-none select-none rounded-2xl border-2 transition-colors",
                "bg-zinc-800",
                error
                    ? "border-red-600"
                    : "border-zinc-700"
            )}
            onPointerDown={handleStart}
            onPointerMove={handleMove}
            onPointerUp={handleEnd}
            onPointerLeave={handleEnd}
        >
            {/* SVG Lines Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {path.map((dotIndex, i) => {
                    if (i === path.length - 1) return null;
                    const start = getDotCoords(dotIndex);
                    const end = getDotCoords(path[i + 1]);
                    return (
                        <line
                            key={`line-${i}`}
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke={error ? "#dc2626" : "#9333ea"}
                            strokeWidth="4"
                            strokeLinecap="round"
                        />
                    );
                })}
                {isDragging && path.length > 0 && (
                    <line
                        x1={getDotCoords(path[path.length - 1]).x}
                        y1={getDotCoords(path[path.length - 1]).y}
                        x2={cursorPos.x}
                        y2={cursorPos.y}
                        stroke={error ? "#dc2626" : "#9333ea"}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="4 4"
                        className="opacity-50"
                    />
                )}
            </svg>

            {/* Dots Layer */}
            <div className="grid grid-cols-4 h-full w-full p-6 gap-4 z-20 relative">
                {DOTS.map((i) => {
                    const isActive = path.includes(i);

                    return (
                        <div key={i} className="flex items-center justify-center relative">
                            {/* Outer Ring (Only active) */}
                            {isActive && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={cn(
                                        "absolute w-10 h-10 rounded-full border-[3px]",
                                        error
                                            ? "border-red-600"
                                            : "border-purple-600"
                                    )}
                                />
                            )}

                            {/* The Dot */}
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isActive ? 1.4 : 1,
                                }}
                                className={cn(
                                    "w-4 h-4 rounded-full transition-colors duration-200 z-10",
                                    isActive
                                        ? error
                                            ? "bg-red-600"
                                            : "bg-purple-600"
                                        : "bg-zinc-600"
                                )}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}