'use client';

import { useState, useEffect } from 'react';

interface LocationOption {
  value: string;
  name: string;
  leaf?: boolean;
}

export default function Home() {
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');

  const [downloading, setDownloading] = useState(false);

  // Fetch Countries on mount
  useEffect(() => {
    fetch('/api/countries')
      .then(res => res.json())
      .then(data => setCountries(data))
      .catch(console.error);
  }, []);

  // Fetch Cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      setCities([]);
      setDistricts([]);
      setSelectedCity('');
      setSelectedDistrict('');
      fetch(`/api/cities?countryId=${selectedCountry}`)
        .then(res => res.json())
        .then(data => setCities(data))
        .catch(console.error);
    }
  }, [selectedCountry]);

  // Fetch Districts when city changes (if not leaf)
  useEffect(() => {
    const cityObj = cities.find(c => c.value === selectedCity);
    if (selectedCity && cityObj && !cityObj.leaf && selectedCountry) {
      setDistricts([]);
      setSelectedDistrict('');
      fetch(`/api/districts?countryId=${selectedCountry}&cityId=${selectedCity}`)
        .then(res => res.json())
        .then(data => setDistricts(data))
        .catch(console.error);
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedCity, cities, selectedCountry]);

  const handleDownload = async () => {
    // Determine the final ID and Name
    let finalId = '';
    let finalName = '';

    // Check city leaf logic first
    const cityObj = cities.find(c => c.value === selectedCity);
    if (cityObj?.leaf) {
      finalId = cityObj.value;
      finalName = cityObj.name;
    } else if (selectedDistrict) {
      // Find district name
      const distObj = districts.find(d => d.value === selectedDistrict);
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

  const cityObj = cities.find(c => c.value === selectedCity);
  const canDownload = cityObj?.leaf || selectedDistrict;

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-900 to-teal-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          🕌 Vakitmatik
        </h1>
        <p className="text-emerald-200 text-center mb-8">
          Yıllık Namaz Vakitleri İndirici
        </p>

        <div className="space-y-4">
          {/* Country Select */}
          <div>
            <label className="block text-emerald-100 text-sm font-medium mb-2">
              Ülke
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <option value="" className="text-gray-900">Ülke Seçin</option>
              {countries.map(c => (
                <option key={c.value} value={c.value} className="text-gray-900">{c.name}</option>
              ))}
            </select>
          </div>

          {/* City Select */}
          {selectedCountry && (
            <div>
              <label className="block text-emerald-100 text-sm font-medium mb-2">
                Şehir
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="" className="text-gray-900">Şehir Seçin</option>
                {cities.map(c => (
                  <option key={c.value} value={c.value} className="text-gray-900">{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* District Select */}
          {selectedCity && !cityObj?.leaf && districts.length > 0 && (
            <div>
              <label className="block text-emerald-100 text-sm font-medium mb-2">
                İlçe
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="" className="text-gray-900">İlçe Seçin</option>
                {districts.map(d => (
                  <option key={d.value} value={d.value} className="text-gray-900">{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={!canDownload || downloading}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-300 ${canDownload && !downloading
              ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg hover:shadow-emerald-500/50'
              : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
              }`}
          >
            {downloading ? '⏳ Çevriliyor...' : '📥 TXT İndir'}
          </button>
        </div>

        <p className="text-emerald-200/60 text-xs text-center mt-6">
          Diyanet İşleri Başkanlığı verilerinden oluşturulmuştur.
        </p>
      </div>
    </main>
  );
}
