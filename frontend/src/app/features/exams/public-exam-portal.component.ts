import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ExamTimerComponent } from './shared/timer.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastService } from '../../services/toast.service';
import { BrandingHeaderComponent } from '../../shared/ui/branding-header.component';

import { ExportHelper } from '../../shared/utils/export-helper';
@Component({
    selector: 'app-public-exam-portal',
    standalone: true,
    imports: [CommonModule, FormsModule, ExamTimerComponent, BrandingHeaderComponent],
    templateUrl: './public-exam-portal.component.html'
})
export class PublicExamPortalComponent implements OnInit {
    examId: string | null = null;
    exam: any = null;
    participant: any = null;
    examAccess: 'internal' | 'external' = 'external';
    portalMode: 'exam' | 'results' = 'exam';
    assignmentAccessChecked = false;

    view: 'login' | 'instructions' | 'ongoing' | 'result' | 'stopped' = 'login';

    loginData = { email: '', password: '' };
    answers: any[] = [];
    currentQuestionIndex = 0;

    startTime: string = '';
    submissionResult: any = null;
    examType: 'internal' | 'external' = 'internal';
    instituteName = 'Secure Exam Portal';
    settings: any;
    reviewData: any = null;
    isReviewMode = false;

    constructor(
        private route: ActivatedRoute, 
        private router: Router, 
        private dataService: DataService, 
        private authService: AuthService,
        private toastService: ToastService
    ) { }

    ngOnInit() {
        this.examId = this.route.snapshot.paramMap.get('examId');
        this.examAccess = (this.route.snapshot.data['examAccess'] as 'internal' | 'external') || 'external';
        this.route.queryParamMap.subscribe(params => {
            this.portalMode = params.get('portal') === 'results' ? 'results' : 'exam';
        });
        if (this.examId) {
            this.loadExam();
        }

        // Check if internal user is already logged in (Student or Staff for testing)
        this.authService.currentUser.subscribe(user => {
            if (user) {
                if (this.examAccess === 'internal') {
                    this.participant = {
                        id: user.id,
                        name: user.name,
                        is_internal: user.role_name === 'student'
                    };
                }

                if (this.examAccess === 'internal' && this.assignmentAccessChecked && this.view === 'login') {
                    this.view = 'instructions';
                }
            } else if (this.examAccess === 'internal') {
                this.participant = null;
            }
        });

        this.dataService.getInstituteName().subscribe(res => {
            if (res && res.name) this.instituteName = res.name;
        });
        this.dataService.getSettings().subscribe(s => {
            this.settings = s;
        });
    }

    goToDashboard() {
        if (this.participant?.is_internal) {
            this.router.navigate(['/my-exams']);
        } else {
            this.participant = null;
            this.submissionResult = null;
            this.reviewData = null;
            this.isReviewMode = false;
            this.loginData = { email: '', password: '' };
            this.view = 'login';
            this.router.navigate(['/public/exam', this.examId], {
                queryParams: this.portalMode === 'results' ? { portal: 'results' } : {}
            });
        }
    }

    loadExam() {
        if (this.examAccess === 'internal') {
            if (!this.authService.getToken()) {
                this.toastService.error('Please log in as a student to access this internal exam.');
                this.router.navigate(['/login']);
                return;
            }

            this.dataService.getExam(this.examId!).subscribe({
                next: (res: any) => {
                    if (res && res.title) {
                        this.exam = res;
                        this.examType = 'internal';
                        if (this.exam.status === 'stopped') this.view = 'stopped';

                        this.validateInternalExamAccess();
                    } else {
                        this.toastService.error('Internal exam not found.');
                        this.router.navigate(['/my-exams']);
                    }
                },
                error: () => {
                    this.toastService.error('Failed to load internal exam.');
                    this.router.navigate(['/my-exams']);
                }
            });
        } else {
            this.tryLoadExternal();
        }
    }

    validateInternalExamAccess() {
        if (!this.examId) return;

        this.dataService.getAssignedExams().subscribe({
            next: (exams: any[]) => {
                const assignedExam = exams.find(ex => String(ex.id || ex.exam_id) === String(this.examId));
                this.assignmentAccessChecked = true;

                if (!assignedExam) {
                    this.toastService.error('This assessment is not assigned to you.');
                    this.router.navigate(['/my-exams']);
                    return;
                }

                if (!assignedExam.can_take) {
                    this.toastService.info('This assessment has already been submitted. It can only be reopened by staff reassignment.');
                    this.router.navigate(['/my-exams']);
                    return;
                }

                if (this.participant && this.view === 'login') {
                    this.view = 'instructions';
                }
            },
            error: () => {
                this.toastService.error('Unable to verify assessment access right now.');
                this.router.navigate(['/my-exams']);
            }
        });
    }

    tryLoadExternal() {
        this.dataService.getExternalExam(this.examId!).subscribe({
            next: (res: any) => {
                if (res && res.title) {
                    this.exam = res;
                    this.examType = 'external';
                    if (this.exam.status === 'stopped') this.view = 'stopped';

                    // Public external exams must always require candidate login.
                    // App login state (admin/staff/student) should not auto-enter this portal.
                    this.participant = null;
                    this.view = 'login';
                }
            },
            error: (err) => {
                console.error('Exam load fail:', err);
                this.toastService.error('Failed to load exam. Please check the URL.');
            }
        });
    }

    login() {
        this.dataService.externalLogin(this.examId, this.loginData.email, this.loginData.password).subscribe({
            next: (participant) => {
                if (!participant?.id) {
                    this.toastService.error('Candidate login data is incomplete. Please try again.');
                    return;
                }

                this.participant = { ...participant, is_internal: false };
                this.toastService.success(`Welcome, ${this.participant.name}`);

                if (this.participant.has_submitted) {
                    if (this.participant.results_published && this.participant.submission_id) {
                        this.dataService.getExternalSubmissionDetails(this.participant.submission_id).subscribe((subRes: any) => {
                            this.submissionResult = subRes.data;
                            this.view = 'result';
                        });
                    } else {
                        this.view = 'result'; // Will show "Verification Pending"
                    }
                } else if (this.portalMode === 'results') {
                    this.submissionResult = null;
                    this.toastService.info('No completed attempt was found for this login on the shared result portal.');
                    this.view = 'result';
                } else {
                    this.view = 'instructions';
                }
            },
            error: () => this.toastService.error('Invalid Credentials')
        });
    }

    viewReport() {
        if (!this.participant?.submission_id && !this.submissionResult?.id) return;
        const subId = this.participant?.submission_id || this.submissionResult?.id;
        this.dataService.getExternalSubmissionDetails(subId).subscribe((res: any) => {
            this.reviewData = res.data;
            this.isReviewMode = true;
        });
    }

    async exportPDF() {
        if (!this.reviewData) return;

        const doc = new jsPDF('p', 'mm', 'a4');
        const dark: [number, number, number] = [15, 23, 42]; // slate-900
        const primary: [number, number, number] = [59, 130, 246]; // primary-500

        // Institutional Branding Header
        const startY = await ExportHelper.addPDFHeader(doc, this.settings, "OFFICIAL EXAMINATION TRANSCRIPT");

        // Candidate Section
        doc.setTextColor(dark[0], dark[1], dark[2]);
        doc.setFontSize(10);
        doc.text("CANDIDATE LOG", 15, startY + 5);

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(this.reviewData.name.toUpperCase(), 15, startY + 15);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139); // slate-400
        doc.text(this.reviewData.email, 15, startY + 22);

        // Assessment Details Section
        doc.setTextColor(dark[0], dark[1], dark[2]);
        doc.setFontSize(10);
        doc.text("ASSESSMENT:", 15, startY + 35);
        doc.setFont("helvetica", "bolditalic");
        doc.text(this.reviewData.title, 50, startY + 35);

        doc.setFont("helvetica", "bold");
        doc.text("DATE:", 15, startY + 42);
        const examDate = this.reviewData.exam_date ? new Date(this.reviewData.exam_date).toLocaleDateString('en-GB').replace(/\//g, '-') : 'N/A';
        doc.setFont("helvetica", "normal");
        doc.text(examDate, 50, startY + 42);

        // Performance Box (Right)
        doc.setFillColor(248, 250, 252); // slate-50
        doc.roundedRect(130, startY + 5, 65, 40, 10, 10, 'F');

        doc.setTextColor(dark[0], dark[1], dark[2]);
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.text(`${this.reviewData.score}/${this.reviewData.total_marks}`, 162, startY + 25, { align: 'center' });

        const percentage = ((this.reviewData.score / this.reviewData.total_marks) * 100).toFixed(1) + '%';
        doc.setFontSize(10);
        doc.setTextColor(primary[0], primary[1], primary[2]);
        doc.text(`SCORE: ${percentage}`, 162, startY + 33, { align: 'center' });

        // Status Badge
        const passed = (this.reviewData.score / this.reviewData.total_marks) * 100 >= this.reviewData.pass_percentage;
        doc.setFillColor(passed ? 16 : 225, passed ? 185 : 29, passed ? 129 : 72); // Emerald or Rose
        doc.roundedRect(145, startY + 36, 35, 6, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(passed ? "STATUS: PASSED" : "STATUS: FAILED", 162, startY + 40, { align: 'center' });

        // Response Table
        doc.setTextColor(dark[0], dark[1], dark[2]);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("RESPONSE VERIFICATION FEED", 15, startY + 60);

        const rows = this.reviewData.answers.map((ans: any, i: number) => [
            i + 1,
            ans.question_text,
            ans.answer_text || 'No Answer',
            `${ans.marks_obtained}/${ans.question_marks}`,
            ans.is_correct == 1 ? 'Correct' : 'Incorrect'
        ]);

        autoTable(doc, {
            head: [['#', 'QUESTION', 'YOUR RESPONSE', 'MARKS', 'RESULT']],
            body: rows,
            startY: startY + 68,
            theme: 'striped',
            headStyles: { fillColor: dark, textColor: 255, fontSize: 9, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 80 },
                2: { cellWidth: 50 },
                3: { cellWidth: 20 },
                4: { cellWidth: 25 }
            }
        });

        // Footer
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("This is an electronically generated transcript. No digital signature is required for validation.", 105, finalY, { align: 'center' });
        doc.text(`Generated on ${new Date().toLocaleString()}`, 105, finalY + 5, { align: 'center' });

        doc.save(`${this.reviewData.name}_Transcript_${this.reviewData.title}.pdf`);
        this.toastService.success('Transcript downloaded');
    }

    startExam() {
        this.startTime = new Date().toISOString();
        // Initialize answers array
        this.answers = this.exam.questions.map((q: any) => ({
            question_id: q.id,
            selected_option_id: null,
            answer_text: ''
        }));
        this.view = 'ongoing';
        this.toastService.info('Exam started. All the best!');
    }

    get currentQuestion() {
        return this.exam.questions[this.currentQuestionIndex];
    }

    prev() { if (this.currentQuestionIndex > 0) this.currentQuestionIndex--; }
    next() { if (this.currentQuestionIndex < this.exam.questions.length - 1) this.currentQuestionIndex++; }

    submit() {
        if (!this.startTime) this.startTime = new Date().toISOString();

        const payload: any = {
            exam_id: this.examId,
            answers: this.answers,
            start_time: this.startTime
        };

        if (this.participant?.is_internal) {
            payload.student_id = this.participant.id;
        } else if (this.participant?.id) {
            payload.participant_id = this.participant.id;
            // Also send as student_id if we are hitting internal endpoint to avoid PHP errors
            payload.student_id = this.participant.id;
        }

        const submissionCall = (this.examType === 'internal')
            ? this.dataService.submitInternalExam(payload)
            : this.dataService.submitExternalExam(payload);

        submissionCall.subscribe({
            next: (res: any) => {
                this.submissionResult = res.data || res;
                this.toastService.success('Exam submitted successfully!');

                if (this.examType === 'internal' && (this.participant?.is_internal || this.examAccess === 'internal')) {
                    setTimeout(() => this.router.navigate(['/my-exams']), 1200);
                    return;
                }

                this.view = 'result';
            },
            error: (err) => {
                console.error('Submission Error:', err);
                let msg = 'The server encountered an issue while processing your submission.';

                if (err.error?.message) {
                    msg = err.error.message;
                } else if (typeof err.error === 'string' && err.error.length > 0) {
                    // Extract title from HTML error if possible
                    const match = err.error.match(/<title>(.*?)<\/title>/);
                    msg = match ? `Server Error: ${match[1]}` : 'Server returned an HTML error page. Check console.';
                } else {
                    msg = `Network or Server Error (Status: ${err.status}): ${err.statusText}`;
                }

                this.toastService.error('Submission Error: ' + msg);
            }
        });
    }

    handleTimeUp() {
        this.toastService.warning('Time is up! Submitting automatically...');
        this.submit();
    }

    getImageUrl(imagePath: string | undefined): string {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        return `http://localhost:8081/${normalizedPath}`;
    }
}
