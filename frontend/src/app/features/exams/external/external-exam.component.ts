import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import { DataService } from '../../../services/data.service';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { QuestionBuilderComponent } from '../shared/question-builder.component';
import { CustomFieldsRendererComponent } from '../../../shared/ui/custom-fields-renderer.component';
import { ViewChild } from '@angular/core';
import { ToastService } from '../../../services/toast.service';
import { BrandingHeaderComponent } from '../../../shared/ui/branding-header.component';

@Component({
    selector: 'app-external-exam',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalComponent, BadgeComponent, QuestionBuilderComponent, CustomFieldsRendererComponent, BrandingHeaderComponent],
    templateUrl: './external-exam.component.html'
})
export class ExternalExamComponent implements OnInit {
    @ViewChild('examCustomFields') examCustomFields!: CustomFieldsRendererComponent;
    @ViewChild('inviteCustomFields') inviteCustomFields!: CustomFieldsRendererComponent;
    exams: any[] = [];
    courses: any[] = [];
    activeTab: 'exams' | 'submissions' = 'exams';
    allSubmissions: any[] = [];
    isModalOpen = false;
    isParticipantModalOpen = false;
    isPaperModalOpen = false;
    isResultsModalOpen = false;
    isParticipantsListModalOpen = false;
    isConductModalOpen = false;
    allowPerformanceExams = false;
    selectedExam: any = null;
    participants: any[] = [];
    settings: any;

    viewPaper(exam: any) {
        this.dataService.getExternalExam(exam.id).subscribe((res: any) => {
            this.selectedExam = res;
            this.isPaperModalOpen = true;
        });
    }

    results: any[] = [];

    viewResults(exam: any) {
        this.selectedExam = exam;
        this.dataService.getExternalSubmissions(exam.id).subscribe((res: any) => {
            // After evaluation, entries should show under results page only
            this.results = (res.data || []).filter((s: any) => s.is_evaluated == 1);
            this.isResultsModalOpen = true;
        });
    }

    togglePublish(exam: any) {
        const newStatus = exam.results_published === 1 ? 0 : 1;
        this.dataService.toggleExternalResults(exam.id, newStatus).subscribe(() => {
            exam.results_published = newStatus;
        });
    }

    viewSubmissionDetail(submission: any) {
        this.router.navigate(['/exams/external/results', submission.id]);
    }


    newExam: any = this.resetExam();
    newParticipant: any = { name: '', email: '', password: '' };
    activeSubmission: any = null;
    activeTaskIndex = 0;
    performanceMarks: any = {};

    // Filters
    filterSpecificDate: string = '';
    filterDateFrom: string = '';
    filterDateTo: string = '';
    useRange: boolean = false;
    createdSort: string = 'today';
    examSearchQuery: string = '';

    constructor(
        private dataService: DataService,
        private router: Router,
        private toastService: ToastService
    ) { }

    ngOnInit() {
        this.loadExams();
        this.loadAllSubmissions();
        this.loadCourses();
        this.dataService.getSettings().subscribe(s => {
            this.settings = s;
            this.allowPerformanceExams = s.allow_performance_exams == 1;
        });
    }

    loadAllSubmissions() {
        this.dataService.getExternalSubmissions().subscribe((res: any) => {
            // Only show unreviewed submissions in the real-time submissions tab
            this.allSubmissions = (res.data || []).filter((s: any) => s.is_evaluated != 1);
        });
    }

    resetExam(type: 'standard' | 'performance' = 'standard') {
        const now = new Date();
        const localDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        return {
            title: '',
            duration_minutes: type === 'performance' ? 0 : 60,
            pass_percentage: 40,
            status: 'draft',
            total_marks: 0,
            course_id: '',
            exam_date: localDate,
            exam_type: type,
            questions: []
        };
    }

    loadExams() {
        const filters: any = {};
        if (this.useRange) {
            if (this.filterDateFrom) filters.date_from = this.filterDateFrom;
            if (this.filterDateTo) filters.date_to = this.filterDateTo;
        } else {
            if (this.filterSpecificDate) filters.exam_date = this.filterSpecificDate;
        }

        if (this.examSearchQuery) {
            filters.q = this.examSearchQuery;
        }

        if (this.createdSort) {
            const range = this.getDateRangeForSort(this.createdSort);
            if (range) {
                filters.created_from = range.from;
                filters.created_to = range.to;
            }
        }

        this.dataService.getExternalExams(filters).subscribe((res: any[]) => {
            this.exams = res;
        });
    }

    private getDateRangeForSort(sort: string) {
        const now = new Date();
        let from = new Date();
        let to = new Date();

        switch (sort) {
            case 'today':
                break;
            case 'yesterday':
                from.setDate(now.getDate() - 1);
                to.setDate(now.getDate() - 1);
                break;
            case 'this_week':
                from.setDate(now.getDate() - now.getDay());
                break;
            case 'last_week':
                from.setDate(now.getDate() - now.getDay() - 7);
                to.setDate(now.getDate() - now.getDay() - 1);
                break;
            case 'this_month':
                from = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'last_month':
                from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                to = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'this_quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                from = new Date(now.getFullYear(), quarter * 3, 1);
                break;
            case 'this_year':
                from = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return null;
        }
        return { 
            from: from.toLocaleDateString('sv-SE'), 
            to: to.toLocaleDateString('sv-SE') 
        };
    }

    loadCourses() {
        this.dataService.getCourses().subscribe((res: any) => {
            this.courses = res;
        });
    }
    applyFilters() {
        this.loadExams();
    }

    changeDate(days: number) {
        let current = this.filterSpecificDate || new Date().toLocaleDateString('sv-SE');
        const d = new Date(current);
        d.setDate(d.getDate() + days);
        this.filterSpecificDate = d.toLocaleDateString('sv-SE');
        this.loadExams();
    }

    canModify(exam: any): boolean {
        if (!exam.exam_date) return true;
        return exam.exam_date === new Date().toLocaleDateString('sv-SE');
    }

    openCreateModal(type: 'standard' | 'performance' = 'standard') {
        this.selectedExam = null;
        this.newExam = this.resetExam(type);
        this.isModalOpen = true;
    }

    editExam(exam: any) {
        this.selectedExam = exam;
        this.dataService.getExternalExam(exam.id).subscribe((res: any) => {
            this.newExam = {
                id: res.id,
                title: res.title,
                duration_minutes: res.duration_minutes,
                pass_percentage: res.pass_percentage || 40,
                status: res.status,
                course_id: res.course_id || '',
                total_marks: res.total_marks,
                description: res.description,
                exam_date: res.exam_date,
                exam_type: res.exam_type || 'standard',
                questions: res.questions || []
            };
            this.isModalOpen = true;
        });
    }

    deleteExam(id: string) {
        if (confirm('Are you sure you want to delete this external assessment?')) {
            this.dataService.deleteExam(id, 'external').subscribe(() => {
                this.loadExams();
                this.toastService.success('Assessment deleted successfully');
            });
        }
    }

    onQuestionAdded(q: any) {
        this.newExam.questions.push(q);
        this.calculateTotalMarks();
    }

    onQuestionUpdated(event: any) {
        this.newExam.questions[event.index] = event.question;
        this.calculateTotalMarks();
    }

    removeQuestion(index: number) {
        this.newExam.questions.splice(index, 1);
        this.calculateTotalMarks();
    }

    calculateTotalMarks() {
        this.newExam.total_marks = this.newExam.questions.reduce((acc: number, q: any) => acc + q.marks, 0);
    }

    saveExam() {
        if (this.examCustomFields && !this.examCustomFields.isValid()) {
            this.toastService.warning('Please fill all required custom fields.');
            return;
        }

        if (!this.newExam.title) {
            this.toastService.warning('Please provide an assessment title.');
            return;
        }

        // Merge custom fields
        if (this.examCustomFields) {
            this.newExam.custom_fields = this.examCustomFields.getValues();
        }

        if (!this.newExam.id && (!this.newExam.questions || this.newExam.questions.length === 0)) {
            this.toastService.warning('Please add at least one task or question to the strategy.');
            return;
        }

        this.calculateTotalMarks();

        this.dataService.saveExternalExam(this.newExam).subscribe({
            next: (res: any) => {
                this.isModalOpen = false;
                this.loadExams();
                this.toastService.success(this.newExam.id ? 'Assessment updated successfully' : 'New assessment created successfully');
                this.newExam = this.resetExam();
                this.selectedExam = null;
            },
            error: (err: any) => {
                console.error('Save error:', err);
                this.toastService.error('An error occurred while saving the assessment.');
            }
        });
    }

    openParticipantModal(exam: any) {
        this.selectedExam = exam;
        this.newParticipant = { name: '', email: '', password: '', exam_id: exam.id };
        this.isParticipantModalOpen = true;
    }

    saveParticipant() {
        if (this.inviteCustomFields && !this.inviteCustomFields.isValid()) {
            this.toastService.warning('Please fill all required custom fields.');
            return;
        }

        if (!this.newParticipant.name || !this.newParticipant.email || !this.newParticipant.password) {
            this.toastService.warning('Please fill all required fields.');
            return;
        }

        // Merge custom fields
        if (this.inviteCustomFields) {
            this.newParticipant.custom_fields = this.inviteCustomFields.getValues();
        }

        this.dataService.saveExternalParticipant(this.newParticipant).subscribe({
            next: (res: any) => {
                this.toastService.success('Candidate login details created successfully!');
                this.isParticipantModalOpen = false;
                if (this.selectedExam) {
                    this.openParticipantsListModal(this.selectedExam);
                }
            },
            error: (err) => {
                console.error('Save error:', err);
                const msg = err.error?.message || 'Failed to save candidate. Please check if email is already in use.';
                this.toastService.error(msg);
            }
        });
    }

    openParticipantsListModal(exam: any) {
        this.selectedExam = exam;
        this.dataService.getExternalParticipants(exam.id).subscribe((res: any) => {
            this.participants = res.data;
            this.isParticipantsListModalOpen = true;
        });
    }

    onFileChange(event: any) {
        const target: DataTransfer = <DataTransfer>(event.target);
        if (target.files.length !== 1) return;

        const reader: FileReader = new FileReader();
        reader.onload = (e: any) => {
            const bstr: string = e.target.result;
            const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
            const wsname: string = wb.SheetNames[0];
            const ws: XLSX.WorkSheet = wb.Sheets[wsname];
            const data = <any[][]>XLSX.utils.sheet_to_json(ws, { header: 1 });

            // Processing rows: skip header
            const header = data[0];
            const rows = data.slice(1);

            const nameIdx = header.findIndex((h: any) => h.toLowerCase().includes('name'));
            const emailIdx = header.findIndex((h: any) => h.toLowerCase().includes('email'));
            const passIdx = header.findIndex((h: any) => h.toLowerCase().includes('password') || h.toLowerCase().includes('key'));
            const mobileIdx = header.findIndex((h: any) => h.toLowerCase().includes('mobile'));

            if (nameIdx === -1 || emailIdx === -1 || passIdx === -1) {
                this.toastService.error('Invalid file format. Ensure columns: Name, Email, Password');
                return;
            }

            const participantsBatch = rows.map(row => ({
                name: row[nameIdx],
                email: row[emailIdx],
                password: row[passIdx],
                mobile: mobileIdx !== -1 ? row[mobileIdx] : ''
            })).filter(p => p.name && p.email && p.password);

            if (participantsBatch.length === 0) {
                this.toastService.warning('No valid rows found in the excel file.');
                return;
            }

            if (confirm(`Import ${participantsBatch.length} candidates for ${this.selectedExam.title}?`)) {
                this.dataService.bulkSaveParticipants(this.selectedExam.id, participantsBatch).subscribe(() => {
                    this.toastService.success('Import completed successfully!');
                    this.openParticipantsListModal(this.selectedExam);
                });
            }
        };
        reader.readAsBinaryString(target.files[0]);
    }

    downloadTemplate() {
        const ws_data = [
            ['Name', 'Email', 'Password', 'Mobile'],
            ['John Doe', 'john@example.com', 'Pass@123', '9876543210'],
            ['Jane Smith', 'jane@example.com', 'Pass@456', '9876543211']
        ];
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Candidates');
        XLSX.writeFile(wb, 'candidate_import_template.xlsx');
    }

    getPublicLink(exam: any): string {
        const baseUrl = window.location.origin;
        return `${baseUrl}/#/public/exam/${exam.id}`;
    }

    copyLink(exam: any) {
        const link = this.getPublicLink(exam);
        navigator.clipboard.writeText(link);
        this.toastService.info('Public link copied to clipboard!');
    }

    getStatusType(status: string): any {
        return status === 'active' ? 'success' : status === 'stopped' ? 'danger' : 'neutral';
    }

    // --- PERFORMANCE CONDUCT ---
    openConductModal(exam: any) {
        this.dataService.getExternalExam(exam.id).subscribe((res: any) => {
            this.selectedExam = res;
            this.dataService.getExternalParticipants(exam.id).subscribe((participants: any) => {
                this.participants = participants.data;
                this.isConductModalOpen = true;
                this.activeSubmission = null; // Reset
            });
        });
    }

    startEvaluation(candidate: any) {
        this.activeSubmission = {
            student_id: candidate.id, // Using same property name for candidate
            student_name: candidate.name,
            reg_number: candidate.email, // Email acts as reg number for guest
            exam_id: this.selectedExam.id,
            total_marks: this.selectedExam.total_marks,
            pass_percentage: this.selectedExam.pass_percentage,
            tasks: JSON.parse(JSON.stringify(this.selectedExam.questions || []))
        };
        this.activeTaskIndex = 0;
        this.performanceMarks = {};
    }

    nextTask() {
        if (this.activeTaskIndex < this.activeSubmission.tasks.length - 1) {
            this.activeTaskIndex++;
        }
    }

    prevTask() {
        if (this.activeTaskIndex > 0) {
            this.activeTaskIndex--;
        }
    }

    savePerformance() {
        const totalObtained = this.activeSubmission.tasks.reduce((acc: number, t: any) => 
            acc + (Number(this.performanceMarks[t.id]) || 0), 0);

        const payload = {
            exam_id: this.activeSubmission.exam_id,
            participant_id: this.activeSubmission.student_id, // Map candidate ID correctly for backend
            evaluations: this.activeSubmission.tasks.map((t: any) => ({
                question_id: t.id,
                marks_obtained: Number(this.performanceMarks[t.id]) || 0,
                remarks: t.remarks || ''
            }))
        };

        this.dataService.savePerformanceSubmission(payload).subscribe(() => {
            this.toastService.success(`Evaluation finalized for ${this.activeSubmission.student_name}. Score: ${totalObtained}/${this.selectedExam.total_marks}`);
            this.activeSubmission = null;
            this.openConductModal(this.selectedExam);
        });
    }
}
