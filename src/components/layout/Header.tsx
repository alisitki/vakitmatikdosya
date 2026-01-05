"use client";

export function Header() {
    return (
        <header className="w-full flex flex-col items-center py-8">
            <div className="flex items-center justify-between w-full max-w-lg px-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--theme-text)]">
                        Vakitmatik
                    </h1>
                    <p className="text-xs font-medium text-[var(--theme-text2)]">
                        Namaz vakti dosyası oluşturucu
                    </p>
                </div>
                <div className="px-3 py-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-accent)] text-xs font-bold tracking-wider">
                    YIL: 2026
                </div>
            </div>
        </header>
    );
}
