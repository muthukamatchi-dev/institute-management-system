import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Staff } from '../../models';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { Observable, firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastService } from '../../services/toast.service';

import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { ViewChild } from '@angular/core';
import { ExportHelper } from '../../shared/utils/export-helper';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, ModalComponent, CustomFieldsRendererComponent],
  templateUrl: 'staff-list.component.html'
})
export class StaffListComponent implements OnInit {
  @ViewChild(CustomFieldsRendererComponent) customFieldsRenderer!: CustomFieldsRendererComponent;
  staffList: Staff[] = [];
  searchTerm: string = '';
  filterStatus: string = '';
  isModalOpen = false;
  isStaffIdManual = false;
  nextStaffId = '';
  isDetailsModalOpen = false;
  selectedStaffDetails: any = null;

  isImportModalOpen = false;
  isGuidanceOpen = false;
  importFile: File | null = null;
  customFields: any[] = [];
  settings: any;

  newStaff: Partial<Staff> = this.getInitialStaff();

  constructor(private dataService: DataService, private toastService: ToastService) { }

  ngOnInit() {
    this.loadStaff();
    this.dataService.getSettings().subscribe(s => this.settings = s);
    this.dataService.getCustomFields('staff').subscribe(fields => {
      this.customFields = fields;
    });
  }

  getInitialStaff(): Partial<Staff> {
    return {
      name: '',
      email: '',
      mobile: '',
      qualification: '',
      experience: '',
      designation: '',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active',
      staff_id: '',
      salary: 0,
      photo: ''
    };
  }

  loadStaff() {
    this.dataService.getStaff().subscribe(res => {
      // Filter out administrators from the staff management table
      this.staffList = res.filter(s => !s.staff_id?.startsWith('ADM'));
    });
  }

  filteredStaff() {
    const search = this.searchTerm.toLowerCase();
    return this.staffList.filter(s => {
      const matchesSearch = (s.name || '').toLowerCase().includes(search) ||
        (s.mobile || '').includes(search) ||
        (s.designation || '').toLowerCase().includes(search);
      const matchesStatus = this.filterStatus ? s.status === this.filterStatus : true;
      return matchesSearch && matchesStatus;
    });
  }

  openAddModal() {
    this.newStaff = this.getInitialStaff();

    this.dataService.getSettings().subscribe(s => {
      this.isStaffIdManual = (s.staff_id_mode === 'manual');
      if (!this.isStaffIdManual) {
        this.dataService.getNextStaffId().subscribe(res => {
          this.nextStaffId = res.next;
          this.newStaff.staff_id = res.next;
        });
      }
    });

    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  editStaff(staff: Staff) {
    this.newStaff = { ...staff };
    this.isModalOpen = true;
  }

  deleteStaff(id: string) {
    if (confirm('Are you sure you want to delete this staff member?')) {
      this.dataService.deleteStaff(id).subscribe(() => {
        this.loadStaff();
        this.toastService.success('Staff record deleted');
      });
    }
  }

  saveStaff() {
    if (this.customFieldsRenderer && !this.customFieldsRenderer.isValid()) {
      this.toastService.warning('Please fill all required custom fields.');
      return;
    }

    // Merge custom fields
    if (this.customFieldsRenderer) {
      (this.newStaff as any).custom_fields = this.customFieldsRenderer.getValues();
    }

    this.dataService.addStaff(this.newStaff).subscribe({
      next: () => {
        this.loadStaff();
        this.toastService.success(this.newStaff.id ? 'Staff record updated' : 'New staff member added');
        this.closeModal();
      },
      error: (err) => this.toastService.error('Error saving staff member: ' + (err.error?.message || 'Please try again.'))
    });
  }

  // --- Import / Export ---
  exportToExcel() {
    const rawData = this.filteredStaff().map(s => ({
      'Staff ID': s.staff_id,
      'Name': s.name,
      'Email': s.email,
      'Mobile': s.mobile,
      'Designation': s.designation,
      'Qualification': s.qualification,
      'Experience': s.experience,
      'Joining Date': s.joiningDate,
      'Salary': s.salary,
      'Status': s.status
    }));
    const ws = ExportHelper.addExcelHeader(rawData, this.settings, 'STAFF LIST REPORT');
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'StaffMembers');
    XLSX.writeFile(wb, 'Staff_List.xlsx');
  }

  async exportToPDF() {
    const doc = new jsPDF() as any;
    const data = this.filteredStaff().map(s => [
      String(s.staff_id || '-'),
      String(s.name || ''),
      String(s.mobile || ''),
      String(s.designation || ''),
      String(s.joiningDate || '')
    ]);

    const startY = await ExportHelper.addPDFHeader(doc, this.settings, 'STAFF LIST REPORT');

    autoTable(doc, {
      startY: startY,
      head: [['Staff ID', 'Name', 'Mobile', 'Designation', 'Joined']],
      body: data,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save('Staff_List.pdf');
  }

  triggerImport() {
    this.isImportModalOpen = true;
    this.importFile = null;
  }

  onFileChange(event: any) {
    this.importFile = event.target.files[0];
  }

  async processImport() {
    if (!this.importFile) {
      this.toastService.warning('Please select a file first.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      if (data.length === 0) {
        this.toastService.warning('The uploaded file is empty.');
        return;
      }

      if (confirm(`Detected ${data.length} staff records. Proceed with sequential import?`)) {
        let imported = 0;
        for (const row of data) {
          const staff: Partial<Staff> = {
            staff_id: row['Staff ID'] || row['id'] || '',
            name: row['Name'] || row['name'] || '',
            email: row['Email'] || row['email'] || '',
            mobile: row['Mobile'] || String(row['mobile'] || ''),
            qualification: row['Qualification'] || row['qualification'] || '',
            experience: row['Experience'] || row['experience'] || '',
            designation: row['Designation'] || row['designation'] || '',
            joiningDate: row['Joining Date'] || row['joining_date'] || new Date().toISOString().split('T')[0],
            salary: Number(row['Salary'] || row['salary'] || 0),
            status: (row['Status'] || row['status'] || 'active').toLowerCase()
          };

          // Map Custom Fields
          const customValues: any = {};
          this.customFields.forEach(cf => {
            if (row[cf.label] !== undefined) {
              customValues[cf.id] = row[cf.label];
            }
          });
          if (Object.keys(customValues).length > 0) {
            (staff as any).custom_fields = customValues;
          }

          if (staff.name && staff.mobile) {
            try {
              await firstValueFrom(this.dataService.addStaff(staff));
              imported++;
            } catch (err) {
              console.error('Failed to import staff:', staff.name, err);
            }
          }
        }
        this.loadStaff();
        this.isImportModalOpen = false;
        if (imported > 0) {
          this.toastService.success(`${imported} staff records imported successfully.`);
        } else {
          this.toastService.error('No staff records were imported.');
        }
      }
    };
    reader.readAsBinaryString(this.importFile);
  }

  toggleGuidance() {
    this.isGuidanceOpen = !this.isGuidanceOpen;
  }

  onPhotoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.resizeAndCompressImage(file, 300, 300, 0.7)
        .then(base64 => {
          this.newStaff.photo = base64;
        })
        .catch(err => {
          this.toastService.error('Error processing photo');
          console.error(err);
        });
    }
  }

  removePhoto() {
    this.newStaff.photo = '';
  }

  resizeAndCompressImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
          } else {
            reject(new Error('Failed to get 2D context'));
          }
        };
        img.src = event.target.result;
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  viewStaffDetails(staff: any) {
    this.selectedStaffDetails = staff;
    this.isDetailsModalOpen = true;
  }

  closeDetailsModal() {
    this.selectedStaffDetails = null;
    this.isDetailsModalOpen = false;
  }

  getImageUrl(imagePath?: string): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
    const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${this.dataService.getServerUrl()}/${normalizedPath}`;
  }

  printIDCard() {
    const printContent = document.getElementById('staff-id-card');
    if (!printContent) return;
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const prtWindow = window.open(windowUrl, windowName, 'left=100,top=100,width=450,height=650');
    if (prtWindow) {
      prtWindow.document.write(`
        <html>
          <head>
            <title>Print ID Card</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { margin: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #0f172a; }
            </style>
          </head>
          <body>
            <div class="scale-110">
              ${printContent.outerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              }
            </script>
          </body>
        </html>
      `);
      prtWindow.document.close();
      prtWindow.focus();
    }
  }
}
