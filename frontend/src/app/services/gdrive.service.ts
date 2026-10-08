import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GoogleDriveService {

  constructor() { }

  /**
   * Extract Google Drive File or Folder ID from various URL formats
   */
  extractId(url: string | null | undefined): string | null {
    if (!url) return null;
    const cleanUrl = url.trim();

    // 1. Check folder pattern: /folders/ID
    const folderMatch = cleanUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch && folderMatch[1]) return folderMatch[1];

    // 2. Check file pattern: /file/d/ID
    const fileMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch && fileMatch[1]) return fileMatch[1];

    // 3. Check lh3.googleusercontent.com/d/ID pattern (direct image URL)
    const lh3Match = cleanUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
    if (lh3Match && lh3Match[1]) return lh3Match[1];

    // 4. Check id parameter: id=ID (e.g. drive.google.com/uc?export=download&id=FILE_ID)
    const paramMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (paramMatch && paramMatch[1]) return paramMatch[1];

    // 5. Check if raw ID (e.g. 15 to 100 character alphanumeric string)
    if (/^[a-zA-Z0-9_-]{15,100}$/.test(cleanUrl)) {
      return cleanUrl;
    }

    return null;
  }

  /**
   * Returns a direct image URL for <img> tags
   */
  getDirectImageUrl(urlOrId: string | null | undefined): string {
    if (!urlOrId) return '';
    const clean = urlOrId.trim();

    // Data URI (base64 preview)
    if (clean.startsWith('data:image')) {
      return clean;
    }

    // Local file path from backend
    if (clean.startsWith('uploads/') || clean.startsWith('/uploads/')) {
      const normalized = clean.startsWith('/') ? clean.slice(1) : clean;
      return `http://localhost:8081/${normalized}`;
    }

    // Normal http(s) URL that is NOT Google Drive
    if (clean.startsWith('http') && !clean.includes('drive.google.com') && !clean.includes('googleusercontent.com')) {
      return clean;
    }

    const id = this.extractId(clean);
    if (id && !id.startsWith('gdrive_')) {
      // lh3.googleusercontent.com/d/ID serves direct high quality image stream
      return `https://lh3.googleusercontent.com/d/${id}`;
    }
    return clean;
  }

  /**
   * Returns a fallback image thumbnail URL
   */
  getThumbnailUrl(urlOrId: string | null | undefined, width = 1000): string {
    if (!urlOrId) return '';
    const clean = urlOrId.trim();
    const id = this.extractId(clean);
    if (id) {
      return `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;
    }
    return clean;
  }

  /**
   * Returns an embed URL suitable for iframes (files or folders)
   */
  getEmbedUrl(urlOrId: string | null | undefined): string {
    if (!urlOrId) return '';
    const clean = urlOrId.trim();
    const id = this.extractId(clean);

    if (clean.includes('/folders/') || (clean.toLowerCase().includes('folder') && id)) {
      return `https://drive.google.com/embeddedfolderview?id=${id}#list`;
    }
    if (id) {
      return `https://drive.google.com/file/d/${id}/preview`;
    }
    return clean;
  }

  /**
   * Check if a string is a valid Google Drive URL or ID
   */
  isGoogleDriveUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    return url.includes('drive.google.com') || url.includes('googleusercontent.com') || !!this.extractId(url);
  }
}
