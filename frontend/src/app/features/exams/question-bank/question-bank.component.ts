import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { Course, QuestionBankItem } from '../../../models';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { QuestionBuilderComponent } from '../shared/question-builder.component';
import { ToastService } from '../../../services/toast.service';
import { Router } from '@angular/router';

import { CustomFieldsRendererComponent } from '../../../shared/ui/custom-fields-renderer.component';
import { BrandingHeaderComponent } from '../../../shared/ui/branding-header.component';
import { DatePickerComponent } from '../../../shared/ui/date-picker.component';

@Component({
    selector: 'app-question-bank',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalComponent, QuestionBuilderComponent, CustomFieldsRendererComponent, BrandingHeaderComponent, DatePickerComponent],
    templateUrl: './question-bank.component.html'
})
export class QuestionBankComponent implements OnInit {
    @ViewChild(QuestionBuilderComponent) questionBuilder!: QuestionBuilderComponent;
    @ViewChild(CustomFieldsRendererComponent) customFieldsRenderer!: CustomFieldsRendererComponent;

    courses: Course[] = [];
    questionTemplates: QuestionBankItem[] = [];
    selectedCourse: Course | null = null;
    courseSearchTerm = '';
    templateSearchTerm = '';
    selectedSubject = '';

    // Modals
    isCreateModalOpen = false;
    isConductModalOpen = false;
    isViewModalOpen = false;
    isImportDocModalOpen = false;
    importDocText = '';
    importFileName = '';
    isParsingDoc = false;
    parsedDocQuestions: any[] = [];
    importMode: 'append' | 'replace' = 'append';
    settings: any;

    newTemplate: any = this.resetTemplate();
    selectedTemplate: QuestionBankItem | null = null;

    // Drag & drop state for template questions list
    draggedQuestionIndex: number | null = null;
    dragOverQuestionIndex: number | null = null;

    // Drag & drop state for doc import preview list
    draggedDocQuestionIndex: number | null = null;
    dragOverDocQuestionIndex: number | null = null;

    conductSettings: any = {
        title: '',
        duration_minutes: 60,
        pass_percentage: 40,
        status: 'active',
        date: new Date().toISOString().split('T')[0],
        examType: 'internal'
    };

    constructor(
        private dataService: DataService,
        private router: Router,
        private toastService: ToastService
    ) { }

    ngOnInit() {
        this.loadCourses();
        this.dataService.getSettings().subscribe(res => this.settings = res);
    }

    resetTemplate() {
        return {
            title: '',
            courseId: '',
            subject: '',
            questions: []
        };
    }

    loadCourses() {
        this.dataService.getCourses().subscribe(res => {
            this.courses = res;
            if (this.courses.length > 0) {
                this.selectCourse(this.courses[0]);
            }
        });
    }

    selectCourse(course: Course) {
        this.selectedCourse = course;
        this.selectedSubject = '';
        this.loadTemplates(course.id);
    }

    selectSubject(subjectName: string) {
        this.selectedSubject = subjectName;
    }

    isCourseStandard(course: Course | null): boolean {
        return !!(course && (course.courseType === 'standard' || course.course_type === 'standard'));
    }

    isNewTemplateCourseStandard(): boolean {
        const course = this.getNewTemplateCourse();
        return this.isCourseStandard(course);
    }

    getNewTemplateCourse(): Course | null {
        if (!this.newTemplate.courseId) return null;
        return this.courses.find(c => String(c.id) === String(this.newTemplate.courseId)) || null;
    }

    parseCourseSubjects(subjectsRaw: any): any[] {
        if (!subjectsRaw) return [];
        if (Array.isArray(subjectsRaw)) {
            return subjectsRaw.map(s => typeof s === 'string' ? { name: s } : s);
        }
        try {
            const parsed = JSON.parse(subjectsRaw);
            return Array.isArray(parsed) ? parsed.map(s => typeof s === 'string' ? { name: s } : s) : [];
        } catch (e) {
            if (typeof subjectsRaw === 'string' && subjectsRaw.includes(',')) {
                return subjectsRaw.split(',').map(s => ({ name: s.trim() })).filter(s => s.name);
            }
            return [];
        }
    }

    onCourseChange() {
        if (!this.isNewTemplateCourseStandard()) {
            this.newTemplate.subject = '';
        }
    }

    loadTemplates(courseId: string) {
        this.dataService.getQuestionBank(courseId).subscribe(res => {
            if (res.length > 0) {
                this.questionTemplates = res;
                return;
            }

            // Legacy fallback: older templates may exist without course_id mapping.
            this.dataService.getQuestionBank().subscribe(allTemplates => {
                this.questionTemplates = allTemplates.filter(template =>
                    template.courseId === courseId || !template.courseId
                );
            });
        });
    }

    get filteredCourses() {
        const search = this.courseSearchTerm.toLowerCase().trim();
        if (!search) return this.courses;
        return this.courses.filter(c => c.name.toLowerCase().includes(search));
    }

    get filteredTemplates() {
        const search = this.templateSearchTerm.toLowerCase().trim();
        let templates = this.questionTemplates;
        if (this.selectedSubject) {
            templates = templates.filter(t => t.subject === this.selectedSubject);
        }
        if (!search) return templates;
        return templates.filter(t => t.title.toLowerCase().includes(search));
    }

    openCreateModal() {
        this.newTemplate = this.resetTemplate();
        if (this.selectedCourse) {
            this.newTemplate.courseId = this.selectedCourse.id;
            if (this.isCourseStandard(this.selectedCourse)) {
                const subs = this.parseCourseSubjects(this.selectedCourse.subjects);
                if (subs.length > 0) {
                    this.newTemplate.subject = this.selectedSubject || subs[0].name;
                }
            }
        }
        if (this.questionBuilder) this.questionBuilder.cancelEdit();
        this.isCreateModalOpen = true;
    }

    editTemplate(template: QuestionBankItem) {
        this.newTemplate = JSON.parse(JSON.stringify(template));
        if (!this.newTemplate.courseId && (template as any).course_id) {
            this.newTemplate.courseId = (template as any).course_id;
        }
        if (!this.newTemplate.subject && (template as any).subject_name) {
            this.newTemplate.subject = (template as any).subject_name;
        }
        if (this.questionBuilder) this.questionBuilder.cancelEdit();
        this.isCreateModalOpen = true;
    }

    copyTemplate(template: QuestionBankItem) {
        this.newTemplate = JSON.parse(JSON.stringify(template));
        this.newTemplate.id = undefined;
        this.newTemplate.title = `${template.title} (Copy)`;
        this.isCreateModalOpen = true;
    }

    deleteTemplate(id: string) {
        if (confirm('Are you sure you want to delete this question template?')) {
            this.dataService.deleteQuestionBankItem(id).subscribe(() => {
                this.toastService.success('Template deleted successfully');
                if (this.selectedCourse) {
                    this.loadTemplates(this.selectedCourse.id);
                }
            });
        }
    }

    onQuestionAdded(q: any) {
        this.newTemplate.questions.push(q);
    }

    startEditQuestion(index: number) {
        const question = this.newTemplate.questions[index];
        this.questionBuilder.editQuestion(index, question);
    }

    onQuestionUpdated(event: { index: number, question: any }) {
        this.newTemplate.questions[event.index] = event.question;
    }

    removeQuestion(index: number) {
        this.newTemplate.questions.splice(index, 1);
        if (this.questionBuilder && this.questionBuilder.editIndex === index) {
            this.questionBuilder.cancelEdit();
        }
    }

    moveQuestionUp(index: number) {
        if (index <= 0 || !this.newTemplate?.questions || index >= this.newTemplate.questions.length) return;
        const temp = this.newTemplate.questions[index];
        this.newTemplate.questions[index] = this.newTemplate.questions[index - 1];
        this.newTemplate.questions[index - 1] = temp;
        if (this.questionBuilder && this.questionBuilder.editIndex !== null) {
            if (this.questionBuilder.editIndex === index) {
                this.questionBuilder.editIndex = index - 1;
            } else if (this.questionBuilder.editIndex === index - 1) {
                this.questionBuilder.editIndex = index;
            }
        }
    }

    moveQuestionDown(index: number) {
        if (!this.newTemplate?.questions || index < 0 || index >= this.newTemplate.questions.length - 1) return;
        const temp = this.newTemplate.questions[index];
        this.newTemplate.questions[index] = this.newTemplate.questions[index + 1];
        this.newTemplate.questions[index + 1] = temp;
        if (this.questionBuilder && this.questionBuilder.editIndex !== null) {
            if (this.questionBuilder.editIndex === index) {
                this.questionBuilder.editIndex = index + 1;
            } else if (this.questionBuilder.editIndex === index + 1) {
                this.questionBuilder.editIndex = index;
            }
        }
    }

    onQuestionDragStart(event: DragEvent, index: number) {
        const target = event.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON' || target.closest('input') || target.closest('button'))) {
            event.preventDefault();
            return;
        }
        this.draggedQuestionIndex = index;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', String(index));
        }
    }

    onQuestionDragOver(event: DragEvent, index: number) {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
        this.dragOverQuestionIndex = index;
    }

    onQuestionDragLeave(event: DragEvent, index: number) {
        if (this.dragOverQuestionIndex === index) {
            this.dragOverQuestionIndex = null;
        }
    }

    onQuestionDrop(event: DragEvent, dropIndex: number) {
        event.preventDefault();
        if (this.draggedQuestionIndex === null || this.draggedQuestionIndex === undefined || this.draggedQuestionIndex === dropIndex) {
            this.dragOverQuestionIndex = null;
            this.draggedQuestionIndex = null;
            return;
        }
        const [movedItem] = this.newTemplate.questions.splice(this.draggedQuestionIndex, 1);
        this.newTemplate.questions.splice(dropIndex, 0, movedItem);

        if (this.questionBuilder && this.questionBuilder.editIndex !== null) {
            if (this.questionBuilder.editIndex === this.draggedQuestionIndex) {
                this.questionBuilder.editIndex = dropIndex;
            } else {
                this.questionBuilder.cancelEdit();
            }
        }

        this.dragOverQuestionIndex = null;
        this.draggedQuestionIndex = null;
    }

    onQuestionDragEnd() {
        this.draggedQuestionIndex = null;
        this.dragOverQuestionIndex = null;
    }

    moveParsedDocQuestionUp(index: number) {
        if (index <= 0 || !this.parsedDocQuestions || index >= this.parsedDocQuestions.length) return;
        const temp = this.parsedDocQuestions[index];
        this.parsedDocQuestions[index] = this.parsedDocQuestions[index - 1];
        this.parsedDocQuestions[index - 1] = temp;
    }

    moveParsedDocQuestionDown(index: number) {
        if (!this.parsedDocQuestions || index < 0 || index >= this.parsedDocQuestions.length - 1) return;
        const temp = this.parsedDocQuestions[index];
        this.parsedDocQuestions[index] = this.parsedDocQuestions[index + 1];
        this.parsedDocQuestions[index + 1] = temp;
    }

    onDocQuestionDragStart(event: DragEvent, index: number) {
        const target = event.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button'))) {
            event.preventDefault();
            return;
        }
        this.draggedDocQuestionIndex = index;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', String(index));
        }
    }

    onDocQuestionDragOver(event: DragEvent, index: number) {
        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
        this.dragOverDocQuestionIndex = index;
    }

    onDocQuestionDragLeave(event: DragEvent, index: number) {
        if (this.dragOverDocQuestionIndex === index) {
            this.dragOverDocQuestionIndex = null;
        }
    }

    onDocQuestionDrop(event: DragEvent, dropIndex: number) {
        event.preventDefault();
        if (this.draggedDocQuestionIndex === null || this.draggedDocQuestionIndex === undefined || this.draggedDocQuestionIndex === dropIndex) {
            this.dragOverDocQuestionIndex = null;
            this.draggedDocQuestionIndex = null;
            return;
        }
        const [movedItem] = this.parsedDocQuestions.splice(this.draggedDocQuestionIndex, 1);
        this.parsedDocQuestions.splice(dropIndex, 0, movedItem);
        this.dragOverDocQuestionIndex = null;
        this.draggedDocQuestionIndex = null;
    }

    onDocQuestionDragEnd() {
        this.draggedDocQuestionIndex = null;
        this.dragOverDocQuestionIndex = null;
    }

    addSectionTitle() {
        if (!this.newTemplate.questions) {
            this.newTemplate.questions = [];
        }
        const newTitleItem = {
            is_section_title: true,
            question_type: 'section_header',
            question_text: 'I. ANSWER THE FOLLOWING :',
            marks: 0
        };

        if (this.newTemplate.questions.length === 0) {
            // If empty -> insert as first item
            this.newTemplate.questions.unshift(newTitleItem);
        } else {
            // If has questions -> insert as last item
            this.newTemplate.questions.push(newTitleItem);
        }
    }

    addSectionBreak() {
        if (!this.newTemplate.questions) {
            this.newTemplate.questions = [];
        }
        const nextSectionLabel = this.getNextSectionLabel();
        const newSectionItem = {
            is_section_break: true,
            is_section_title: true,
            question_type: 'section_break',
            question_text: `SECTION - ${nextSectionLabel}`,
            marks: 0
        };

        if (this.newTemplate.questions.length === 0) {
            this.newTemplate.questions.unshift(newSectionItem);
        } else {
            this.newTemplate.questions.push(newSectionItem);
        }
    }

    getNextSectionLabel(): string {
        if (!this.newTemplate?.questions) return 'A';
        const sectionBreaks = this.newTemplate.questions.filter((q: any) => q.question_type === 'section_break' || q.is_section_break);
        const count = sectionBreaks.length;
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        return letters[count] || `${count + 1}`;
    }

    getQuestionNumberForList(questions: any[] | undefined, targetIndex: number): number {
        if (!questions) return 1;
        let count = 0;
        for (let i = 0; i <= targetIndex; i++) {
            const q = questions[i];
            if (q && !q.is_section_title && !q.is_section_break && q.question_type !== 'section_header' && q.question_type !== 'section_break') {
                count++;
            }
        }
        return count || 1;
    }

    getQuestionNumber(targetIndex: number): number {
        return this.getQuestionNumberForList(this.newTemplate?.questions, targetIndex);
    }

    getQuestionTypeLabel(type: string): string {
        switch (type) {
            case 'mcq': return 'MCQ';
            case 'fillups': return 'Fillups';
            case 'match': return 'Match It';
            case 'true_false': return 'True / False';
            case 'descriptive':
            case 'text': return 'Descriptive';
            case 'either_or': return 'Either Or';
            case 'section_header': return 'Section Title';
            case 'section_break': return 'Section Split';
            default: return type ? type.toUpperCase() : 'Question';
        }
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

    getQuestionsOnlyCount(): number {
        if (!this.newTemplate?.questions) return 0;
        return this.newTemplate.questions.filter((q: any) => !q.is_section_title && !q.is_section_break && q.question_type !== 'section_header' && q.question_type !== 'section_break').length;
    }

    getTemplateTotalMarks(): number {
        if (!this.newTemplate?.questions) return 0;
        return this.newTemplate.questions.reduce((sum: number, q: any) => sum + (Number(q.marks) || 0), 0);
    }

    saveTemplate() {
        if (!this.newTemplate.title || !this.newTemplate.courseId) return;

        if (this.customFieldsRenderer && !this.customFieldsRenderer.isValid()) {
            this.toastService.warning('Please fill all required custom fields.');
            return;
        }

        // Merge custom fields
        if (this.customFieldsRenderer) {
            this.newTemplate.custom_fields = this.customFieldsRenderer.getValues();
        }

        if (!this.hasValidQuestions()) {
            this.toastService.warning('Please add at least one valid question. MCQ questions need at least 2 filled options and 1 correct answer.');
            return;
        }

        this.dataService.saveQuestionBankItem(this.prepareTemplatePayload()).subscribe({
            next: () => {
                this.isCreateModalOpen = false;
                this.toastService.success(this.newTemplate.id ? 'Template updated successfully' : 'New template created successfully');
                if (this.selectedCourse) {
                    this.loadTemplates(this.selectedCourse.id);
                }
            },
            error: (err) => {
                console.error('Template save error:', err);
                const message = err?.error?.message || 'Unable to save template. Please check the question options and try again.';
                this.toastService.error(message);
            }
        });
    }

    closeToast() {
    }

    // CONDUCT LOGIC
    openConductModal(template: QuestionBankItem) {
        this.selectedTemplate = template;
        this.conductSettings = {
            title: template.title,
            duration_minutes: 60,
            pass_percentage: 40,
            status: 'active',
            date: new Date().toISOString().split('T')[0],
            examType: 'internal'
        };
        this.isConductModalOpen = true;
    }

    confirmConduct() {
        if (!this.selectedTemplate) return;

        const examPayload = {
            title: this.conductSettings.title,
            courseId: this.selectedTemplate.courseId,
            duration_minutes: this.conductSettings.duration_minutes,
            pass_percentage: this.conductSettings.pass_percentage,
            status: this.conductSettings.status,
            exam_date: this.conductSettings.date,
            type: this.conductSettings.examType,
            questions: this.selectedTemplate.questions,
            total_marks: this.selectedTemplate.questions.reduce((acc: number, q: any) => acc + (Number(q.marks) || 0), 0)
        };

        if (this.conductSettings.examType === 'internal') {
            this.dataService.saveInternalExam(examPayload).subscribe(() => {
                this.isConductModalOpen = false;
                this.router.navigate(['/exams/internal']);
            });
        } else {
            this.dataService.saveExternalExam(examPayload).subscribe(() => {
                this.isConductModalOpen = false;
                this.router.navigate(['/exams/external']);
            });
        }
    }

    viewTemplate(template: QuestionBankItem) {
        this.selectedTemplate = template;
        this.isViewModalOpen = true;
    }

    private hasValidQuestions(): boolean {
        if (!this.newTemplate.questions?.length) {
            return false;
        }

        return this.newTemplate.questions.every((question: any) => {
            if (!question?.question_text?.trim()) {
                return false;
            }

            if (question.question_type === 'section_header' || question.question_type === 'section_break' || question.is_section_title || question.is_section_break) {
                return true;
            }

            if (question.question_type !== 'mcq') {
                return true;
            }

            const validOptions = (question.options || []).filter((option: any) => option?.option_text?.trim());
            const hasCorrectOption = validOptions.some((option: any) => Number(option.is_correct) === 1);
            return validOptions.length >= 2 && hasCorrectOption;
        });
    }

    private prepareTemplatePayload() {
        return {
            ...this.newTemplate,
            questions: (this.newTemplate.questions || []).map((question: any) => ({
                ...question,
                question_text: question.question_text?.trim(),
                options: (question.options || [])
                    .map((option: any) => ({
                        ...option,
                        option_text: option?.option_text?.trim?.() || ''
                    }))
                    .filter((option: any) => option.option_text)
            }))
        };
    }

    // Document Import methods
    openImportDocModal() {
        this.isImportDocModalOpen = true;
        this.importDocText = '';
        this.importFileName = '';
        this.parsedDocQuestions = [];
    }

    onDocFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (!file) return;

        this.importFileName = file.name;
        this.isParsingDoc = true;

        this.dataService.parseQuestionDoc(file).subscribe({
            next: (res: any) => {
                this.isParsingDoc = false;
                const extractedText = res?.data?.text || res?.text || '';
                if (extractedText) {
                    this.importDocText = extractedText;
                    this.updateParsedQuestionsPreview();
                    this.toastService.success(`Document "${file.name}" loaded successfully.`);
                } else {
                    this.readLocalTextFile(file);
                }
            },
            error: () => {
                this.readLocalTextFile(file);
            }
        });
    }

    readLocalTextFile(file: File) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            this.isParsingDoc = false;
            this.importDocText = e.target.result || '';
            this.updateParsedQuestionsPreview();
        };
        reader.onerror = () => {
            this.isParsingDoc = false;
            this.toastService.error('Could not read file locally.');
        };
        reader.readAsText(file);
    }

    onDocTextChange() {
        this.updateParsedQuestionsPreview();
    }

    updateParsedQuestionsPreview() {
        this.parsedDocQuestions = this.parseDocumentText(this.importDocText);
    }

    parseDocumentText(rawText: string): any[] {
        if (!rawText || !rawText.trim()) return [];

        const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        const questions: any[] = [];
        let currentQ: any = null;

        const isQuestionStart = (line: string): boolean => {
            return /^(?:Q|Question\s*)?\d+[\.\)\:\-]\s+/i.test(line) || /^\d+\.\s+/.test(line);
        };

        const isSectionStart = (line: string): boolean => {
            return /^(?:SECTION|PART|HEADER)[\s\:\-]/i.test(line) || /^[\-\=]{3,}\s*(?:SECTION|PART)/i.test(line);
        };

        const isOptionStart = (line: string): boolean => {
            return /^\*?\s*(?:\[?[A-Dab-d]\]?[\.\)\:]|\([A-Dab-d]\))\s+/.test(line);
        };

        const isAnswerLine = (line: string): boolean => {
            return /^(?:Answer|Ans|Correct(?:\s+Answer)?)\s*[\:\-]\s*/i.test(line);
        };

        const extractMarks = (line: string): number => {
            const match = line.match(/\[?\s*(\d+)\s*(?:mark|marks|pts|point|points)\s*\]?/i);
            return match ? parseInt(match[1], 10) : 1;
        };

        const finalizeCurrentQ = () => {
            if (!currentQ) return;

            if (currentQ.question_type !== 'section_header' && currentQ.question_type !== 'section_break') {
                if (currentQ.options && currentQ.options.length >= 2) {
                    currentQ.question_type = 'mcq';
                } else if (currentQ.question_text.includes('___') || /fill\s+in/i.test(currentQ.question_text)) {
                    currentQ.question_type = 'fillups';
                } else if (/true\s*\/\s*false/i.test(currentQ.question_text)) {
                    currentQ.question_type = 'true_false';
                    currentQ.options = [
                        { option_text: 'True', is_correct: /true/i.test(currentQ.correct_answer || '') ? 1 : 0 },
                        { option_text: 'False', is_correct: /false/i.test(currentQ.correct_answer || '') ? 1 : 0 }
                    ];
                } else {
                    currentQ.question_type = 'descriptive';
                }
            }
            questions.push(currentQ);
            currentQ = null;
        };

        for (let line of lines) {
            if (isSectionStart(line)) {
                finalizeCurrentQ();
                let title = line.replace(/^[\-\=]{3,}\s*/, '').replace(/\s*[\-\=]{3,}$/, '').trim();
                questions.push({
                    is_section_break: true,
                    is_section_title: true,
                    question_type: 'section_break',
                    question_text: title,
                    marks: 0
                });
                continue;
            }

            if (isQuestionStart(line)) {
                finalizeCurrentQ();
                const cleanedText = line.replace(/^(?:Q|Question\s*)?\d+[\.\)\:\-]\s*/i, '').trim();
                const marks = extractMarks(line);
                currentQ = {
                    question_text: cleanedText.replace(/\[?\s*\d+\s*(?:mark|marks|pts|point|points)\s*\]?/gi, '').trim(),
                    marks: marks,
                    question_type: 'descriptive',
                    options: []
                };
                continue;
            }

            if (currentQ) {
                if (isOptionStart(line)) {
                    const isCorrectByStar = line.startsWith('*');
                    const cleanLine = line.replace(/^\*\s*/, '');
                    const optLetterMatch = cleanLine.match(/^(?:\[?([A-Dab-d])\]?[\.\)\:]|\(([A-Dab-d])\))\s*(.*)/);
                    if (optLetterMatch) {
                        const letter = (optLetterMatch[1] || optLetterMatch[2]).toUpperCase();
                        const text = optLetterMatch[3].trim();
                        currentQ.options.push({
                            letter: letter,
                            option_text: text,
                            is_correct: isCorrectByStar ? 1 : 0
                        });
                    }
                } else if (isAnswerLine(line)) {
                    const ansMatch = line.match(/^(?:Answer|Ans|Correct(?:\s+Answer)?)\s*[\:\-]\s*([A-Dab-d]|True|False|.*)/i);
                    if (ansMatch) {
                        const ansVal = ansMatch[1].trim();
                        currentQ.correct_answer = ansVal;
                        if (currentQ.options && currentQ.options.length > 0) {
                            const targetLetter = ansVal.toUpperCase();
                            currentQ.options.forEach((opt: any) => {
                                if (opt.letter === targetLetter || opt.option_text.toUpperCase() === targetLetter) {
                                    opt.is_correct = 1;
                                }
                            });
                        }
                    }
                } else {
                    currentQ.question_text += ' ' + line;
                }
            }
        }

        finalizeCurrentQ();
        return questions;
    }

    confirmImportDocQuestions() {
        if (!this.parsedDocQuestions || this.parsedDocQuestions.length === 0) {
            this.toastService.warning('No questions found to import.');
            return;
        }

        if (this.importMode === 'replace') {
            this.newTemplate.questions = [...this.parsedDocQuestions];
        } else {
            this.newTemplate.questions = [...(this.newTemplate.questions || []), ...this.parsedDocQuestions];
        }

        this.toastService.success(`Imported ${this.parsedDocQuestions.length} questions into template!`);
        this.isImportDocModalOpen = false;
    }

    insertSampleDocText() {
        this.importDocText = `SECTION A: MULTIPLE CHOICE QUESTIONS

1. What is the main purpose of an Operating System? [1 Mark]
A) Manage system resources
*B) Execute user applications and manage hardware
C) Compile program code
D) Browse the internet
Answer: B

2. Which data structure follows First-In-First-Out (FIFO) ordering? [1 Mark]
A) Stack
B) Queue
C) Tree
D) Graph
Answer: B

3. Fill in the blank: HTML stands for _____ Markup Language. [1 Mark]

4. True / False: Python is a statically typed language.
Answer: False`;
        this.updateParsedQuestionsPreview();
    }
}
