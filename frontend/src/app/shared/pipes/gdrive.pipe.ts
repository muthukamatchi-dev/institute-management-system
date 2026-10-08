import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GoogleDriveService } from '../../services/gdrive.service';

@Pipe({
  name: 'gdriveImage',
  standalone: true
})
export class GDriveImagePipe implements PipeTransform {
  constructor(private gdriveService: GoogleDriveService) {}

  transform(urlOrId: string | null | undefined, fallback: string = ''): string {
    if (!urlOrId) return fallback;
    const directUrl = this.gdriveService.getDirectImageUrl(urlOrId);
    return directUrl || fallback;
  }
}

@Pipe({
  name: 'gdriveEmbed',
  standalone: true
})
export class GDriveEmbedPipe implements PipeTransform {
  constructor(
    private gdriveService: GoogleDriveService,
    private sanitizer: DomSanitizer
  ) {}

  transform(urlOrId: string | null | undefined): SafeResourceUrl {
    if (!urlOrId) return '';
    const embedUrl = this.gdriveService.getEmbedUrl(urlOrId);
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }
}

