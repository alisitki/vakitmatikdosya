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
        className={`w-full text-left bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white transition-all duration-150 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 disabled:opacity-50 flex justify-between items-center active:scale-[0.99] ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
      >
        <span className={`font-medium ${selectedOption ? 'text-white' : 'text-slate-400'}`}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-[#1A3A5A] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-200 scrollbar-thin scrollbar-thumb-emerald-600/50 scrollbar-track-transparent">
          {options.length > 0 ? (
            options.map((option) => (
              <div
                key={option.value}
                data-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-3.5 cursor-pointer text-sm font-medium transition-colors duration-150 ${option.value === value
                  ? 'bg-emerald-600/30 text-emerald-400'
                  : 'text-slate-200 hover:bg-white/5'
                  }`}
              >
                {option.name}
              </div>
            ))
          ) : (
            <div className="px-4 py-4 text-sm text-slate-400 text-center italic">Seçenek bulunamadı</div>
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
        if (Array.isArray(data)) {
          setCountries(data);
          // Auto-select Türkiye
          const turkiye = data.find(c => c.name.toUpperCase() === 'TÜRKİYE');
          if (turkiye) {
            setSelectedCountry(turkiye.value);
          }
        } else {
          console.error('Countries API returned invalid data:', data);
        }
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
          if (Array.isArray(data)) {
            setCities(data);
          } else {
            console.error('Cities API returned invalid data:', data);
          }
          setLoadingCities(false);
        })
        .catch(() => setLoadingCities(false));
    }
  }, [selectedCountry]);

  // Fetch Districts when city changes (if not leaf)
  useEffect(() => {
    const cityObj = Array.isArray(cities) ? cities.find((c) => c.value === selectedCity) : null;
    if (selectedCity && cityObj && !cityObj.leaf && selectedCountry) {
      setDistricts([]);
      setSelectedDistrict('');
      setLoadingDistricts(true);
      fetch(`/api/districts?countryId=${selectedCountry}&cityId=${selectedCity}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setDistricts(data);
          } else {
            console.error('Districts API returned invalid data:', data);
          }
          setLoadingDistricts(false);
        })
        .catch(() => setLoadingDistricts(false));
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedCity, cities, selectedCountry]);

  const handlePrepare = async () => {
    // Build the download URL with new format
    const countryObj = Array.isArray(countries) ? countries.find((c) => c.value === selectedCountry) : null;
    const cityObj = Array.isArray(cities) ? cities.find((c) => c.value === selectedCity) : null;

    if (!countryObj || !cityObj) return;

    let finalName = '';
    let downloadUrl = `/api/download?country=${encodeURIComponent(countryObj.value)}&city=${encodeURIComponent(cityObj.value)}`;

    if (cityObj.leaf) {
      // 2-layer country: city is the final destination
      finalName = cityObj.name;
    } else if (selectedDistrict) {
      // 3-layer country: use district
      const distObj = Array.isArray(districts) ? districts.find((d) => d.value === selectedDistrict) : null;
      if (!distObj) return;
      finalName = distObj.name;
      downloadUrl += `&district=${encodeURIComponent(distObj.value)}`;
    } else {
      return; // No valid selection
    }

    downloadUrl += `&name=${encodeURIComponent(finalName)}`;

    setPrepStatus('preparing');
    setDownloading(true);
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Hazırlama başarısız');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPreparedFile({ url, name: `${finalName}.txt` });
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
    <main className="min-h-screen bg-[#0F2A44] flex flex-col items-center justify-center p-6 gap-6 font-sans antialiased text-white">
      {/* Background Subtle Gradient */}
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent"></div>

      <div className="relative bg-[#1A3A5A]/30 backdrop-blur-md rounded-[32px] p-10 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 z-10 transition-all duration-500">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-white/95 mb-2">
            Namaz Vakti Dosyası Oluşturucu - 2026
          </h1>
          <p className="text-slate-400 font-medium text-sm tracking-wide">
            Bu dosya yalnızca Vakitmatik cihazlarında kullanılır
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
          {/* Download Button */}
          <button
            onClick={handlePrepare}
            disabled={!canDownload || prepStatus !== 'idle'}
            className={`w-full py-5 rounded-2xl font-semibold text-lg transition-all duration-200 active:scale-[0.97] mt-4 flex items-center justify-center gap-3 ${canDownload && prepStatus === 'idle'
              ? 'bg-[#1F7A4D] hover:bg-[#258a58] text-white shadow-xl shadow-emerald-900/20'
              : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
          >
            {prepStatus === 'preparing' ? (
              <span className="inline-flex items-center gap-3">
                <LoadingDots /> <span className="animate-pulse">Hazırlanıyor...</span>
              </span>
            ) : (
              <>
                <span className="text-xl opacity-80">📄</span>
                <span>Dosya Hazırla</span>
              </>
            )}
          </button>
        </div>

        {/* Note Footer */}
        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-[#6B7280] text-[10px] font-medium uppercase tracking-[0.15em] mb-4">
            bu işlem biraz zaman alabilir
          </p>
          <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity duration-300">
            <a href="https://reksanreklam.com.tr" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:text-emerald-400 transition-colors font-medium tracking-wide">
              reksanreklam.com.tr
            </a>
            <a href="https://vakitmatik.org" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:text-emerald-400 transition-colors font-medium tracking-wide">
              vakitmatik.org
            </a>
          </div>
        </div>
      </div>

      {/* Result Card Modal / Overlay */}
      {prepStatus === 'ready' && preparedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0F2A44]/80 backdrop-blur-xl" onClick={resetPrep}></div>
          <div className="relative bg-[#1A3A5A] rounded-[32px] p-10 w-full max-w-md shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#1F7A4D]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#1F7A4D]/30">
                <span className="text-2xl text-[#1F7A4D]">✓</span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3">
                Dosya başarıyla oluşturuldu
              </h3>
              <p className="text-slate-400 text-sm mb-10 leading-relaxed px-4">
                Seçilen konum için 2026 yılı vakitmatik yükleme dosyası hazır.
              </p>

              <div className="mb-10 p-5 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center">
                <span className="text-white font-medium truncate w-full px-2 text-sm opacity-80 mb-1">
                  {preparedFile.name}
                </span>
                <span className="text-[#6B7280] text-xs uppercase tracking-widest font-bold">
                  HAZIRLANDI
                </span>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleDownload}
                  className="w-full py-5 rounded-2xl font-bold text-lg bg-[#1F7A4D] hover:bg-[#258a58] text-white transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                >
                  Dosyayı İndir
                </button>

                <button
                  onClick={resetPrep}
                  className="w-full py-3 text-slate-400 hover:text-white transition-colors duration-200 text-sm font-medium"
                >
                  Yeni dosya oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
