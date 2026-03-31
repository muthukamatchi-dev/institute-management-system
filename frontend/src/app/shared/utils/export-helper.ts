import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export class ExportHelper {
  static async addPDFHeader(doc: jsPDF, settings: any, title: string) {
    const instituteName = settings?.institute_name || 'Academy Name';
    const address = settings?.address || '';
    const phone = settings?.phone || '';
    const email = settings?.email || '';
    const logoUrl = settings?.logo_path ? `http://localhost:8081/${settings.logo_path}` : null;

    let currentY = 15;
    const startX = 14;
    const contentStartX = logoUrl ? 45 : 14; 

    // Logo (if exists) - Left Side
    if (logoUrl) {
      try {
        const logoData = await this.getBase64Image(logoUrl);
        doc.addImage(logoData, 'PNG', startX, currentY, 25, 25);
      } catch (e) {
        console.error('Failed to load logo for PDF:', e);
      }
    }

    // Institute Name - Right Side of Logo
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246); // Primary Color
    doc.text(instituteName, contentStartX, currentY + 10);
    
    // Details - Right Side of Logo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-400
    
    if (address) {
        doc.text(address, contentStartX, currentY + 16);
    }
    
    const contactInfo = [email, phone].filter(Boolean).join('  |  ');
    if (contactInfo) {
        doc.text(contactInfo, contentStartX, currentY + 22);
    }

    currentY += 32;

    // Divider Line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(14, currentY, 196, currentY);
    currentY += 12;

    // Report Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(title.toUpperCase(), 14, currentY);
    
    return currentY + 10; 
  }

  private static getBase64Image(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  }

  static addExcelHeader(data: any[], settings: any, title: string) {
    const instituteName = settings?.institute_name || 'Elite Tech Academy';
    const address = settings?.address || '';
    const email = settings?.email || '';
    const phone = settings?.phone || '';

    const headerRows = [
      [instituteName],
      [address],
      [`Email: ${email} | Phone: ${phone}`],
      [title],
      ['Generated: ' + new Date().toLocaleString()],
      [] // Gap
    ];

    // Convert JSON data to array of arrays
    const dataRows = data.length > 0 ? [Object.keys(data[0]), ...data.map(obj => Object.values(obj))] : [];
    const finalData = [...headerRows, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(finalData);

    // Merge columns for header rows
    const colCount = dataRows.length > 0 ? dataRows[0].length : 10;
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, colCount - 1) } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(0, colCount - 1) } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: Math.max(0, colCount - 1) } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: Math.max(0, colCount - 1) } }
    ];

    return ws;
  }
}
