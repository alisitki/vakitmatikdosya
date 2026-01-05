"use client";

import { Download } from 'lucide-react';

interface YearDownloadCardProps {
    onDownload: () => void;
    disabled: boolean;
}

export function YearDownloadCard({ onDownload, disabled }: YearDownloadCardProps) {
    return (
        <button
            onClick={onDownload}
            disabled={disabled}
            className={`
        relative w-full overflow-hidden p-[1px] rounded-2xl transition-all duration-300
        ${disabled
                    ? 'bg-[var(--theme-border)] opacity-50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[var(--theme-accent)] to-[var(--theme-accent)]/60 hover:scale-[1.01] active:scale-[0.99]'}
      `}
        >
            <div className={`
        flex items-center justify-center gap-3 px-6 py-4 rounded-2xl
        bg-[var(--theme-card)] transition-all duration-300
        ${!disabled && 'hover:bg-[var(--theme-accent)]/10'}
      `}>
                <Download className={`w-5 h-5 ${disabled ? 'text-[var(--theme-text2)]' : 'text-[var(--theme-accent)] group-hover:text-[var(--theme-text)]'}`} />
                <span className={`text-sm font-bold tracking-wider ${disabled ? 'text-[var(--theme-text2)]' : 'text-[var(--theme-text)]'}`}>
                    2026 YILI DOSYASI İNDİR
                </span>
            </div>
        </button>
    );
}
