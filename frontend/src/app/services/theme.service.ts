import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private currentTheme = 'blue';
    private currentMode = 'light';

    constructor() {
        const savedTheme = localStorage.getItem('theme');
        const savedMode = localStorage.getItem('themeMode');
        if (savedTheme) this.setTheme(savedTheme, false);
        if (savedMode) this.setMode(savedMode, false);
    }

    setTheme(theme: string, save = true) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        if (save) localStorage.setItem('theme', theme);
    }

    setMode(mode: string, save = true) {
        this.currentMode = mode;
        if (mode === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        if (save) localStorage.setItem('themeMode', mode);
    }

    applySettings(settings: any) {
        const appearanceColor = settings?.appearance_color ?? settings?.appearanceColor;
        const appearanceMode = settings?.appearance_mode ?? settings?.appearanceMode;

        if (appearanceColor) {
            this.setTheme(this.mapColorToTheme(appearanceColor));
        }
        if (appearanceMode) {
            this.setMode(appearanceMode);
        }
    }

    private mapColorToTheme(color: string): string {
        const map: any = {
            '#3b82f6': 'blue',
            '#8b5cf6': 'purple',
            '#10b981': 'green',
            '#f43f5e': 'rose',
            '#f59e0b': 'amber'
        };
        return map[color] || 'blue';
    }
}
