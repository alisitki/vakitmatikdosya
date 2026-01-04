'use client';

import { useState, useEffect, useRef } from 'react';

interface LocationOption {
  value: string;
  name: string;
  leaf?: boolean;
}

// Loading dots component
function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
    </span>
  );
}

// Custom Select Component
function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  loading = false,
  disabled = false,
}: {
  value: string;
  onChange: (val: string) => void;
  options: LocationOption[];
  placeholder: string;
  label: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
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

  return (
    <div className="relative" ref={containerRef}>
      <label className="flex items-center gap-2 text-emerald-200/80 text-sm font-medium mb-2">
        {label}
        {loading && <LoadingDots />}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white transition-all duration-200 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 disabled:opacity-50 flex justify-between items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
      >
        <span className={selectedOption ? 'text-white' : 'text-emerald-200/50'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-emerald-200/50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-200 scrollbar-thin scrollbar-thumb-emerald-600 scrollbar-track-slate-700">
          {options.length > 0 ? (
            options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-3 cursor-pointer text-sm transition-colors duration-150 ${option.value === value
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : 'text-slate-200 hover:bg-white/5'
                  }`}
              >
                {option.name}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-400 text-center">Seçenek yok</div>
          )}
        </div>
      )}
    </div>
  );
}

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
  const [downloading, setDownloading] = useState(false);

  // Fetch Countries on mount
  useEffect(() => {
    setLoadingCountries(true);
    fetch('/api/countries')
      .then((res) => res.json())
      .then((data) => {
        setCountries(data);
        setLoadingCountries(false);
      })
      .catch(() => setLoadingCountries(false));
  }, []);

  // Fetch Cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      setCities([]);
      setDistricts([]);
      setSelectedCity('');
      setSelectedDistrict('');
      setLoadingCities(true);
      fetch(`/api/cities?countryId=${selectedCountry}`)
        .then((res) => res.json())
        .then((data) => {
          setCities(data);
          setLoadingCities(false);
        })
        .catch(() => setLoadingCities(false));
    }
  }, [selectedCountry]);

  // Fetch Districts when city changes (if not leaf)
  useEffect(() => {
    const cityObj = cities.find((c) => c.value === selectedCity);
    if (selectedCity && cityObj && !cityObj.leaf && selectedCountry) {
      setDistricts([]);
      setSelectedDistrict('');
      setLoadingDistricts(true);
      fetch(`/api/districts?countryId=${selectedCountry}&cityId=${selectedCity}`)
        .then((res) => res.json())
        .then((data) => {
          setDistricts(data);
          setLoadingDistricts(false);
        })
        .catch(() => setLoadingDistricts(false));
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedCity, cities, selectedCountry]);

  const handleDownload = async () => {
    let finalId = '';
    let finalName = '';

    const cityObj = cities.find((c) => c.value === selectedCity);
    if (cityObj?.leaf) {
      finalId = cityObj.value;
      finalName = cityObj.name;
    } else if (selectedDistrict) {
      const distObj = districts.find((d) => d.value === selectedDistrict);
      if (distObj) {
        finalId = distObj.value;
        finalName = distObj.name;
      }
    }

    if (!finalId) return;

    setDownloading(true);
    try {
      const response = await fetch(`/api/download?id=${finalId}&name=${encodeURIComponent(finalName)}`);
      if (!response.ok) throw new Error('İndirme başarısız');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${finalName}_Namaz_Vakitleri.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert('İndirme sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setDownloading(false);
    }
  };

  const cityObj = cities.find((c) => c.value === selectedCity);
  const canDownload = cityObj?.leaf || selectedDistrict;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-4 font-sans">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/10 z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30 transform hover:scale-105 transition-transform duration-300">
            <span className="text-3xl filter drop-shadow-md">🕌</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
            Vakitmatik
          </h1>
          <p className="text-emerald-300/70 text-sm font-medium">
            Yıllık Namaz Vakitleri İndirici
          </p>
        </div>

        <div className="space-y-6">
          {/* Country Select */}
          <CustomSelect
            label={<span>🌍 Ülke</span>}
            value={selectedCountry}
            onChange={setSelectedCountry}
            options={countries}
            placeholder="Ülke Seçin"
            loading={loadingCountries}
            disabled={loadingCountries}
          />

          {/* City Select */}
          {selectedCountry && (
            <div className="animate-in slide-in-from-top-2 duration-300 fade-in fill-mode-both">
              <CustomSelect
                label={<span>🏙️ Şehir</span>}
                value={selectedCity}
                onChange={setSelectedCity}
                options={cities}
                placeholder="Şehir Seçin"
                loading={loadingCities}
                disabled={loadingCities}
              />
            </div>
          )}

          {/* District Select */}
          {selectedCity && !cityObj?.leaf && (loadingDistricts || districts.length > 0) && (
            <div className="animate-in slide-in-from-top-2 duration-300 fade-in fill-mode-both">
              <CustomSelect
                label={<span>📍 İlçe</span>}
                value={selectedDistrict}
                onChange={setSelectedDistrict}
                options={districts}
                placeholder="İlçe Seçin"
                loading={loadingDistricts}
                disabled={loadingDistricts}
              />
            </div>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={!canDownload || downloading}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform mt-2 border ${canDownload && !downloading
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] border-transparent'
                : 'bg-white/5 text-white/20 cursor-not-allowed border-white/5'
              }`}
          >
            {downloading ? (
              <span className="inline-flex items-center gap-3">
                <LoadingDots /> <span className="animate-pulse">Hazırlanıyor...</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span className="text-xl">📥</span> <span>TXT İndir</span>
              </span>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-white/20 text-[10px] uppercase tracking-widest text-center mt-10 font-semibold">
          Diyanet İşleri Başkanlığı Verileri
        </p>
      </div>
    </main>
  );
}
