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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || options.length === 0) return;

    // Open on space or enter
    if (!isOpen && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    // Close on escape
    if (isOpen && e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    // Letter search logic
    if (e.key.length === 1 && e.key.match(/[a-z0-9İıĞğÜüŞşÖö]/i)) {
      const searchChar = e.key.toLowerCase();
      const currentIndex = options.findIndex(o => o.value === value);

      // Look for the next option starting with this character
      let nextIndex = options.findIndex((o, i) => i > currentIndex && o.name.toLowerCase().startsWith(searchChar));

      // If not found, wrap around and look from the start
      if (nextIndex === -1) {
        nextIndex = options.findIndex(o => o.name.toLowerCase().startsWith(searchChar));
      }

      if (nextIndex !== -1) {
        onChange(options[nextIndex].value);
        if (!isOpen) setIsOpen(true);
      }
    }
  };

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const selectedItem = containerRef.current.querySelector('[data-selected="true"]');
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [isOpen, value]);

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
        onKeyDown={handleKeyDown}
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
                data-selected={option.value === value}
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
  const [prepStatus, setPrepStatus] = useState<'idle' | 'preparing' | 'ready'>('idle');
  const [preparedFile, setPreparedFile] = useState<{ url: string; name: string } | null>(null);

  // Fetch Countries on mount
  useEffect(() => {
    setLoadingCountries(true);
    fetch('/api/countries')
      .then((res) => res.json())
      .then((data: LocationOption[]) => {
        setCountries(data);
        setLoadingCountries(false);

        // Auto-select Türkiye
        const turkiye = data.find(c => c.name.toUpperCase() === 'TÜRKİYE');
        if (turkiye) {
          setSelectedCountry(turkiye.value);
        }
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

  const handlePrepare = async () => {
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

    setPrepStatus('preparing');
    setDownloading(true);
    try {
      const response = await fetch(`/api/download?id=${finalId}&name=${encodeURIComponent(finalName)}`);
      if (!response.ok) throw new Error('Hazırlama başarısız');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreparedFile({ url, name: `${finalName}_Namaz_Vakitleri.txt` });
      setPrepStatus('ready');
    } catch (e) {
      console.error(e);
      alert('Dosya hazırlanırken bir hata oluştu. Lütfen tekrar deneyin.');
      setPrepStatus('idle');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownload = () => {
    if (!preparedFile) return;

    const a = document.createElement('a');
    a.href = preparedFile.url;
    a.download = preparedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resetPrep = () => {
    if (preparedFile) {
      window.URL.revokeObjectURL(preparedFile.url);
    }
    setPrepStatus('idle');
    setPreparedFile(null);
  };

  const cityObj = cities.find((c) => c.value === selectedCity);
  const canDownload = cityObj?.leaf || selectedDistrict;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col md:flex-row items-center justify-center p-4 gap-6 font-sans">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/10 z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
            Vakit Dosyası Oluşturucu
          </h1>
          <p className="text-emerald-300/70 text-sm font-medium">
            vakitmatikler için
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
            onClick={handlePrepare}
            disabled={!canDownload || prepStatus !== 'idle'}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform mt-2 border ${canDownload && prepStatus === 'idle'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] border-transparent'
              : 'bg-white/5 text-white/20 cursor-not-allowed border-white/5'
              }`}
          >
            {prepStatus === 'preparing' ? (
              <span className="inline-flex items-center gap-3">
                <LoadingDots /> <span className="animate-pulse">Hazırlanıyor...</span>
              </span>
            ) : prepStatus === 'ready' ? (
              <span className="inline-flex items-center gap-2">
                <span className="text-xl">✅</span> <span>Hazır!</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span className="text-xl">📄</span> <span>Dosya Hazırla</span>
              </span>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-white/20 text-[10px] uppercase tracking-widest text-center mt-10 font-semibold">
          Diyanet İşleri Başkanlığı Verileri
        </p>
      </div>

      {/* Preparation Status Card */}
      {prepStatus !== 'idle' && (
        <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 w-full max-w-sm shadow-2xl border border-white/10 z-10 animate-in slide-in-from-left-4 md:slide-in-from-left-8 duration-500 fade-in fill-mode-both">
          <div className="text-center">
            <div className="relative mb-6">
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center text-3xl transition-all duration-500 ${prepStatus === 'preparing'
                ? 'bg-emerald-500/20 animate-pulse'
                : 'bg-emerald-500 shadow-lg shadow-emerald-500/30 scale-110'
                }`}>
                {prepStatus === 'preparing' ? '⚙️' : '✅'}
              </div>
              {prepStatus === 'preparing' && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
              )}
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              {prepStatus === 'preparing' ? 'Dosya Hazırlanıyor' : 'Dosya Hazır!'}
            </h3>
            <p className="text-emerald-300/70 text-sm mb-8 leading-relaxed">
              {prepStatus === 'preparing'
                ? 'Veriler Diyanet üzerinden çekiliyor ve sizin için TXT formatına dönüştürülüyor. Bu işlem biraz sürebilir...'
                : 'Seçtiğiniz konumun 2026 yılı namaz vakitleri başarıyla hazırlandı. Aşağıdaki butondan indirebilirsiniz.'}
            </p>

            <div className="space-y-3">
              {prepStatus === 'ready' && (
                <button
                  onClick={handleDownload}
                  className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span className="text-xl">📥</span> Şimdi İndir
                </button>
              )}

              <button
                onClick={resetPrep}
                className="w-full py-3 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                {prepStatus === 'ready' ? 'Yeni Dosya Hazırla' : 'İptal Et'}
              </button>
            </div>
          </div>

          {/* Decorative small dots for "processing" vibe */}
          {prepStatus === 'preparing' && (
            <div className="flex justify-center gap-2 mt-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-emerald-500/40 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                ></div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
