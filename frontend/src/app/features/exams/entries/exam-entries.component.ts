import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { Course, Batch, Student } from '../../../models';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { ToastService } from '../../../services/toast.service';
import { SearchableSelectComponent } from '../../../shared/ui/searchable-select.component';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportHelper } from '../../../shared/utils/export-helper';

@Component({
    selector: 'app-exam-entries',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalComponent, SearchableSelectComponent],
    templateUrl: './exam-entries.component.html'
})
export class ExamEntriesComponent implements OnInit {
    courses: Course[] = [];
    batches: Batch[] = [];
    allStudents: Student[] = [];
    examEntries: any[] = [];

    selectedCourse: Course | null = null;
    selectedSubject = '';
    courseSearchTerm = '';
    entrySearchTerm = '';

    // Modal
    isCreateModalOpen = false;
    isViewModalOpen = false;

    // Form state
    newEntry: any = this.resetEntry();
    selectedEntry: any = null;

    // Student selection in modal
    selectedBatchIds: { [key: string]: boolean } = {};
    availableStudents: Student[] = [];
    selectedStudentIds: { [key: string]: boolean } = {};
    studentSearchQuery = '';
    selectionType: 'batch' | 'student' = 'batch';
    selectedBatchIdsArray: string[] = [];
    selectedStudentIdsArray: string[] = [];

    regSettings: any = null;

    // Student results table in modal
    studentScores: { [studentId: string]: { questionScores: number[], totalScore: number, remarks: string } } = {};
    questionMaxMarks: number[] = [];

    constructor(
        private dataService: DataService,
        private toastService: ToastService
    ) { }

    ngOnInit() {
        this.loadInitialData();
    }

    loadInitialData() {
        this.dataService.getCourses().subscribe(res => {
            this.courses = res;
            if (this.courses.length > 0) {
                this.selectCourse(this.courses[0]);
            }
        });
        this.dataService.getBatches().subscribe(res => this.batches = res);
        this.dataService.getStudents().subscribe(res => this.allStudents = res);
        this.dataService.getSettings().subscribe(res => this.regSettings = res);
    }

    loadEntries() {
        if (!this.selectedCourse) return;
        this.dataService.getExamEntries(String(this.selectedCourse.id)).subscribe(res => {
            this.examEntries = res;
        });
    }

    resetEntry() {
        return {
            id: null,
            title: '',
            course_id: '',
            subject: '',
            exam_date: new Date().toISOString().substring(0, 16),
            total_marks: 100,
            question_count: 5
        };
    }

    selectCourse(course: Course) {
        this.selectedCourse = course;
        this.selectedSubject = '';
        this.loadEntries();
    }

    isCourseStandard(course: Course | null): boolean {
        return !!(course && (course.courseType === 'standard' || course.course_type === 'standard'));
    }

    getSelectedFormCourse(): Course | null {
        if (!this.newEntry.course_id) return null;
        return this.courses.find(c => String(c.id) === String(this.newEntry.course_id)) || null;
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

    get filteredCourses() {
        const search = this.courseSearchTerm.toLowerCase().trim();
        if (!search) return this.courses;
        return this.courses.filter(c => c.name.toLowerCase().includes(search));
    }

    get filteredEntries() {
        const search = this.entrySearchTerm.toLowerCase().trim();
        let entries = this.examEntries;
        if (this.selectedSubject) {
            entries = entries.filter(e => e.subject === this.selectedSubject);
        }
        if (!search) return entries;
        return entries.filter(e => e.title.toLowerCase().includes(search));
    }

    // Modal triggers
    openCreateModal() {
        this.newEntry = this.resetEntry();
        if (this.selectedCourse) {
            this.newEntry.course_id = this.selectedCourse.id;
            if (this.isCourseStandard(this.selectedCourse)) {
                const subs = this.parseCourseSubjects(this.selectedCourse.subjects);
                if (subs.length > 0) {
                    this.newEntry.subject = this.selectedSubject || subs[0].name;
                }
            }
        }
        this.selectedBatchIds = {};
        this.selectedStudentIds = {};
        this.studentScores = {};
        this.availableStudents = [];
        this.selectionType = 'batch';
        this.selectedBatchIdsArray = [];
        this.selectedStudentIdsArray = [];
        this.onQuestionCountChange();
        this.isCreateModalOpen = true;
    }

    editEntry(entry: any) {
        this.dataService.getExamEntryDetails(entry.id).subscribe(details => {
            this.newEntry = {
                id: details.id,
                title: details.title,
                course_id: details.course_id,
                subject: details.subject,
                exam_date: details.exam_date ? details.exam_date.substring(0, 16) : '',
                total_marks: details.total_marks,
                question_count: details.question_count
            };

            // Parse batches
            this.selectedBatchIds = {};
            this.selectedBatchIdsArray = [];
            try {
                const batchList = JSON.parse(details.batches || '[]');
                batchList.forEach((bId: any) => {
                    const idStr = String(bId);
                    this.selectedBatchIds[idStr] = true;
                    this.selectedBatchIdsArray.push(idStr);
                });
            } catch (e) {
                console.error(e);
            }

            if (this.selectedBatchIdsArray.length > 0) {
                this.selectionType = 'batch';
            } else {
                this.selectionType = 'student';
            }

            // Parse question max marks
            try {
                this.questionMaxMarks = JSON.parse(details.question_marks || '[]');
            } catch (e) {
                this.questionMaxMarks = Array(this.newEntry.question_count).fill(0);
            }

            // Update available students based on selected batches
            this.updateAvailableStudents();

            // Populate selected students and scores
            this.selectedStudentIds = {};
            this.selectedStudentIdsArray = [];
            this.studentScores = {};
            if (Array.isArray(details.results)) {
                details.results.forEach((res: any) => {
                    const sId = String(res.student_id);
                    this.selectedStudentIds[sId] = true;
                    this.selectedStudentIdsArray.push(sId);

                    let qScores: number[] = [];
                    try {
                        qScores = JSON.parse(res.marks_obtained || '[]');
                    } catch (e) {
                        qScores = Array(this.newEntry.question_count).fill(0);
                    }

                    this.studentScores[sId] = {
                        questionScores: qScores,
                        totalScore: res.total_marks_obtained,
                        remarks: res.remarks || ''
                    };
                });
            }

            this.isCreateModalOpen = true;
        });
    }

    viewEntry(entry: any) {
        this.dataService.getExamEntryDetails(entry.id).subscribe(details => {
            this.selectedEntry = details;

            // Parse helper fields for template rendering
            try {
                this.selectedEntry.parsedQuestionMarks = JSON.parse(details.question_marks || '[]');
            } catch (e) {
                this.selectedEntry.parsedQuestionMarks = [];
            }
            if (Array.isArray(this.selectedEntry.results)) {
                this.selectedEntry.results.forEach((res: any) => {
                    try {
                        res.parsedScores = JSON.parse(res.marks_obtained || '[]');
                    } catch (e) {
                        res.parsedScores = [];
                    }
                });
            }

            this.isViewModalOpen = true;
        });
    }

    deleteEntry(id: string) {
        if (confirm('Are you sure you want to delete this exam entry and all student results associated with it?')) {
            this.dataService.deleteExamEntry(id).subscribe(() => {
                this.toastService.success('Exam entry deleted successfully');
                this.loadEntries();
            });
        }
    }

    // Selection changes
    onCourseChange() {
        const course = this.courses.find(c => String(c.id) === String(this.newEntry.course_id));
        if (course && this.isCourseStandard(course)) {
            const subs = this.parseCourseSubjects(course.subjects);
            this.newEntry.subject = subs.length > 0 ? subs[0].name : '';
        } else {
            this.newEntry.subject = '';
        }
        this.selectedBatchIds = {};
        this.selectedStudentIds = {};
        this.availableStudents = [];
        this.studentScores = {};
        this.selectedBatchIdsArray = [];
        this.selectedStudentIdsArray = [];
    }

    getFilteredBatchesForCourse(): Batch[] {
        if (!this.newEntry.course_id) return [];
        return this.batches.filter(b => String(b.courseId) === String(this.newEntry.course_id));
    }

    getFilteredStudentsForCourse(): Student[] {
        if (!this.newEntry.course_id) return [];
        return this.allStudents.filter(s => String(s.courseId) === String(this.newEntry.course_id));
    }

    onSelectionTypeChange() {
        this.selectedBatchIds = {};
        this.selectedStudentIds = {};
        this.selectedBatchIdsArray = [];
        this.selectedStudentIdsArray = [];
        this.availableStudents = [];
        this.studentScores = {};
    }

    onBatchesSelected(selectedIds: any) {
        // Safe check for event type (app-searchable-select emits selection array or single depending on multiple setting)
        const ids = Array.isArray(selectedIds) ? selectedIds.map(opt => String(opt.id || opt)) : [];
        this.selectedBatchIdsArray = ids;
        this.selectedBatchIds = {};
        ids.forEach(id => this.selectedBatchIds[id] = true);

        // Find students in these batches
        const courseStudents = this.getFilteredStudentsForCourse();
        const batchStudents = courseStudents.filter(s => s.batchId && this.selectedBatchIds[String(s.batchId)]);

        // Update selectedStudentIds
        const newSelectedStudentIds: { [key: string]: boolean } = {};
        batchStudents.forEach(s => {
            newSelectedStudentIds[s.id] = true;
            this.initializeStudentScore(s.id);
        });

        // Clean up scores for students no longer selected
        Object.keys(this.selectedStudentIds).forEach(id => {
            if (!newSelectedStudentIds[id]) {
                delete this.studentScores[id];
            }
        });

        this.selectedStudentIds = newSelectedStudentIds;
    }

    onStudentsSelected(selectedIds: any) {
        const ids = Array.isArray(selectedIds) ? selectedIds.map(opt => String(opt.id || opt)) : [];
        this.selectedStudentIdsArray = ids;
        const newSelectedStudentIds: { [key: string]: boolean } = {};
        ids.forEach(id => {
            newSelectedStudentIds[id] = true;
            this.initializeStudentScore(id);
        });

        // Clean up scores for students no longer selected
        Object.keys(this.selectedStudentIds).forEach(id => {
            if (!newSelectedStudentIds[id]) {
                delete this.studentScores[id];
            }
        });

        this.selectedStudentIds = newSelectedStudentIds;
    }

    onBatchToggle(batchId: string) {
        this.selectedBatchIds[batchId] = !this.selectedBatchIds[batchId];
        this.updateAvailableStudents();
    }

    updateAvailableStudents() {
        const activeBatchIds = Object.keys(this.selectedBatchIds).filter(id => this.selectedBatchIds[id]);
        if (activeBatchIds.length === 0) {
            this.availableStudents = [];
            return;
        }

        // Filter all students matching course and selected batches
        this.availableStudents = this.allStudents.filter(student =>
            String(student.courseId) === String(this.newEntry.course_id) &&
            student.batchId && activeBatchIds.includes(String(student.batchId))
        );
    }

    toggleStudentSelection(studentId: string) {
        this.selectedStudentIds[studentId] = !this.selectedStudentIds[studentId];
        if (this.selectedStudentIds[studentId]) {
            this.initializeStudentScore(studentId);
        } else {
            delete this.studentScores[studentId];
        }
    }

    toggleAllStudents() {
        const allSelected = this.filteredAvailableStudents.every(s => this.selectedStudentIds[s.id]);
        this.filteredAvailableStudents.forEach(s => {
            this.selectedStudentIds[s.id] = !allSelected;
            if (!allSelected) {
                this.initializeStudentScore(s.id);
            } else {
                delete this.studentScores[s.id];
            }
        });
    }

    get filteredAvailableStudents() {
        const query = this.studentSearchQuery.toLowerCase().trim();
        if (!query) return this.availableStudents;
        return this.availableStudents.filter(s =>
            s.name.toLowerCase().includes(query) ||
            (s.regNumber && s.regNumber.toLowerCase().includes(query))
        );
    }

    initializeStudentScore(studentId: string) {
        if (!this.studentScores[studentId]) {
            this.studentScores[studentId] = {
                questionScores: Array(this.newEntry.question_count).fill(0),
                totalScore: 0,
                remarks: ''
            };
        }
    }

    // Question marks config
    onQuestionCountChange() {
        const count = Number(this.newEntry.question_count) || 0;
        if (count < 1) return;

        // Preserve scores or marks config if resizing
        const newMaxMarks = Array(count).fill(0);
        for (let i = 0; i < count; i++) {
            if (i < this.questionMaxMarks.length) {
                newMaxMarks[i] = this.questionMaxMarks[i];
            }
        }
        this.questionMaxMarks = newMaxMarks;

        // Adjust student score arrays
        Object.keys(this.studentScores).forEach(studentId => {
            const currentScores = this.studentScores[studentId].questionScores;
            const newScores = Array(count).fill(0);
            for (let i = 0; i < count; i++) {
                if (i < currentScores.length) {
                    newScores[i] = currentScores[i];
                }
            }
            this.studentScores[studentId].questionScores = newScores;
            this.calculateStudentTotal(studentId);
        });
    }

    distributeMarksEqually() {
        const count = this.questionMaxMarks.length;
        if (count === 0) return;
        const total = Number(this.newEntry.total_marks) || 0;
        const share = Math.floor(total / count);
        const remainder = total % count;

        for (let i = 0; i < count; i++) {
            this.questionMaxMarks[i] = share + (i === count - 1 ? remainder : 0);
        }
    }

    onQuestionMaxMarkChange() {
        const sum = this.questionMaxMarks.reduce((acc, val) => acc + (Number(val) || 0), 0);
        this.newEntry.total_marks = sum;
    }

    calculateStudentTotal(studentId: string) {
        const scores = this.studentScores[studentId].questionScores;
        const total = scores.reduce((acc, score) => acc + (Number(score) || 0), 0);
        this.studentScores[studentId].totalScore = Number(total.toFixed(2));
    }

    validateScore(studentId: string, qIndex: number) {
        const val = this.studentScores[studentId].questionScores[qIndex];
        const max = this.questionMaxMarks[qIndex];
        if (val > max) {
            this.toastService.warning(`Marks obtained cannot exceed max marks of Q${qIndex + 1} (${max})`);
            this.studentScores[studentId].questionScores[qIndex] = max;
        }
        this.calculateStudentTotal(studentId);
    }

    getSelectedStudentList() {
        const courseStudents = this.getFilteredStudentsForCourse();
        return courseStudents.filter(s => this.selectedStudentIds[s.id]);
    }

    saveEntry() {
        if (!this.newEntry.title || !this.newEntry.course_id) {
            this.toastService.warning('Please enter exam title and course.');
            return;
        }

        const selectedBatches = Object.keys(this.selectedBatchIds).filter(id => this.selectedBatchIds[id]);
        if (this.selectionType === 'batch' && selectedBatches.length === 0) {
            this.toastService.warning('Please select at least one batch.');
            return;
        }

        const selectedStudents = this.getSelectedStudentList();
        if (selectedStudents.length === 0) {
            this.toastService.warning('Please select at least one student.');
            return;
        }

        // Validate question marks sum matches total marks
        const sumMax = this.questionMaxMarks.reduce((acc, val) => acc + (Number(val) || 0), 0);
        if (sumMax !== Number(this.newEntry.total_marks)) {
            if (!confirm(`The sum of question marks (${sumMax}) does not match the total marks of the exam (${this.newEntry.total_marks}). Do you want to proceed?`)) {
                return;
            }
        }

        // Form payload
        const resultsPayload = selectedStudents.map(student => {
            const scoreData = this.studentScores[student.id];
            return {
                student_id: student.id,
                marks_obtained: JSON.stringify(scoreData.questionScores),
                total_marks_obtained: scoreData.totalScore,
                remarks: scoreData.remarks || ''
            };
        });

        const payload = {
            id: this.newEntry.id,
            title: this.newEntry.title,
            course_id: this.newEntry.course_id,
            subject: this.newEntry.subject,
            exam_date: this.newEntry.exam_date,
            total_marks: this.newEntry.total_marks,
            question_count: this.newEntry.question_count,
            question_marks: JSON.stringify(this.questionMaxMarks),
            batches: JSON.stringify(selectedBatches),
            results: resultsPayload
        };

        this.dataService.saveExamEntry(payload).subscribe({
            next: () => {
                this.toastService.success(this.newEntry.id ? 'Exam entry updated successfully' : 'Exam entry created successfully');
                this.isCreateModalOpen = false;
                this.loadEntries();
            },
            error: (err) => {
                console.error(err);
                this.toastService.error('Error saving exam entry.');
            }
        });
    }

    trackByIndex(index: number, item: any): number {
        return index;
    }

    exportToPDF() {
        if (!this.selectedEntry) return;
        const doc = new jsPDF('l', 'mm', 'a4') as any;
        
        // Define headers
        const qHeaders = this.selectedEntry.parsedQuestionMarks.map((m: any, i: number) => `Q${i + 1} (${m})`);
        const headers = ['Reg #', 'Student Name', ...qHeaders, 'Total', 'Remarks'];

        // Map data rows
        const data = this.selectedEntry.results.map((res: any) => [
            String(res.reg_number || '-'),
            String(res.student_name || ''),
            ...res.parsedScores.map((score: any) => String(score)),
            `${res.total_marks_obtained} / ${this.selectedEntry.total_marks}`,
            String(res.remarks || '-')
        ]);

        const title = `OFFLINE EXAM MARKS: ${this.selectedEntry.title}`;
        ExportHelper.addPDFHeader(doc, this.regSettings, title).then(startY => {
            // Draw basic exam info summary in PDF
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(71, 85, 105); // slate-600
            const examInfo = `Course: ${this.selectedEntry.course_name}  |  Subject: ${this.selectedEntry.subject || '-'}  |  Date: ${new Date(this.selectedEntry.exam_date).toLocaleString()}  |  Total Marks: ${this.selectedEntry.total_marks}`;
            doc.text(examInfo, 14, startY);

            autoTable(doc, {
                startY: startY + 6,
                head: [headers],
                body: data,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] }
            });

            const filename = `Exam_Marks_${this.selectedEntry.title.replace(/\s+/g, '_')}.pdf`;
            doc.save(filename);
        });
    }

    exportToExcel() {
        if (!this.selectedEntry) return;

        // Map data rows to JSON format for sheet conversion
        const rawData = this.selectedEntry.results.map((res: any) => {
            const row: any = {
                'Reg Number': res.reg_number,
                'Student Name': res.student_name,
            };
            // Add individual question marks columns
            this.selectedEntry.parsedQuestionMarks.forEach((m: any, i: number) => {
                row[`Q${i + 1} Max(${m})`] = res.parsedScores[i] ?? 0;
            });
            row['Total Marks Obtained'] = `${res.total_marks_obtained} / ${this.selectedEntry.total_marks}`;
            row['Remarks'] = res.remarks || '';
            return row;
        });

        const title = `OFFLINE EXAM MARKS: ${this.selectedEntry.title}`;
        const ws = ExportHelper.addExcelHeader(rawData, this.regSettings, title);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Scoresheet');
        
        const filename = `Exam_Marks_${this.selectedEntry.title.replace(/\s+/g, '_')}.xlsx`;
        XLSX.writeFile(wb, filename);
    }
}
