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
import { DatePickerComponent } from '../../../shared/ui/date-picker.component';

@Component({
    selector: 'app-internal-exam',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalComponent, BadgeComponent, QuestionBuilderComponent, CustomFieldsRendererComponent, BrandingHeaderComponent, DatePickerComponent],
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
    createdSort: string = '';
    examSearchQuery: string = '';

    // Pagination
    currentPage: number = 1;
    pageSize: number = 10;
    totalElements: number = 0;
    totalPages: number = 1;
    loading: boolean = false;

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

    onCreatedSortChange() {
        if (this.createdSort !== 'custom') {
            this.filterSpecificDate = '';
            this.filterDateFrom = '';
            this.filterDateTo = '';
        }
        this.currentPage = 1;
        this.loadExams();
    }

    onSearchChange() {
        this.currentPage = 1;
        this.loadExams();
    }

    clearFilters() {
        this.filterSpecificDate = '';
        this.filterDateFrom = '';
        this.filterDateTo = '';
        this.createdSort = '';
        this.examSearchQuery = '';
        this.currentPage = 1;
        this.loadExams();
    }

    loadExams() {
        const filters: any = {
            page: this.currentPage - 1,
            size: this.pageSize
        };

        if (this.createdSort === 'custom') {
            if (this.useRange) {
                if (this.filterDateFrom) filters.date_from = this.filterDateFrom;
                if (this.filterDateTo) filters.date_to = this.filterDateTo;
            } else {
                if (this.filterSpecificDate) filters.exam_date = this.filterSpecificDate;
            }
        } else if (this.createdSort) {
            const range = this.getDateRangeForSort(this.createdSort);
            if (range) {
                filters.created_from = range.from;
                filters.created_to = range.to;
            }
        }

        if (this.examSearchQuery) {
            filters.q = this.examSearchQuery;
        }

        this.loading = true;
        this.dataService.getInternalExams(filters).subscribe({
            next: (res: any) => {
                if (res && res.content) {
                    this.exams = res.content;
                    this.totalElements = res.totalElements || 0;
                    this.totalPages = res.totalPages || 1;
                } else if (Array.isArray(res)) {
                    this.exams = res;
                    this.totalElements = res.length;
                    this.totalPages = Math.ceil(res.length / this.pageSize) || 1;
                } else {
                    this.exams = [];
                    this.totalElements = 0;
                    this.totalPages = 1;
                }
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            }
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

    applyFilters() {
        this.currentPage = 1;
        this.loadExams();
    }

    changeDate(days: number) {
        let current = this.filterSpecificDate || new Date().toLocaleDateString('sv-SE');
        const d = new Date(current);
        d.setDate(d.getDate() + days);
        this.filterSpecificDate = d.toLocaleDateString('sv-SE');
        this.currentPage = 1;
        this.loadExams();
    }

    getStartCount(): number {
        if (this.totalElements === 0) return 0;
        return (this.currentPage - 1) * this.pageSize + 1;
    }

    getEndCount(): number {
        return Math.min(this.currentPage * this.pageSize, this.totalElements);
    }

    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadExams();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadExams();
        }
    }

    goToPage(page: number) {
        if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
            this.currentPage = page;
            this.loadExams();
        }
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

    isSectionItem(q: any): boolean {
        if (!q) return false;
        if (q.is_section_title || q.is_section_break) return true;
        const type = (q.question_type || '').toLowerCase();
        if (type === 'section_header' || type === 'section_break' || type === 'section') return true;
        const text = (q.question_text || '').trim();
        const marks = Number(q.marks || q.question_marks || q.max_marks) || 0;
        if (marks === 0 && (
            /^section\b/i.test(text) || 
            /^part\b/i.test(text) || 
            /^[ivxlcdm]+\.\s*(answer|choose|fill|match)/i.test(text)
        )) {
            return true;
        }
        return false;
    }

    getQuestionNumberForList(questions: any[] | undefined, targetIndex: number): number {
        if (!questions) return 1;
        let count = 0;
        for (let i = 0; i <= targetIndex; i++) {
            const q = questions[i];
            if (q && !this.isSectionItem(q)) {
                count++;
            }
        }
        return count || 1;
    }

    isStaffInterventionQuestion(ans: any): boolean {
        if (!ans || this.isSectionItem(ans)) return false;
        const type = (ans.question_type || '').toLowerCase();
        return type === 'descriptive' || type === 'either_or' || type === 'text' || type === 'task';
    }

    isFillupQuestion(ans: any): boolean {
        if (!ans) return false;
        const type = (ans.question_type || '').toLowerCase();
        return type === 'fillups' || type === 'fill_in_the_blanks' || type === 'fill';
    }

    isFillupCorrect(ans: any): boolean {
        if (!ans) return false;
        const student = (ans.answer_text || '').trim().toLowerCase();
        const expected = (ans.correct_answer || '').trim().toLowerCase();
        return student.length > 0 && expected.length > 0 && student === expected;
    }

    isFullMarks(ans: any): boolean {
        if (!ans) return false;
        const maxMarks = Number(ans.question_marks) || Number(ans.max_marks) || 0;
        return maxMarks > 0 && Number(ans.marks_obtained) === maxMarks;
    }

    isZeroMarks(ans: any): boolean {
        if (!ans) return false;
        return Number(ans.marks_obtained) === 0;
    }

    isExactMarks(ans: any, val: number): boolean {
        if (!ans) return false;
        return Number(ans.marks_obtained) === Number(val);
    }

    setManualExactMarks(ans: any, marks: number) {
        const maxMarks = Number(ans.question_marks) || Number(ans.max_marks) || 0;
        let target = Number(marks) || 0;
        if (target < 0) target = 0;
        if (target > maxMarks) target = maxMarks;
        ans.marks_obtained = target;
        ans.marks_display = String(target);
        ans.is_correct = (maxMarks > 0 && target === maxMarks) ? 1 : (target > 0 ? 1 : 0);
        this.recalculateActiveReportTotal();
    }

    setManualGrade(ans: any, isCorrect: boolean) {
        const maxMarks = Number(ans.question_marks) || Number(ans.max_marks) || 0;
        this.setManualExactMarks(ans, isCorrect ? maxMarks : 0);
    }

    adjustMarks(ans: any, delta: number) {
        const maxMarks = Number(ans.question_marks) || Number(ans.max_marks) || 0;
        let current = Number(ans.marks_obtained) || 0;
        let next = Math.round((current + delta) * 10) / 10;
        if (next < 0) next = 0;
        if (next > maxMarks) next = maxMarks;
        ans.marks_obtained = next;
        ans.marks_display = String(next);
        ans.is_correct = (maxMarks > 0 && next === maxMarks) ? 1 : (next > 0 ? 1 : 0);
        this.recalculateActiveReportTotal();
    }

    parseFractionOrNumber(val: any): number {
        if (val === null || val === undefined || val === '') return 0;
        const str = String(val).trim();
        const mixedMatch = str.match(/^(\d+)\s*[\s\-\+]\s*(\d+)\/(\d+)$/);
        if (mixedMatch) {
            const whole = Number(mixedMatch[1]);
            const num = Number(mixedMatch[2]);
            const den = Number(mixedMatch[3]);
            if (den !== 0) return Math.round((whole + (num / den)) * 100) / 100;
        }
        const fracMatch = str.match(/^(\d+)\/(\d+)$/);
        if (fracMatch) {
            const num = Number(fracMatch[1]);
            const den = Number(fracMatch[2]);
            if (den !== 0) return Math.round((num / den) * 100) / 100;
        }
        const parsed = parseFloat(str.replace(',', '.'));
        return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
    }

    onMarksInput(ans: any) {
        const maxMarks = Number(ans.question_marks) || Number(ans.max_marks) || 0;
        let marks = this.parseFractionOrNumber(ans.marks_display);
        if (marks < 0) marks = 0;
        if (marks > maxMarks) marks = maxMarks;
        ans.marks_obtained = marks;
        ans.is_correct = (maxMarks > 0 && marks === maxMarks) ? 1 : (marks > 0 ? 1 : 0);
        this.recalculateActiveReportTotal();
    }

    onMarksBlur(ans: any) {
        this.onMarksInput(ans);
        ans.marks_display = String(ans.marks_obtained ?? 0);
    }

    onMarksChange(ans: any) {
        const maxMarks = Number(ans.question_marks) || Number(ans.max_marks) || 0;
        let marks = Number(ans.marks_obtained) || 0;
        if (marks < 0) marks = 0;
        if (marks > maxMarks) marks = maxMarks;
        ans.marks_obtained = marks;
        ans.marks_display = String(marks);
        ans.is_correct = (maxMarks > 0 && marks === maxMarks) ? 1 : (marks > 0 ? 1 : 0);
        this.recalculateActiveReportTotal();
    }

    moveExamQuestionUp(index: number) {
        if (index <= 0 || !this.newExam?.questions) return;
        const temp = this.newExam.questions[index];
        this.newExam.questions[index] = this.newExam.questions[index - 1];
        this.newExam.questions[index - 1] = temp;
    }

    moveExamQuestionDown(index: number) {
        if (!this.newExam?.questions || index >= this.newExam.questions.length - 1) return;
        const temp = this.newExam.questions[index];
        this.newExam.questions[index] = this.newExam.questions[index + 1];
        this.newExam.questions[index + 1] = temp;
    }

    getEitherOrA(q: any): string {
        if (!q) return '';
        if (q.question_a) return q.question_a;
        if (q.options && q.options.length > 0 && q.options[0]?.option_text) return q.options[0].option_text;
        if (q.question_text) {
            const parts = q.question_text.split(/\n?\(or\)\n?/i);
            return parts[0].replace(/^[Aa][\.\)]\s*/, '').trim();
        }
        return '';
    }

    getEitherOrB(q: any): string {
        if (!q) return '';
        if (q.question_b) return q.question_b;
        if (q.options && q.options.length > 1 && q.options[1]?.option_text) return q.options[1].option_text;
        if (q.question_text) {
            const parts = q.question_text.split(/\n?\(or\)\n?/i);
            if (parts.length > 1) return parts[1].replace(/^[Bb][\.\)]\s*/, '').trim();
        }
        return '';
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

    addSectionTitle() {
        if (!this.newExam.questions) {
            this.newExam.questions = [];
        }
        const newTitleItem = {
            is_section_title: true,
            question_type: 'section_header',
            question_text: 'I. ANSWER THE FOLLOWING :',
            marks: 0
        };
        this.newExam.questions.push(newTitleItem);
    }

    addSectionBreak() {
        if (!this.newExam.questions) {
            this.newExam.questions = [];
        }
        const nextSectionLabel = this.getNextSectionLabel();
        const newSectionItem = {
            is_section_break: true,
            is_section_title: true,
            question_type: 'section_break',
            question_text: `SECTION - ${nextSectionLabel}`,
            marks: 0
        };
        this.newExam.questions.push(newSectionItem);
    }

    getNextSectionLabel(): string {
        if (!this.newExam?.questions) return 'A';
        const sectionBreaks = this.newExam.questions.filter((q: any) => q.question_type === 'section_break' || q.is_section_break);
        const count = sectionBreaks.length;
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        return letters[count] || `${count + 1}`;
    }

    getQuestionsOnlyCount(): number {
        if (!this.newExam?.questions) return 0;
        return this.newExam.questions.filter((q: any) => !this.isSectionItem(q)).length;
    }

    calculateTotalMarks() {
        if (!this.newExam?.questions) {
            this.newExam.total_marks = 0;
            return;
        }
        this.newExam.total_marks = this.newExam.questions
            .filter((q: any) => !this.isSectionItem(q))
            .reduce((acc: number, q: any) => acc + (Number(q.marks) || 0), 0);
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
            if (this.activeReport && this.activeReport.answers) {
                this.activeReport.answers.forEach((ans: any) => {
                    if (this.isSectionItem(ans)) {
                        ans.marks_obtained = 0;
                        ans.is_correct = null;
                    } else if (this.isFillupQuestion(ans)) {
                        const correct = this.isFillupCorrect(ans);
                        ans.is_correct = correct ? 1 : 0;
                        const qMarks = Number(ans.question_marks) || Number(ans.max_marks) || 1;
                        ans.marks_obtained = correct ? qMarks : 0;
                    }
                    ans.marks_display = String(ans.marks_obtained != null ? ans.marks_obtained : 0);
                });
                this.recalculateActiveReportTotal();
            }
            this.isEvaluationModalOpen = true;
        });
    }

    submitEvaluation() {
        const invalid = this.activeReport?.answers?.find((a: any) =>
            !this.isSectionItem(a) && (Number(a.marks_obtained) > (Number(a.question_marks) || 0) || Number(a.marks_obtained) < 0)
        );

        if (invalid) {
            this.toastService.warning(`Marks for question "${invalid.question_text}" cannot exceed ${invalid.question_marks} or be less than 0.`);
            return;
        }

        const evaluations = this.activeReport.answers.map((a: any) => {
            if (this.isSectionItem(a)) {
                return { answer_id: a.id, marks: 0, is_correct: null };
            }
            if (this.isFillupQuestion(a)) {
                const correct = this.isFillupCorrect(a);
                const qMarks = Number(a.question_marks) || Number(a.max_marks) || 1;
                return { answer_id: a.id, marks: correct ? qMarks : 0, is_correct: correct ? 1 : 0 };
            }
            return {
                answer_id: a.id,
                marks: a.marks_obtained,
                is_correct: a.is_correct
            };
        });
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
            acc + (this.isSectionItem(a) ? 0 : (Number(a.marks_obtained) || 0)), 0);
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

    unassign(result: any) {
        const studentName = result.student_name || 'this candidate';
        if (confirm(`Remove this assessment assignment for ${studentName}? They will no longer see this exam in their My Exams section.`)) {
            this.dataService.unassignExam(result.exam_id, result.student_id).subscribe(() => {
                this.toastService.success('Assessment assignment removed');

                if (this.selectedExam?.assigned_student_ids) {
                    this.selectedExam.assigned_student_ids = this.selectedExam.assigned_student_ids
                        .filter((id: number) => String(id) !== String(result.student_id));
                }

                this.loadExams();
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
        const allQuestions = this.selectedExam.questions || [];
        let currentSection = '';
        const evaluatableTasks: any[] = [];
        for (const q of allQuestions) {
            if (this.isSectionItem(q)) {
                if (q.question_text) {
                    currentSection = q.question_text;
                }
            } else {
                evaluatableTasks.push({
                    ...JSON.parse(JSON.stringify(q)),
                    section_title: currentSection
                });
            }
        }

        this.activeSubmission = {
            student_id: student.student_id || student.id,
            student_name: student.student_name || student.name,
            reg_number: student.reg_number,
            exam_id: this.selectedExam.id,
            total_marks: this.selectedExam.total_marks,
            pass_percentage: this.selectedExam.pass_percentage,
            tasks: evaluatableTasks
        };
        this.activeTaskIndex = 0;
        this.performanceMarks = {};
    }

    validateCurrentTask(): boolean {
        if (!this.activeSubmission || !this.activeSubmission.tasks) return true;
        const currentTask = this.activeSubmission.tasks[this.activeTaskIndex];
        if (!currentTask) return true;
        const raw = this.performanceMarks[currentTask.id];
        if (raw !== undefined && raw !== null && raw !== '') {
            const entered = Number(raw);
            const max = Number(currentTask.marks) || 0;
            if (isNaN(entered)) {
                this.toastService.warning('Please enter a valid number for marks.');
                return false;
            }
            if (entered > max) {
                this.toastService.warning(`Marks for this task cannot exceed maximum marks (${max})!`);
                return false;
            }
            if (entered < 0) {
                this.toastService.warning('Marks cannot be less than 0.');
                return false;
            }
        }
        return true;
    }

    onPerformanceMarkInput(task: any) {
        if (!task) return;
        const raw = this.performanceMarks[task.id];
        if (raw !== undefined && raw !== null && raw !== '') {
            const entered = Number(raw);
            const max = Number(task.marks) || 0;
            if (entered > max) {
                this.toastService.warning(`Entered marks (${entered}) exceed maximum allowable marks of ${max}.`);
            } else if (entered < 0) {
                this.toastService.warning('Marks cannot be less than 0.');
            }
        }
    }

    isCurrentTaskMarkInvalid(): boolean {
        if (!this.activeSubmission || !this.activeSubmission.tasks) return false;
        const currentTask = this.activeSubmission.tasks[this.activeTaskIndex];
        if (!currentTask) return false;
        const raw = this.performanceMarks[currentTask.id];
        if (raw !== undefined && raw !== null && raw !== '') {
            const entered = Number(raw);
            const max = Number(currentTask.marks) || 0;
            return entered > max || entered < 0;
        }
        return false;
    }

    nextTask() {
        if (!this.validateCurrentTask()) {
            return;
        }
        if (this.activeTaskIndex < this.activeSubmission.tasks.length - 1) {
            this.activeTaskIndex++;
        }
    }

    prevTask() {
        if (!this.validateCurrentTask()) {
            return;
        }
        if (this.activeTaskIndex > 0) {
            this.activeTaskIndex--;
        }
    }

    goToTask(index: number) {
        if (!this.validateCurrentTask()) {
            return;
        }
        if (index >= 0 && index < (this.activeSubmission?.tasks?.length || 0)) {
            this.activeTaskIndex = index;
        }
    }

    savePerformance() {
        if (!this.validateCurrentTask()) {
            return;
        }
        const invalid = this.activeSubmission.tasks.find((t: any) => {
            const raw = this.performanceMarks[t.id];
            if (raw === undefined || raw === null || raw === '') return false;
            const val = Number(raw);
            return val > (Number(t.marks) || 0) || val < 0;
        });

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
        const studentName = this.activeSubmission.student_name;
        this.dataService.savePerformanceSubmission(payload).subscribe(() => {
            this.activeSubmission = null;
            this.toastService.success(`Evaluation finalized for ${studentName}. Score: ${totalObtained}/${this.selectedExam.total_marks}`);
            this.loadExams();
            if (this.activeTab === 'evaluations') {
                this.loadAllSubmissions();
            }
            if (this.isResultsListModalOpen && this.selectedExam) {
                this.viewResults(this.selectedExam);
            }
            this.openConductModal(this.selectedExam);
        });
    }
}
