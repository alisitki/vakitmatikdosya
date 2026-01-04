import { useState, useRef, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Country } from '@/lib/diyanet';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface LocationSelectProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
    options: Country[];
    isLoading: boolean;
    placeholder: string;
}

export function LocationSelect({
    label,
    value,
    onChange,
    options,
    isLoading,
    placeholder
}: LocationSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search
    const filteredOptions = useMemo(() => {
        if (!search) return options;
        const lowerSearch = search.toLocaleLowerCase('tr-TR');
        return options.filter(opt =>
            opt.name.toLocaleLowerCase('tr-TR').includes(lowerSearch)
        );
    }, [options, search]);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="space-y-2" ref={containerRef}>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                {label}
            </label>
            <div className="group relative">
                <div className={cn(
                    "absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-20 transition duration-1000",
                    isOpen ? "opacity-60" : "group-hover:opacity-40"
                )}></div>

                <div
                    className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl transition-all duration-300"
                >
                    {/* Trigger Button */}
                    <button
                        type="button"
                        onClick={() => {
                            if (!isLoading && options.length > 0) {
                                setIsOpen(!isOpen);
                                // Focus search input after opening? handled via autoFocus on input
                            }
                        }}
                        disabled={isLoading || options.length === 0}
                        className="w-full text-left p-3 pr-10 flex items-center min-h-[56px] focus:outline-none"
                    >
                        {isLoading ? (
                            <div className="flex items-center space-x-1.5 ml-1">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        ) : (
                            <span className={cn(
                                "text-base font-medium truncate",
                                selectedOption ? "text-slate-100" : "text-slate-500"
                            )}>
                                {selectedOption ? selectedOption.name : placeholder}
                            </span>
                        )}

                        {!isLoading && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <svg
                                    className={cn(
                                        "w-4 h-4 text-slate-600 transition-transform duration-300",
                                        isOpen && "rotate-180 text-emerald-400"
                                    )}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                            {/* Search Input */}
                            <div className="p-2 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
                                <div className="relative">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Ara..."
                                        className="w-full bg-slate-800/50 text-slate-200 text-sm rounded-lg pl-8 pr-3 py-2 border border-slate-700/50 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none placeholder:text-slate-600"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Options List */}
                            <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                {filteredOptions.length > 0 ? (
                                    <div className="p-1 space-y-0.5">
                                        {filteredOptions.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => {
                                                    onChange(opt.value);
                                                    setIsOpen(false);
                                                    setSearch(''); // finding: clear search on select
                                                }}
                                                className={cn(
                                                    "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 flex items-center justify-between group/opt",
                                                    value === opt.value
                                                        ? "bg-emerald-500/10 text-emerald-400"
                                                        : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                                                )}
                                            >
                                                <span className="truncate">{opt.name}</span>
                                                {value === opt.value && (
                                                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-xs text-slate-500 font-medium tracking-wide opacity-60">
                                        SONUÇ BULUNAMADI
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
