'use client';

import { useState, useEffect } from 'react';
import { BackgroundStage } from '@/components/background/BackgroundStage';
import { Header } from '@/components/layout/Header';
import { SelectPill } from '@/components/ui/SelectPill';
import { TimesGrid } from '@/components/prayer/TimesGrid';
import { YearDownloadCard } from '@/components/download/YearDownloadCard';
import { Globe, Building, MapPin } from 'lucide-react';

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

const MONTHS_TR = [
  "OCAK", "SUBAT", "MART", "NISAN", "MAYIS", "HAZIRAN",
  "TEMMUZ", "AGUSTOS", "EYLUL", "EKIM", "KASIM", "ARALIK"
];

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
  const [displayDate, setDisplayDate] = useState(new Date());

  const [uiPrefs, setUiPrefs] = useState({
    scene: 'constellation' as 'flow' | 'pattern' | 'constellation',
    intensity: 1.0
  });

  // Load UI Prefs
  useEffect(() => {
    const saved = localStorage.getItem('vakitmatik_ui_prefs');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUiPrefs({
        scene: parsed.scene,
        intensity: parsed.intensity
      });
    }
  }, []);

  // Handlers
  const handleCountryChange = (val: string) => {
    setSelectedCountry(val);
    setCities([]);
    setSelectedCity('');
    setDistricts([]);
    setSelectedDistrict('');
    setPreviewData(null);
    setDisplayDate(new Date());
  };

  const handleCityChange = (val: string) => {
    setSelectedCity(val);
    setDistricts([]);
    setSelectedDistrict('');
    setPreviewData(null);
    setDisplayDate(new Date());
  };

  const handleDayChange = (offset: number) => {
    const newDate = new Date(displayDate);
    newDate.setDate(newDate.getDate() + offset);
    if (newDate.getFullYear() === 2026) {
      setDisplayDate(newDate);
    }
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
    const cityObj = cities.find((c) => c.value === selectedCity);
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
  }, [selectedCity, selectedCountry, cities]);

  // Preview Logic
  useEffect(() => {
    const cityObj = cities.find((c) => c.value === selectedCity);
    const canDownload = cityObj?.leaf || (selectedDistrict && districts.length > 0);

    if (canDownload) {
      fetchPreview();
    } else {
      setPreviewData(null);
    }
  }, [selectedCountry, selectedCity, selectedDistrict, cities, districts, displayDate]);

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
      parseAndSetPreview(text, displayDate);
    } catch (e) {
      console.error(e);
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const parseAndSetPreview = (text: string, targetDate: Date) => {
    const currentMonthIndex = targetDate.getMonth();
    const currentDay = targetDate.getDate();
    const currentMonthName = MONTHS_TR[currentMonthIndex];

    const monthRegex = new RegExp(`\\d{4}\\s*-\\s*${currentMonthName}`, 'i');
    const monthMatch = monthRegex.exec(text);

    if (!monthMatch) return;

    const textFromMonth = text.slice(monthMatch.index);
    const dayStr = currentDay.toString().padStart(2, '0');
    const dayLineRegex = new RegExp(`^\\s*${dayStr}\\s+(\\d{2}\\s+\\d{2})\\s+(\\d{2}\\s+\\d{2})\\s+(\\d{2}\\s+\\d{2})\\s+(\\d{2}\\s+\\d{2})\\s+(\\d{2}\\s+\\d{2})\\s+(\\d{2}\\s+\\d{2})`, 'm');

    const dayMatch = dayLineRegex.exec(textFromMonth);

    if (dayMatch) {
      setPreviewData({
        date: `${currentDay} ${currentMonthName} ${targetDate.getFullYear()}`,
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

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${finalName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const cityObj = cities.find((c) => c.value === selectedCity);
  const canDownload = cityObj?.leaf || (selectedDistrict && districts.length > 0);

  return (
    <div className="min-h-screen relative flex flex-col items-center">
      <BackgroundStage scene={uiPrefs.scene} intensity={uiPrefs.intensity} />

      <main className="relative z-10 w-full max-w-lg px-4 flex flex-col items-center justify-center py-12">
        <Header />

        <div className="w-full bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-[32px] p-6 md:p-8 space-y-6 mt-4">
          <section className="space-y-4">
            <SelectPill
              label="Ülke"
              placeholder="Ülke Seçiniz"
              icon={<Globe className="w-4 h-4" />}
              value={selectedCountry}
              onChange={handleCountryChange}
              options={countries}
              loading={loadingCountries}
              disabled={loadingCountries}
            />

            <div className={`transition-all duration-300 ${selectedCountry ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <SelectPill
                label="Şehir"
                placeholder="Şehir Seçiniz"
                icon={<Building className="w-4 h-4" />}
                value={selectedCity}
                onChange={handleCityChange}
                options={cities}
                loading={loadingCities}
                disabled={!selectedCountry || loadingCities}
              />
            </div>

            <div className={`transition-all duration-300 ${selectedCity && !cityObj?.leaf ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}`}>
              {(loadingDistricts || districts.length > 0) && (
                <SelectPill
                  label="İlçe"
                  placeholder="İlçe Seçiniz"
                  icon={<MapPin className="w-4 h-4" />}
                  value={selectedDistrict}
                  onChange={setSelectedDistrict}
                  options={districts}
                  loading={loadingDistricts}
                  disabled={loadingDistricts}
                />
              )}
            </div>
          </section>

          {(canDownload || loadingPreview) && (
            <TimesGrid
              data={previewData}
              loading={loadingPreview}
              onPrevDay={() => handleDayChange(-1)}
              onNextDay={() => handleDayChange(1)}
              isToday={displayDate.toDateString() === new Date().toDateString()}
            />
          )}

          <YearDownloadCard onDownload={handleDownload} disabled={!canDownload} />
        </div>

        <footer className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--theme-text2)]">
            <a href="https://vakitmatik.org" target="_blank" className="hover:text-[var(--theme-accent)] transition-colors">vakitmatik.org</a>
            <div className="w-1.5 h-1.5 bg-[var(--theme-border)] rounded-full"></div>
            <a href="https://reksanreklam.com.tr" target="_blank" className="hover:text-[var(--theme-accent)] transition-colors">REKSANREKLAM.COM.TR</a>
          </div>
          <p className="text-[10px] font-bold text-[var(--theme-text2)] opacity-40 uppercase tracking-[0.3em]">
            © 2026 REKSAN
          </p>
        </footer>
      </main>
    </div>
  );
}
