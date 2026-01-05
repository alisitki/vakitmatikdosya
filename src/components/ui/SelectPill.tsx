"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
    value: string;
    name: string;
}

interface SelectPillProps {
    label: string;
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    placeholder: string;
    icon?: React.ReactNode;
    loading?: boolean;
    disabled?: boolean;
}

export function SelectPill({
    label,
    value,
    options,
    onChange,
    placeholder,
    icon,
    loading,
    disabled
}: SelectPillProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(o => o.value === value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="flex flex-col gap-1.5 w-full relative" ref={containerRef}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-text2)] px-1">
                {label}
            </span>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          flex items-center justify-between w-full px-4 py-3 
          rounded-2xl border transition-all duration-200
          ${isOpen ? 'border-[var(--theme-accent)] ring-1 ring-[var(--theme-accent)]' : 'border-[var(--theme-border)]'}
          bg-[var(--theme-card)] hover:border-[var(--theme-accent)]
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
            >
                <div className="flex items-center gap-3">
                    <span className="text-[var(--theme-accent)]">{icon}</span>
                    <span className={`text-sm font-medium ${selectedOption ? 'text-[var(--theme-text)]' : 'text-[var(--theme-text2)]'}`}>
                        {loading ? 'Yükleniyor...' : (selectedOption ? selectedOption.name : placeholder)}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[var(--theme-text2)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && !disabled && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-2xl shadow-xl overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-150">
                    <div className="max-h-60 overflow-y-auto">
                        {options.length > 0 ? (
                            options.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={`
                    flex items-center justify-between w-full px-4 py-3 text-left text-sm font-medium
                    hover:bg-[var(--theme-accent)]/5 transition-colors
                    ${value === opt.value ? 'text-[var(--theme-accent)]' : 'text-[var(--theme-text)]'}
                  `}
                                >
                                    {opt.name}
                                    {value === opt.value && <Check className="w-4 h-4" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-4 text-center text-xs text-[var(--theme-text2)]">
                                Bulunamadı
                            </div>
                        )}
                    </div>
                </div>
            )}
            {value && <span className="text-[10px] text-[var(--theme-accent)] mt-1 px-1">Seçildi: {selectedOption?.name}</span>}
        </div>
    );
}
