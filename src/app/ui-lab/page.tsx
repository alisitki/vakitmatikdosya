"use client";

import { useState, useEffect } from 'react';
import { BackgroundStage } from '@/components/background/BackgroundStage';
import { Header } from '@/components/layout/Header';
import { SelectPill } from '@/components/ui/SelectPill';
import { TimesGrid } from '@/components/prayer/TimesGrid';
import { YearDownloadCard } from '@/components/download/YearDownloadCard';
import { themes, ThemeKey, setThemeVariables } from '@/lib/theme';
import { Globe, MapPin, Building, Settings2, Play, Pause, Save } from 'lucide-react';

export default function UILab() {
    const [prefs, setPrefs] = useState({
        theme: 'A' as ThemeKey,
        scene: 'constellation' as 'flow' | 'pattern' | 'constellation',
        intensity: 1.0,
        motion: true,
    });

    useEffect(() => {
        const saved = localStorage.getItem('vakitmatik_ui_prefs');
        if (saved) {
            const parsed = JSON.parse(saved);
            setPrefs(parsed);
            setThemeVariables(parsed.theme);
        } else {
            setThemeVariables('A');
        }
    }, []);

    const updatePrefs = (newPrefs: Partial<typeof prefs>) => {
        const updated = { ...prefs, ...newPrefs };
        setPrefs(updated);
        if (newPrefs.theme) {
            setThemeVariables(newPrefs.theme);
        }
    };

    const handleSave = () => {
        localStorage.setItem('vakitmatik_ui_prefs', JSON.stringify(prefs));
        alert('Tema ayarları kaydedildi ve ana sayfaya uygulandı!');
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            <BackgroundStage scene={prefs.scene} intensity={prefs.intensity} />

            {/* Control Panel */}
            <aside className="w-full md:w-80 bg-[var(--theme-card)] border-r border-[var(--theme-border)] z-20 p-6 flex flex-col gap-8">
                <div className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-[var(--theme-accent)]" />
                    <h2 className="font-bold tracking-tight">Theme Lab</h2>
                </div>

                {/* Theme Select */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-text2)]">Palette</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {(Object.keys(themes) as ThemeKey[]).map((t) => (
                            <button
                                key={t}
                                onClick={() => updatePrefs({ theme: t })}
                                className={`
                  flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all
                  ${prefs.theme === t ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]' : 'border-[var(--theme-border)] text-[var(--theme-text2)]'}
                `}
                            >
                                {themes[t].name}
                                <div className="flex gap-1">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themes[t].colors.bg }}></div>
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themes[t].colors.accent }}></div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Scene Select */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-text2)]">Background Scene</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {['flow', 'pattern', 'constellation'].map((s) => (
                            <button
                                key={s}
                                onClick={() => updatePrefs({ scene: s as any })}
                                className={`
                  px-4 py-3 rounded-xl border text-sm font-medium transition-all capitalize
                  ${prefs.scene === s ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 text-[var(--theme-accent)]' : 'border-[var(--theme-border)] text-[var(--theme-text2)]'}
                `}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Intensity */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-text2)]">Intensity</h3>
                        <span className="text-[10px] font-mono text-[var(--theme-accent)]">{Math.round(prefs.intensity * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={prefs.intensity}
                        onChange={(e) => updatePrefs({ intensity: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-[var(--theme-border)] rounded-lg appearance-none cursor-pointer accent-[var(--theme-accent)]"
                    />
                </section>

                {/* Motion */}
                <section className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--theme-text2)]">Motion</h3>
                    <button
                        onClick={() => updatePrefs({ motion: !prefs.motion })}
                        className={`
              flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all
              ${prefs.motion ? 'border-[var(--theme-accent)] text-[var(--theme-accent)]' : 'border-[var(--theme-border)] text-[var(--theme-text2)]'}
            `}
                    >
                        {prefs.motion ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        {prefs.motion ? 'Enabled' : 'Disabled'}
                    </button>
                </section>

                <button
                    onClick={handleSave}
                    className="mt-auto flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[var(--theme-accent)] text-[var(--theme-bg)] font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Save className="w-5 h-5" />
                    Apply to Home
                </button>
            </aside>

            {/* Preview Area */}
            <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-lg space-y-8">
                    <Header />

                    <div className="space-y-4">
                        <SelectPill
                            label="Ülke"
                            placeholder="Ülke Seçiniz"
                            value="turkiye"
                            options={[{ value: 'turkiye', name: 'Türkiye' }]}
                            onChange={() => { }}
                            icon={<Globe className="w-4 h-4" />}
                        />
                        <SelectPill
                            label="Şehir"
                            placeholder="Şehir Seçiniz"
                            value="istanbul"
                            options={[{ value: 'istanbul', name: 'İstanbul' }]}
                            onChange={() => { }}
                            icon={<Building className="w-4 h-4" />}
                        />
                        <SelectPill
                            label="İlçe"
                            placeholder="İlçe Seçiniz"
                            value=""
                            options={[]}
                            onChange={() => { }}
                            icon={<MapPin className="w-4 h-4" />}
                        />
                    </div>

                    <TimesGrid
                        loading={false}
                        isToday={true}
                        data={{
                            date: "5 OCAK 2026",
                            times: {
                                imsak: "06:47",
                                gunes: "08:13",
                                ogle: "13:12",
                                ikindi: "15:45",
                                aksam: "18:02",
                                yatsi: "19:22"
                            }
                        }}
                    />

                    <YearDownloadCard onDownload={() => { }} disabled={false} />
                </div>
            </main>
        </div>
    );
}
