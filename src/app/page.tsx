'use client';

import { useState, useEffect, useRef } from 'react';

// --- Types ---
interface LocationOption {
  value: string;
  name: string;
  leaf?: boolean;
}

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

// --- Constants ---
const MONTHS_TR = [
  "OCAK", "SUBAT", "MART", "NISAN", "MAYIS", "HAZIRAN",
  "TEMMUZ", "AGUSTOS", "EYLUL", "EKIM", "KASIM", "ARALIK"
];

// --- Components ---

function LoadingDots() {
  return (
    <div className="flex space-x-1.5 items-center justify-center p-1">
      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
    </div>
  );
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  loading = false,
  disabled = false,
  icon,
  zIndex = 50,
}: {
  value: string;
  onChange: (val: string) => void;
  options: LocationOption[];
  placeholder: string;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  zIndex?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || options.length === 0) return;
    if (!isOpen && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }
    if (isOpen && e.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    if (e.key.length === 1 && e.key.match(/[a-z0-9İıĞğÜüŞşÖö]/i)) {
      const char = e.key.toLowerCase();
      const currIdx = options.findIndex((o) => o.value === value);
      let nextIdx = options.findIndex((o, i) => i > currIdx && o.name.toLowerCase().startsWith(char));
      if (nextIdx === -1) nextIdx = options.findIndex((o) => o.name.toLowerCase().startsWith(char));
      if (nextIdx !== -1) {
        onChange(options[nextIdx].value);
        if (!isOpen) setIsOpen(true);
      }
    }
  };

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const selectedItem = containerRef.current.querySelector('[data-selected="true"]');
      selectedItem?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, value]);

  return (
    <div className="relative group" ref={containerRef} style={{ zIndex }}>
      <label className="block text-xs font-semibold text-emerald-100/60 uppercase tracking-wider mb-2 ml-1">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          w-full relative flex items-center justify-between
          bg-slate-800/50 hover:bg-slate-800/70 border border-white/5
          rounded-xl px-4 py-4 text-left transition-all duration-300
          focus:outline-none focus:ring-2 focus:ring-emerald-500/50
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800/50
          backdrop-blur-sm shadow-inner group-hover:border-white/10
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <span className={`text-xl ${disabled ? 'text-slate-600' : 'text-emerald-400'}`}>
            {loading ? <LoadingDots /> : icon}
          </span>
          <span className={`block truncate font-medium ${selectedOption ? 'text-white' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </div>

        <svg
          className={`w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 w-full mt-2 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl shadow-black/50 max-h-72 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
          <div className="sticky top-0 h-2 bg-gradient-to-b from-slate-900/95 to-transparent z-10 pointer-events-none" />
          {options.length > 0 ? (
            options.map((option) => (
              <div
                key={option.value}
                data-selected={option.value === value}
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`
                  px-4 py-3 cursor-pointer text-sm font-medium transition-colors duration-150 flex items-center justify-between group/item
                  ${option.value === value ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-300 hover:bg-white/5'}
                `}
              >
                <span>{option.name}</span>
                {option.value === value && (
                  <span className="text-emerald-400 text-lg">✓</span>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-slate-500 text-center italic">Seçenek bulunamadı</div>
          )}
          <div className="sticky bottom-0 h-2 bg-gradient-to-t from-slate-900/95 to-transparent z-10 pointer-events-none" />
        </div>
      )}
    </div>
  );
}

function PreviewCard({ data, loading }: { data: PrayerTimes | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/10 animate-pulse">
        <div className="h-4 bg-emerald-500/10 rounded w-1/3 mb-4 mx-auto"></div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-emerald-500/10 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const times = [
    { label: 'İmsak', value: data.times.imsak },
    { label: 'Güneş', value: data.times.gunes },
    { label: 'Öğle', value: data.times.ogle },
    { label: 'İkindi', value: data.times.ikindi },
    { label: 'Akşam', value: data.times.aksam },
    { label: 'Yatsı', value: data.times.yatsi },
  ];

  return (
    <div className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="text-center mb-4">
        <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">Bugün'ün Vakitleri</div>
        <div className="text-white font-medium text-sm opacity-80">{data.date}</div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {times.map((t) => (
          <div key={t.label} className="flex flex-col items-center p-2 bg-slate-900/40 rounded-xl border border-emerald-500/10 hover:border-emerald-500/30 transition-colors">
            <span className="text-emerald-300/60 text-[10px] uppercase font-bold tracking-wider">{t.label}</span>
            <span className="text-white text-lg font-mono font-medium">{t.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page ---

export default function Home() {
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [previewData, setPreviewData] = useState<PrayerTimes | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Handlers
  const handleCountryChange = (val: string) => {
    setSelectedCountry(val);
    setCities([]);
    setSelectedCity('');
    setDistricts([]);
    setSelectedDistrict('');
    setPreviewData(null);
  };

  const handleCityChange = (val: string) => {
    setSelectedCity(val);
    setDistricts([]);
    setSelectedDistrict('');
    setPreviewData(null);
  };

  // Initial Fetch
  useEffect(() => {
    setLoadingCountries(true);
    fetch('/api/countries')
      .then((res) => res.json())
      .then((data: LocationOption[]) => {
        if (Array.isArray(data)) {
          setCountries(data);
          const turkiye = data.find(c => c.name.toUpperCase() === 'TÜRKİYE');
          if (turkiye) setSelectedCountry(turkiye.value);
        }
        setLoadingCountries(false);
      })
      .catch(() => setLoadingCountries(false));
  }, []);

  // Country Change -> Fetch Cities
  useEffect(() => {
    if (!selectedCountry) return;
    setLoadingCities(true);
    fetch(`/api/cities?countryId=${selectedCountry}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCities(data);
        setLoadingCities(false);
      })
      .catch(() => setLoadingCities(false));
  }, [selectedCountry]);

  // City Change -> Fetch Districts
  useEffect(() => {
    const cityObj = cities.find((c) => c.value === selectedCity); // Find cityObj from current cities state
    if (selectedCity && cityObj && !cityObj.leaf && selectedCountry) {
      setLoadingDistricts(true);
      fetch(`/api/districts?countryId=${selectedCountry}&cityId=${selectedCity}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setDistricts(data);
          setLoadingDistricts(false);
        })
        .catch(() => setLoadingDistricts(false));
    }
  }, [selectedCity, selectedCountry, cities]); // 'cities' is needed here to correctly find cityObj

  // Preview Logic
  useEffect(() => {
    const cityObj = cities.find((c) => c.value === selectedCity);
    const canDownload = cityObj?.leaf || selectedDistrict;

    if (canDownload) {
      fetchPreview();
    } else {
      setPreviewData(null); // Keep this here in case canDownload becomes false without a selection change (e.g., districts list loads empty)
    }
  }, [selectedCountry, selectedCity, selectedDistrict, cities, districts]); // Keep cities/districts in deps for accurate canDownload check

  const fetchPreview = async () => {
    const countryObj = countries.find((c) => c.value === selectedCountry);
    const cityObj = cities.find((c) => c.value === selectedCity);

    if (!countryObj || !cityObj) return;

    let downloadUrl = `/api/download?country=${encodeURIComponent(countryObj.value)}&city=${encodeURIComponent(cityObj.value)}`;

    if (cityObj.leaf) {
      // 2-layer
    } else if (selectedDistrict) {
      const distObj = districts.find((d) => d.value === selectedDistrict);
      if (!distObj) return;
      downloadUrl += `&district=${encodeURIComponent(distObj.value)}`;
    } else {
      return;
    }

    setLoadingPreview(true);
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error('Preview failed');
      const text = await res.text();
      parseAndSetPreview(text);
    } catch (e) {
      console.error(e);
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const parseAndSetPreview = (text: string) => {
    const now = new Date();
    const currentMonthIndex = now.getMonth();
    const currentDay = now.getDate();
    const currentMonthName = MONTHS_TR[currentMonthIndex];

    // Find Header for current month (e.g., "2026 - OCAK")
    const monthRegex = new RegExp(`\\d{4}\\s*-\\s*${currentMonthName}`, 'i');
    const monthMatch = monthRegex.exec(text);

    if (!monthMatch) {
      console.warn('Month not found in file');
      return;
    }

    // Slice text starting from the month header
    const textFromMonth = text.slice(monthMatch.index);

    // Look for the day line: "01" or "15" etc.
    const dayStr = currentDay.toString().padStart(2, '0');
    // Regex: Start of line, padded day, followed by times separated by whitespace/spaces
    // Example: 01   06 47  08 13...
    // Note: The file might use spaces or tabs.
    const dayLineRegex = new RegExp(`^\\s*${dayStr}\\s+(\\d{2}\\s+\\d{2})\\s+(\\d{2}\\s+\\d{2})\\s+(\\d{2}\\s+\\d{2})\\s+(\\d{2}\\s+\\d{2})\\s+(\\d{2}\\s+\\d{2})\\s+(\\d{2}\\s+\\d{2})`, 'm');

    const dayMatch = dayLineRegex.exec(textFromMonth);

    if (dayMatch) {
      setPreviewData({
        date: `${currentDay} ${currentMonthName} ${now.getFullYear()}`,
        times: {
          imsak: dayMatch[1].replace(/\s+/, ':'),
          gunes: dayMatch[2].replace(/\s+/, ':'),
          ogle: dayMatch[3].replace(/\s+/, ':'),
          ikindi: dayMatch[4].replace(/\s+/, ':'),
          aksam: dayMatch[5].replace(/\s+/, ':'),
          yatsi: dayMatch[6].replace(/\s+/, ':'),
        }
      });
    }
  };

  // Download Handler
  const handleDownload = () => {
    const countryObj = countries.find((c) => c.value === selectedCountry);
    const cityObj = cities.find((c) => c.value === selectedCity);

    if (!countryObj || !cityObj) return;

    let finalName = '';
    let downloadUrl = `/api/download?country=${encodeURIComponent(countryObj.value)}&city=${encodeURIComponent(cityObj.value)}`;

    if (cityObj.leaf) {
      finalName = cityObj.name;
    } else if (selectedDistrict) {
      const distObj = districts.find((d) => d.value === selectedDistrict);
      if (!distObj) return;
      finalName = distObj.name;
      downloadUrl += `&district=${encodeURIComponent(distObj.value)}`;
    } else {
      return;
    }

    downloadUrl += `&name=${encodeURIComponent(finalName)}`;

    // Trigger Download
    const a = document.createElement('a');
    a.href = downloadUrl;
    // The download attribute is helpful but might be overridden by the server's Content-Disposition header
    a.download = `${finalName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const cityObj = cities.find((c) => c.value === selectedCity);
  const canDownload = cityObj?.leaf || selectedDistrict;

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-emerald-500/30">

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-[blob_7s_infinite]"></div>
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-[blob_7s_infinite_2s]"></div>
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-purple-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-[blob_7s_infinite_4s]"></div>
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 brightness-150 contrast-150"></div> {/* Optional Noise Texture */}
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Card Container - Removed overflow-hidden for dropdowns */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[32px] shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-700">

          {/* Header Section */}
          <div className="relative p-8 pb-6 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent rounded-t-[32px]">
            <div className="flex flex-col items-center">
              <span className="mb-3 px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/10 text-emerald-400/60 text-[10px] font-bold tracking-[0.2em]">
                2026
              </span>
              <h1 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">
                Vakitmatik
              </h1>
              <p className="text-center text-slate-400 text-sm font-medium">
                Namaz Vakti Dosyası Oluşturucu
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-8 space-y-4">
            <CustomSelect
              label="Ülke"
              placeholder="Ülke Seçiniz"
              icon="🌍"
              value={selectedCountry}
              onChange={handleCountryChange}
              options={countries}
              loading={loadingCountries}
              disabled={loadingCountries}
              zIndex={30}
            />

            <div className={`transition-all duration-300 relative z-20 ${selectedCountry ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-2 pointer-events-none'}`}>
              <CustomSelect
                label="Şehir"
                placeholder="Şehir Seçiniz"
                icon="🏙️"
                value={selectedCity}
                onChange={handleCityChange}
                options={cities}
                loading={loadingCities}
                disabled={!selectedCountry || loadingCities}
              />
            </div>

            <div className={`transition-all duration-300 relative z-10 ${selectedCity && !cityObj?.leaf ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none h-0 p-0 overflow-hidden'}`}>
              {(loadingDistricts || districts.length > 0) && (
                <CustomSelect
                  label="İlçe"
                  placeholder="İlçe Seçiniz"
                  icon="📍"
                  value={selectedDistrict}
                  onChange={setSelectedDistrict}
                  options={districts}
                  loading={loadingDistricts}
                  disabled={loadingDistricts}
                />
              )}
            </div>

            {/* Preview Section */}
            {(canDownload || loadingPreview) && (
              <div className="pt-2">
                <PreviewCard data={previewData} loading={loadingPreview} />
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={handleDownload}
                disabled={!canDownload}
                className={`
                  group relative w-full overflow-hidden rounded-2xl p-[1px]
                  transition-all duration-300
                  ${canDownload
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 cursor-pointer shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.7)] hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-slate-800 cursor-not-allowed opacity-50'}
                `}
              >
                <div className={`
                  relative px-6 py-4 rounded-2xl flex items-center justify-center gap-3
                  ${canDownload ? 'bg-slate-900/50' : 'bg-slate-900'}
                  transition-all duration-300 group-hover:bg-opacity-0
                `}>
                  <span className="text-xl">
                    ⬇️
                  </span>
                  <span className="text-lg font-bold text-white tracking-wide">
                    2026 YILI DOSYASI İNDİR
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-slate-900/50 border-t border-white/5 flex items-center justify-center gap-6 rounded-b-[32px]">
            <a href="https://vakitmatik.org" target="_blank" className="text-xs font-semibold text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">
              vakitmatik.org
            </a>
            <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
            <a href="https://reksanreklam.com.tr" target="_blank" className="text-xs font-semibold text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">
              REKSANREKLAM.COM.TR
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] opacity-60">
            2026 Reksan
          </p>
        </div>
      </div>
    </main>
  );
}
