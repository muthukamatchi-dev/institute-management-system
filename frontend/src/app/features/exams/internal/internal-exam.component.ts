import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { QuestionBuilderComponent } from '../shared/question-builder.component';
import { ToastService } from '../../../services/toast.service';
import { CustomFieldsRendererComponent } from '../../../shared/ui/custom-fields-renderer.component';
import { BrandingHeaderComponent } from '../../../shared/ui/branding-header.component';

@Component({
    selector: 'app-internal-exam',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalComponent, BadgeComponent, QuestionBuilderComponent, CustomFieldsRendererComponent, BrandingHeaderComponent],
    templateUrl: './internal-exam.component.html'
})
export class InternalExamComponent implements OnInit {
    @ViewChild(CustomFieldsRendererComponent) customFieldsRenderer!: CustomFieldsRendererComponent;
    exams: any[] = [];
    students: any[] = [];
    courses: any[] = [];

    // Modals
    isModalOpen = false;
    isAssignModalOpen = false;
    isEvaluationModalOpen = false;
    isPaperModalOpen = false;
    isResultsModalOpen = false;
    isResultsListModalOpen = false;
    isConductModalOpen = false;
    allowPerformanceExams = false;

    selectedExam: any = null;
    selectedStudentIds: string[] = [];
    studentSearchQuery = '';
    submissions: any[] = [];
    results: any[] = [];
    activeSubmission: any = null;
    activeReport: any = null;

    newExam: any = {};
    activeTab: 'exams' | 'evaluations' = 'exams';
    allSubmissions: any[] = [];
    submissionSearchQuery = '';
    activeTaskIndex = 0;
    performanceMarks: any = {};
    settings: any;

    // View Pending Logic
    pendingAssignments: any[] = [];
    resultsView: 'graded' | 'pending' = 'graded';
    assignTab: 'unassigned' | 'assigned' = 'unassigned';

    // Filters
    filterSpecificDate: string = '';
    filterDateFrom: string = '';
    filterDateTo: string = '';
    useRange: boolean = false;
    createdSort: string = 'today';
    examSearchQuery: string = '';

    get filteredSubmissions() {
        if (!this.submissionSearchQuery.trim()) return this.allSubmissions;
        const query = this.submissionSearchQuery.toLowerCase().trim();
        return this.allSubmissions.filter(s =>
            s.student_name?.toLowerCase().includes(query) ||
            s.reg_number?.toLowerCase().includes(query) ||
            s.exam_title?.toLowerCase().includes(query)
        );
    }

    get filteredStudents() {
        let list = this.students;

        // Filter by Course of the selected exam and Assigned status if in Assign modal
        if (this.isAssignModalOpen && this.selectedExam) {
            const examCourseId = this.selectedExam.course_id || this.selectedExam.courseId;
            if (examCourseId) {
                list = list.filter(s => s.courseId == examCourseId);
            }

            const assignedIds = this.selectedExam.assigned_student_ids || [];
            if (this.assignTab === 'assigned') {
                list = list.filter(s => assignedIds.includes(Number(s.id)));
            } else {
                list = list.filter(s => !assignedIds.includes(Number(s.id)));
            }
        }

        if (!this.studentSearchQuery.trim()) return list;
        const query = this.studentSearchQuery.toLowerCase().trim();
        return list.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.regNumber?.toLowerCase().includes(query) ||
            s.batchName?.toLowerCase().includes(query)
        );
    }

    constructor(private dataService: DataService, private toastService: ToastService) {
        this.newExam = this.resetExam();
    }

    ngOnInit() {
        this.loadExams();
        this.loadStudents();
        this.loadCourses();
        this.dataService.getSettings().subscribe(s => {
            this.settings = s;
            this.allowPerformanceExams = s.allow_performance_exams == 1;
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

        this.dataService.getInternalExams(filters).subscribe((res: any[]) => this.exams = res);
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
        const today = new Date().toLocaleDateString('sv-SE');
        return exam.exam_date >= today;
    }

    loadStudents() {
        this.dataService.getStudents().subscribe((res: any[]) => {
            this.students = res.filter((s: any) => s.status !== 'completed');
        });
    }

    loadCourses() {
        this.dataService.getCourses().subscribe((res: any) => {
            this.courses = res;
        });
    }

    viewPaper(exam: any) {
        this.dataService.getExam(exam.id).subscribe((res: any) => {
            this.selectedExam = res;
            this.isPaperModalOpen = true;
        });
    }

    openCreateModal(type: 'standard' | 'performance' = 'standard') {
        this.selectedExam = null;
        this.newExam = this.resetExam(type);
        this.isModalOpen = true;
    }

    editExam(exam: any) {
        this.selectedExam = exam;
        this.dataService.getExam(exam.id).subscribe((res: any) => {
            this.newExam = {
                id: res.id,
                title: res.title,
                duration_minutes: res.duration_minutes,
                pass_percentage: res.pass_percentage || 40,
                status: res.status,
                total_marks: res.total_marks,
                course_id: res.course_id || '',
                exam_date: res.exam_date,
                exam_type: res.exam_type || 'standard',
                questions: res.questions || []
            };
            this.calculateTotalMarks();
            this.isModalOpen = true;
        });
    }

    deleteExam(id: string) {
        if (confirm('Are you sure you want to delete this assessment?')) {
            this.dataService.deleteExam(id, 'internal').subscribe(() => {
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
        this.newExam.total_marks = this.newExam.questions.reduce((acc: number, q: any) => acc + (Number(q.marks) || 0), 0);
    }

    saveExam() {
        if (this.customFieldsRenderer && !this.customFieldsRenderer.isValid()) {
            this.toastService.warning('Please fill all required custom fields.');
            return;
        }
        if (!this.newExam.title) {
            this.toastService.warning('Please provide an assessment title.');
            return;
        }
        if (this.customFieldsRenderer) {
            this.newExam.custom_fields = this.customFieldsRenderer.getValues();
        }
        if (!this.newExam.id && (!this.newExam.questions || this.newExam.questions.length === 0)) {
            this.toastService.warning('Please add at least one task or question to the strategy.');
            return;
        }
        this.calculateTotalMarks();
        this.dataService.saveInternalExam(this.newExam).subscribe({
            next: (res: any) => {
                this.isModalOpen = false;
                this.loadExams();
                this.toastService.success(this.newExam.id ? 'Assessment updated successfully' : 'New assessment created successfully');
                this.newExam = this.resetExam();
                this.selectedExam = null;
            },
            error: (err: any) => this.toastService.error('An error occurred while saving the assessment.')
        });
    }

    getStatusType(status: string): any {
        switch (status) {
            case 'active': return 'success';
            case 'archived': return 'danger';
            default: return 'neutral';
        }
    }

    openAssignModal(exam: any) {
        this.selectedExam = exam;
        this.selectedStudentIds = [];
        this.studentSearchQuery = '';
        this.assignTab = 'unassigned';
        this.isAssignModalOpen = true;
    }

    switchAssignTab(tab: 'unassigned' | 'assigned') {
        this.assignTab = tab;
    }

    toggleStudentSelection(id: string) {
        if (this.selectedStudentIds.includes(id)) {
            this.selectedStudentIds = this.selectedStudentIds.filter(sid => sid !== id);
        } else {
            this.selectedStudentIds.push(id);
        }
    }

    confirmAssignment() {
        this.dataService.assignExam(this.selectedExam.id, this.selectedStudentIds).subscribe((res: any) => {
            this.isAssignModalOpen = false;
            this.toastService.success(`Assignment successful for ${this.selectedStudentIds.length} candidate(s)`);
            this.loadExams(); // Refresh to update assigned_student_ids
        });
    }

    // closeToast can be removed if not used elsewhere, but let's see if it's called from template
    closeToast() {
    }

    viewResults(exam: any) {
        this.selectedExam = exam;
        this.resultsView = 'graded';
        this.dataService.getExamSubmissions(exam.id).subscribe((res: any[]) => {
            this.results = res.filter(s => s.status === 'evaluated');
            this.submissions = res.filter(s => s.status !== 'evaluated');
            this.dataService.getPendingAssignments(exam.id).subscribe((pending: any[]) => {
                this.pendingAssignments = pending;
                this.isResultsListModalOpen = true;
            });
        });
    }

    toggleResultsView(view: 'graded' | 'pending') {
        this.resultsView = view;
    }

    viewSubmissions(exam: any) {
        this.selectedExam = exam;
        this.dataService.getExamSubmissions(exam.id).subscribe((res: any[]) => {
            this.submissions = res.filter(s => s.status !== 'evaluated');
            this.isEvaluationModalOpen = true;
        });
    }

    switchTab(tab: 'exams' | 'evaluations') {
        this.activeTab = tab;
        if (tab === 'evaluations') {
            this.loadAllSubmissions();
        }
    }

    loadAllSubmissions() {
        this.dataService.getExamSubmissions('').subscribe((res: any[]) => {
            this.allSubmissions = res.filter(s => s.status !== 'evaluated');
        });
    }

    evaluate(submission: any) {
        this.dataService.getSubmissionDetails(submission.id).subscribe((res: any) => {
            this.activeReport = res;
            this.isEvaluationModalOpen = true;
        });
    }

    submitEvaluation() {
        const invalid = this.activeReport.answers.find((a: any) => 
            Number(a.marks_obtained) > (Number(a.question_marks) || 0) || Number(a.marks_obtained) < 0
        );

        if (invalid) {
            this.toastService.warning(`Marks for question "${invalid.question_text}" cannot exceed ${invalid.question_marks} or be less than 0.`);
            return;
        }

        const evaluations = this.activeReport.answers.map((a: any) => ({
            answer_id: a.id,
            marks: a.marks_obtained,
            is_correct: a.is_correct
        }));
        this.dataService.evaluateSubmission(this.activeReport.id, evaluations).subscribe((res: any) => {
            this.isEvaluationModalOpen = false;
            this.activeReport = null;
            this.toastService.success('Evaluation submitted successfully');
            if (this.activeTab === 'evaluations') {
                this.loadAllSubmissions();
            } else if (this.selectedExam) {
                this.viewSubmissions(this.selectedExam);
            }
        });
    }

    recalculateActiveReportTotal() {
        if (!this.activeReport) return;
        this.activeReport.total_score = this.activeReport.answers.reduce((acc: number, a: any) => 
            acc + (Number(a.marks_obtained) || 0), 0);
    }

    closeEvaluationModal() {
        this.isEvaluationModalOpen = false;
        this.activeReport = null;
    }

    reassign(result: any) {
        const studentName = result.student_name || 'this candidate';
        if (confirm(`Are you sure you want to reassign this assessment to ${studentName}? This will allow them to take the assessment again.`)) {
            this.dataService.reassignExam(result.exam_id, result.student_id).subscribe(() => {
                this.toastService.success('Assessment reassigned successfully');
                if (this.selectedExam) {
                    this.viewResults(this.selectedExam);
                }
            });
        }
    }

    openConductModal(exam: any) {
        this.dataService.getExam(exam.id).subscribe((res: any) => {
            this.selectedExam = res;
            this.dataService.getPendingAssignments(exam.id).subscribe((pending: any[]) => {
                this.pendingAssignments = pending;
                this.isConductModalOpen = true;
                this.activeSubmission = null;
            });
        });
    }

    startEvaluation(student: any) {
        this.activeSubmission = {
            student_id: student.student_id || student.id,
            student_name: student.student_name || student.name,
            reg_number: student.reg_number,
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
        const invalid = this.activeSubmission.tasks.find((t: any) => 
            (Number(this.performanceMarks[t.id]) || 0) > (Number(t.marks) || 0) || (Number(this.performanceMarks[t.id]) || 0) < 0
        );

        if (invalid) {
            this.toastService.warning(`Marks for task "${invalid.question_text}" cannot exceed ${invalid.marks} or be less than 0.`);
            return;
        }

        const totalObtained = this.activeSubmission.tasks.reduce((acc: number, t: any) => acc + (Number(this.performanceMarks[t.id]) || 0), 0);
        const payload = {
            exam_id: this.activeSubmission.exam_id,
            student_id: this.activeSubmission.student_id,
            evaluations: this.activeSubmission.tasks.map((t: any) => ({
                question_id: t.id,
                marks: Number(this.performanceMarks[t.id]) || 0,
                remarks: t.remarks || ''
            }))
        };
        this.dataService.savePerformanceSubmission(payload).subscribe(() => {
            const studentName = this.activeSubmission.student_name;
            this.activeSubmission = null;
            this.toastService.success(`Evaluation finalized for ${studentName}. Score: ${totalObtained}/${this.selectedExam.total_marks}`);
            if (this.activeTab === 'evaluations') {
                this.loadAllSubmissions();
            }
            this.openConductModal(this.selectedExam);
        });
    }
}
