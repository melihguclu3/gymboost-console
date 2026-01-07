'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Gym {
    id: string;
    name: string;
    settings?: {
        is_activated?: boolean;
        status?: string;
    };
}

interface GymSelectorProps {
    value: string | null;
    onChange: (gymId: string | null) => void;
    showAllOption?: boolean;
    allLabel?: string;
    className?: string;
}

export function GymSelector({
    value,
    onChange,
    showAllOption = true,
    allLabel = 'Tüm Salonlar',
    className
}: GymSelectorProps) {
    const [gyms, setGyms] = useState<Gym[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const loadGyms = useCallback(async () => {
        const { data } = await supabase
            .from('gyms')
            .select('id, name, settings')
            .order('name');

        if (data) {
            // Filter out archived gyms only
            const activeGyms = data.filter(
                (g) => g.settings?.status !== 'archived'
            );
            setGyms(activeGyms);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        loadGyms();
    }, [loadGyms]);

    const selectedGym = gyms.find((g) => g.id === value);
    const displayName = value ? selectedGym?.name || 'Salon Seç' : allLabel;

    if (loading) {
        return (
            <div className={cn("h-10 w-48 bg-zinc-800 rounded-lg animate-pulse", className)} />
        );
    }

    return (
        <div className={cn("relative", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 h-10 px-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-100 transition-colors min-w-[180px]"
            >
                <Building2 className="w-4 h-4 text-zinc-400" />
                <span className="flex-1 text-left truncate">{displayName}</span>
                <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 w-full min-w-[220px] max-h-64 overflow-y-auto bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50">
                        {showAllOption && (
                            <button
                                onClick={() => {
                                    onChange(null);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-zinc-700 transition-colors",
                                    !value ? "text-blue-400 bg-blue-600/10" : "text-zinc-300"
                                )}
                            >
                                <Building2 className="w-4 h-4" />
                                <span className="flex-1">{allLabel}</span>
                                {!value && <Check className="w-4 h-4" />}
                            </button>
                        )}
                        {gyms.map((gym) => (
                            <button
                                key={gym.id}
                                onClick={() => {
                                    onChange(gym.id);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-zinc-700 transition-colors",
                                    value === gym.id ? "text-blue-400 bg-blue-600/10" : "text-zinc-300"
                                )}
                            >
                                <div className="w-4 h-4 flex items-center justify-center">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        gym.settings?.is_activated ? "bg-green-500" : "bg-orange-500"
                                    )} />
                                </div>
                                <span className="flex-1 truncate">{gym.name}</span>
                                {value === gym.id && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
