"use client";

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PrayerTimes {
    date: string;
    times: {
        imsak: string;
        gunes: string;
        ogle: string;
        ikindi: string;
        aksam: string;
        yatsi: string;
    };
}

interface TimesGridProps {
    data: PrayerTimes | null;
    loading: boolean;
    onPrevDay?: () => void;
    onNextDay?: () => void;
    isToday?: boolean;
}

export function TimesGrid({ data, loading, onPrevDay, onNextDay, isToday }: TimesGridProps) {
    if (loading) {
        return (
            <div className="w-full space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--theme-border)] animate-pulse" />
                    <div className="space-y-2 flex flex-col items-center">
                        <div className="w-12 h-2 bg-[var(--theme-border)] animate-pulse rounded" />
                        <div className="w-24 h-3 bg-[var(--theme-border)] animate-pulse rounded" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[var(--theme-border)] animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-3 w-full animate-pulse">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-16 bg-[var(--theme-border)] rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data) return null;

    const items = [
        { label: 'İmsak', value: data.times.imsak },
        { label: 'Güneş', value: data.times.gunes },
        { label: 'Öğle', value: data.times.ogle },
        { label: 'İkindi', value: data.times.ikindi },
        { label: 'Akşam', value: data.times.aksam },
        { label: 'Yatsı', value: data.times.yatsi },
    ];

    return (
        <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between px-2">
                <button
                    onClick={onPrevDay}
                    className="p-2 rounded-full border border-[var(--theme-border)] hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] transition-all active:scale-90"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-center">
                    <p className="text-[10px] font-bold text-[var(--theme-accent)] uppercase tracking-widest">
                        {isToday ? 'BUGÜN' : 'VAKİTLER'}
                    </p>
                    <p className="text-xs font-bold text-[var(--theme-text)]">{data.date}</p>
                </div>

                <button
                    onClick={onNextDay}
                    className="p-2 rounded-full border border-[var(--theme-border)] hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] transition-all active:scale-90"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] hover:border-[var(--theme-accent)] transition-all duration-200 cursor-default group"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-text2)] mb-1 group-hover:text-[var(--theme-accent)] transition-colors">
                            {item.label}
                        </span>
                        <span className="text-xl font-bold tracking-tight text-[var(--theme-text)]">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
