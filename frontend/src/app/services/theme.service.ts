import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private currentTheme = 'blue';
    private currentMode = 'dark';

    constructor() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) this.setTheme(savedTheme, false);
        this.setMode('dark', true);
    }

    setTheme(theme: string, save = true) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        if (save) localStorage.setItem('theme', theme);
    }

    setMode(mode: string = 'dark', save = true) {
        this.currentMode = 'dark';
        document.documentElement.classList.add('dark');
        if (save) localStorage.setItem('themeMode', 'dark');
    }

    applySettings(settings: any) {
        const appearanceColor = settings?.appearance_color ?? settings?.appearanceColor;

        if (appearanceColor) {
            this.setTheme(this.mapColorToTheme(appearanceColor));
        }
        this.setMode('dark');
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
