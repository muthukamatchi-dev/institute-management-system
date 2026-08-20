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

@Component({
    selector: 'app-question-bank',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalComponent, QuestionBuilderComponent, CustomFieldsRendererComponent, BrandingHeaderComponent],
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
    settings: any;

    newTemplate: any = this.resetTemplate();
    selectedTemplate: QuestionBankItem | null = null;

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
        if (Array.isArray(subjectsRaw)) return subjectsRaw;
        try {
            const parsed = JSON.parse(subjectsRaw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
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
}
