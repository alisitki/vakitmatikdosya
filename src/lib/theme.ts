export const themes = {
    A: {
        name: 'Dark Premium',
        colors: {
            bg: '#0B0D10',
            card: '#161B22',
            text: '#EAECEF',
            text2: '#9AA4B2',
            accent: '#4DA3FF',
            border: 'rgba(255, 255, 255, 0.15)',
        },
    },
    B: {
        name: 'Warm Gold',
        colors: {
            bg: '#0B0A08',
            card: '#13110D',
            text: '#F2EEE7',
            text2: '#A9A39A',
            accent: '#D6B25E',
            border: 'rgba(214, 178, 94, 0.1)',
        },
    },
    C: {
        name: 'Light Clean',
        colors: {
            bg: '#F6F7F9',
            card: '#FFFFFF',
            text: '#0B1220',
            text2: '#5B6472',
            accent: '#2563EB',
            border: 'rgba(0, 0, 0, 0.05)',
        },
    },
};

export type ThemeKey = keyof typeof themes;

export const setThemeVariables = (themeKey: ThemeKey) => {
    const theme = themes[themeKey];
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--theme-${key}`, value);
    });
    root.setAttribute('data-theme', themeKey);
};
