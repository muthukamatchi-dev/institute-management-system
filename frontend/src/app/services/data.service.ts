import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
    Student, Course, Batch, FeeRecord, AttendanceRecord, Staff,
    DashboardStats, RecentActivity, QuestionBankItem, StudyMaterial, Expense, Branch
} from '../models';


@Injectable({
    providedIn: 'root'
})
export class DataService {
    private apiUrl = 'http://localhost:8081/api';

    constructor(private http: HttpClient) { }

    // Staff
    getStaff(): Observable<Staff[]> {
        return this.http.get<any>(`${this.apiUrl}/institute/staff`).pipe(
            map(res => {
                const data = res?.data || [];
                if (!Array.isArray(data)) return [];
                return data.map((s: any) => ({
                    id: s.id,
                    staff_id: s.staff_id,
                    name: s.name || 'Unnamed',
                    email: s.email || '',
                    mobile: s.mobile || '',
                    qualification: s.qualification || '',
                    experience: s.experience || '',
                    designation: s.designation || '',
                    joiningDate: s.joining_date || s.joiningDate || '',
                    status: s.status || 'active',
                    salary: Number(s.salary) || 0
                }));
            })
        );
    }

    addStaff(staff: any): Observable<any> {
        const payload = {
            id: staff.id,
            staff_id: staff.staff_id,
            name: staff.name,
            email: staff.email,
            mobile: staff.mobile,
            qualification: staff.qualification,
            experience: staff.experience,
            designation: staff.designation,
            joining_date: staff.joiningDate || new Date().toISOString().split('T')[0],
            status: staff.status || 'active',
            salary: staff.salary || 0
        };
        return this.http.post(`${this.apiUrl}/institute/save_staff`, payload);
    }

    deleteStaff(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/institute/delete_staff`, { id });
    }

    // Students
    getStudents(): Observable<Student[]> {
        return this.http.get<any>(`${this.apiUrl}/institute/students`).pipe(
            map(res => {
                const data = res?.data || [];
                if (!Array.isArray(data)) return [];
                return data.map((s: any) => ({
                    id: String(s.id),
                    regNumber: s.reg_number,
                    name: s.name,
                    fatherName: s.father_name,
                    mobile: s.mobile,
                    parentMobile: s.parent_mobile,
                    dob: s.dob,
                    qualification: s.qualification,
                    email: s.email,
                    courseId: s.course_id,
                    courseName: s.course_name,
                    batchId: s.batch_id,
                    batchName: s.batch_name,
                    joiningDate: s.joining_date,
                    feeStatus: s.fee_status || 'pending',
                    status: s.status || 'active',
                    referredBy: s.referred_by,
                    referralProfession: s.referral_profession,
                    instructor: s.instructor,
                    instructorName: s.instructor_name,
                    timing: s.timing,
                    startDate: s.start_date
                }));
            })
        );
    }

    addStudent(student: any): Observable<any> {
        const payload = {
            id: student.id, // Include ID for updates
            name: student.name,
            father_name: student.fatherName,
            mobile: student.mobile,
            parent_mobile: student.parentMobile,
            dob: student.dob,
            qualification: student.qualification,
            email: student.email,
            course_id: student.courseId,
            batch_id: student.batchId === '0' ? null : student.batchId,
            reg_number: student.regNumber || null,
            status: student.status || 'active',
            joining_date: student.joiningDate || new Date().toISOString().split('T')[0],
            referred_by: student.referredBy,
            referral_profession: student.referralProfession
        };
        return this.http.post(`${this.apiUrl}/institute/save_student`, payload);
    }

    deleteStudent(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/institute/delete_student`, { id });
    }

    getStudentsByBatch(batchId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/institute/students?batch_id=${batchId}`);
    }

    // Courses
    getCourses(): Observable<Course[]> {
        return this.http.get<any>(`${this.apiUrl}/institute/courses`).pipe(
            map(res => {
                const data = res?.data || [];
                if (!Array.isArray(data)) return [];
                return data.map((c: any) => ({
                    id: c.id,
                    course_id: String(c.course_id ?? c.courseId),
                    name: c.name,
                    description: c.description,
                    duration: c.duration,
                    category: c.category,
                    fees: Number(c.fees),
                    status: c.status,
                    syllabusPath: c.syllabus_path ?? c.syllabusPath,
                    imagePath: c.image_path ?? c.imagePath
                }));
            })
        );
    }

    addCourse(course: any): Observable<any> {
        const payload = {
            id: course.id,
            course_id: course.course_id,
            name: course.name,
            description: course.description,
            category: course.category,
            duration: course.duration,
            fees: course.fees,
            status: course.status || 'active',
            syllabus_path: course.syllabusPath,
            image_path: course.imagePath
        };
        return this.http.post(`${this.apiUrl}/institute/save_course`, payload);
    }

    deleteCourse(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/institute/delete_course`, { id });
    }

    uploadSyllabus(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('syllabus', file);
        return this.http.post<any>(`${this.apiUrl}/institute/upload_syllabus`, formData).pipe(
            map(res => ({
                ...res,
                file_path: res?.data?.path
            }))
        );
    }

    uploadCourseImage(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('image', file);
        return this.http.post<any>(`${this.apiUrl}/institute/upload_course_image`, formData).pipe(
            map(res => ({
                ...res,
                file_path: res?.data?.path
            }))
        );
    }

    uploadLogo(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('logo', file);
        return this.http.post<any>(`${this.apiUrl}/institute/upload_logo`, formData).pipe(
            map(res => ({
                ...res,
                file_path: res?.data?.path
            }))
        );
    }

    // Batches
    getBatches(): Observable<Batch[]> {
        return this.http.get<any>(`${this.apiUrl}/institute/batches`).pipe(
            map(res => {
                const data = res?.data || [];
                if (!Array.isArray(data)) return [];
                return data.map((b: any) => ({
                    id: String(b.id),
                    batchName: b.batch_name,
                    courseId: b.course_id,
                    courseName: b.course_name,
                    instructor: b.instructor,
                    instructorName: b.instructor_name,
                    timing: b.timing,
                    startDate: b.start_date,
                    status: b.status,
                    studentCount: parseInt(b.student_count) || 0
                }));
            })
        );
    }

    addBatch(batch: any): Observable<any> {
        const payload = {
            id: batch.id,
            batch_name: batch.batchName,
            course_id: batch.courseId,
            instructor: batch.instructor,
            timing: batch.timing,
            start_date: batch.startDate,
            status: batch.status || 'upcoming',
            students: batch.students || []
        };
        return this.http.post(`${this.apiUrl}/institute/save_batch`, payload);
    }

    deleteBatch(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/institute/delete_batch`, { id });
    }

    updateAllocation(student: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/institute/update_allocation`, {
            id: student.id,
            instructor: student.instructor,
            timing: student.timing,
            startDate: student.startDate,
            status: student.status
        });
    }

    // Fees
    getFees(): Observable<FeeRecord[]> {
        return this.http.get<any>(`${this.apiUrl}/operations/fees`).pipe(
            map(res => {
                const data = res?.data || [];
                if (!Array.isArray(data)) return [];
                return data.map((f: any) => ({
                    id: f.id,
                    studentId: f.student_id,
                    studentName: f.student_name,
                    regNumber: f.regNumber || f.reg_number,
                    batchId: f.batch_id,
                    batchName: f.batch_name,
                    courseName: f.course_name || f.courseName,
                    totalAmount: Number(f.total_amount),
                    paidAmount: Number(f.paid_amount),
                    balanceAmount: Number(f.balance_amount),
                    lastPaymentDate: f.last_payment_date,
                    status: f.status,
                    studentStatus: f.student_status,
                    batchStatus: f.batch_status,
                    paymentMethod: f.payment_method,
                    refNo: f.ref_no,
                    reminder_date: f.reminder_date,
                    is_reminder_enabled: f.is_reminder_enabled
                }));
            })
        );
    }

    getReceipts(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/operations/receipts`).pipe(
            map(res => res.data.map((r: any) => ({
                receiptNo: r.receipt_no,
                studentName: r.student_name,
                courseName: r.course_name,
                amount: Number(r.amount_paid),
                date: r.payment_date,
                method: r.payment_method
            })))
        );
    }

    collectFee(payment: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/operations/collect_fee`, {
            student_id: payment.studentId,
            amount: payment.amount,
            method: payment.method,
            ref_no: payment.refNo
        });
    }

    getStudentReceipts(studentId: string): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/operations/receipts?student_id=${studentId}`).pipe(
            map(res => {
                const data = res.data || [];
                // Client-side filter for extra safety
                return data.filter((r: any) => 
                    String(r.student_id || r.studentId) === String(studentId)
                ).map((r: any) => ({
                    id: r.id,
                    receiptNo: r.receipt_no || r.receiptNo,
                    amount: Number(r.amount_paid || r.amount),
                    date: r.payment_date || r.date,
                    method: r.payment_method || r.method,
                    refNo: r.ref_no || r.refNo
                }));
            })
        );
    }

    saveFeeReminder(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/operations/save_fee_reminder`, data);
    }

    // Attendance (keeping it simple for now as it's a pass-through)
    getAttendance(batchId: string, date: string): Observable<AttendanceRecord[]> {
        return this.http.get<any>(`${this.apiUrl}/operations/get_attendance?batch_id=${batchId}&date=${date}`).pipe(
            map(res => res.data.map((a: any) => ({
                id: a.id,
                studentId: a.student_id,
                studentName: a.student_name,
                studentStatus: a.student_status,
                batchId: a.batch_id,
                date: a.attendance_date,
                status: a.status
            })))
        );
    }

    saveAttendance(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/operations/save_attendance`, data);
    }

    getClassAttendance(classId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/operations/get_class_attendance?class_id=${classId}`);
    }

    getStudentProgress(studentId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/operations/student_progress?student_id=${studentId}`);
    }

    markCompleted(filters: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/institute/mark_completed`, filters);
    }

    // Dashboard Stats
    getStats(): Observable<DashboardStats> {
        return this.http.get<any>(`${this.apiUrl}/reports/dashboard_stats`).pipe(
            map(res => {
                const d = res?.data || {};
                return {
                    totalStudents: Number(d.totalStudents || 0),
                    activeStudents: Number(d.activeStudents || 0),
                    completedStudents: Number(d.completedStudents || 0),
                    totalBatches: Number(d.totalBatches || 0),
                    totalCourses: Number(d.totalCourses || 0),
                    totalFeesCollected: Number(d.totalFeesCollected || 0)
                };
            })
        );
    }

    // Settings
    getSettings(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/institute/settings`).pipe(
            map(res => this.normalizeSettings(res?.data || {}))
        );
    }

    saveSettings(settings: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/institute/save_settings`, settings);
    }

    getNextRegNumber(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/institute/next_reg_number`).pipe(
            map(res => ({
                ...res,
                next: res?.data?.next
            }))
        );
    }

    getNextStaffId(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/institute/next_staff_id`).pipe(
            map(res => ({
                ...res,
                next: res?.data?.next
            }))
        );
    }

    getNextCourseId(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/institute/next_course_id`).pipe(
            map(res => ({
                ...res,
                next: res?.data?.next
            }))
        );
    }

    // Recent Activities — from real receipts + enrollments
    getRecentActivities(): Observable<RecentActivity[]> {
        return this.http.get<any>(`${this.apiUrl}/reports/recent_activities`).pipe(
            map(res => res.data.map((a: any) => ({
                id: a.id,
                type: a.type as RecentActivity['type'],
                description: a.description,
                timestamp: a.timestamp
            })))
        );
    }

    // Upcoming Deadlines — students with balance + ongoing batches
    getUpcomingDeadlines(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/reports/upcoming_deadlines`).pipe(
            map(res => res.data)
        );
    }

    // Staff Dashboard
    getMyStudents(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/institute/my_students`);
    }

    getMyCourses(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/institute/my_courses`);
    }

    getMyBatches(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/institute/my_batches`);
    }

    getStaffResources(staffId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/institute/staff_resources?staff_id=${staffId}`);
    }

    scheduleClass(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/institute/schedule_class`, data);
    }

    deleteSchedule(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/institute/delete_schedule`, { id });
    }

    getMySchedule(date?: string): Observable<any> {
        return this.getMyScheduleWithStaff(date);
    }

    getMyScheduleWithStaff(date?: string, staffId?: string): Observable<any> {
        const params = new URLSearchParams();
        if (date) {
            params.set('date', date);
        }
        if (staffId && staffId !== 'all') {
            params.set('staff_id', staffId);
        }
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.http.get<any>(`${this.apiUrl}/institute/my_schedule${query}`);
    }

    clonePreviousSchedule(date: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/institute/clone_previous_schedule?date=${date}`);
    }

    // Exams (Reconstructed)
    getInternalExams(filters: any = {}): Observable<any[]> {
        let params = new HttpParams();
        if (filters.exam_date) params = params.set('exam_date', filters.exam_date);
        if (filters.date_from) params = params.set('date_from', filters.date_from);
        if (filters.date_to) params = params.set('date_to', filters.date_to);
        if (filters.created_from) params = params.set('created_from', filters.created_from);
        if (filters.created_to) params = params.set('created_to', filters.created_to);
        if (filters.q) params = params.set('q', filters.q);

        return this.http.get<any>(`${this.apiUrl}/exams/internal`, { params }).pipe(
            map(res => Array.isArray(res?.data) ? res.data : [])
        );
    }

    getExternalExams(filters: any = {}): Observable<any[]> {
        let params = new HttpParams();
        if (filters.exam_date) params = params.set('exam_date', filters.exam_date);
        if (filters.date_from) params = params.set('date_from', filters.date_from);
        if (filters.date_to) params = params.set('date_to', filters.date_to);
        if (filters.created_from) params = params.set('created_from', filters.created_from);
        if (filters.created_to) params = params.set('created_to', filters.created_to);
        if (filters.q) params = params.set('q', filters.q);

        return this.http.get<any>(`${this.apiUrl}/exams/external`, { params }).pipe(
            map(res => Array.isArray(res?.data) ? res.data : [])
        );
    }

    getExam(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/exams/internal?id=${id}`).pipe(
            map(res => Array.isArray(res?.data) ? (res.data[0] ?? null) : (res?.data ?? null))
        );
    }

    getExternalExam(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/exams/external?id=${id}`).pipe(
            map(res => Array.isArray(res?.data) ? (res.data[0] ?? null) : (res?.data ?? null))
        );
    }

    getAssignedExams(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/exams/assigned`).pipe(
            map(res => Array.isArray(res?.data) ? res.data : [])
        );
    }

    getStudentResults(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/exams/results`).pipe(
            map(res => Array.isArray(res?.data) ? res.data : [])
        );
    }

    saveInternalExam(exam: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/save_internal`, {
            ...exam,
            course_id: exam.course_id ?? exam.courseId,
            exam_date: exam.exam_date ?? exam.examDate
        });
    }

    saveExternalExam(exam: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/save_external`, {
            ...exam,
            course_id: exam.course_id ?? exam.courseId,
            exam_date: exam.exam_date ?? exam.examDate
        });
    }

    deleteExam(id: string, type: 'internal' | 'external' = 'internal'): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/delete`, { id, type });
    }

    assignExam(examId: string, studentIds: string[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/assign`, { exam_id: examId, student_ids: studentIds });
    }

    reassignExam(examId: string, studentId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/reassign`, { exam_id: examId, student_id: studentId });
    }

    saveExternalParticipant(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/save_participant`, data);
    }

    getExternalParticipants(examId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/exams/external_participants?exam_id=${examId}`);
    }

    bulkSaveParticipants(examId: string, participants: any[]): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/bulk_save_participants`, { exam_id: examId, participants });
    }

    getExternalSubmissions(examId?: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/exams/external_submissions${examId ? '?exam_id=' + examId : ''}`);
    }

    getExternalSubmissionDetails(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/exams/external_submission_details?id=${id}`);
    }

    evaluateExternalExam(payload: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/evaluate_external`, payload);
    }

    toggleExternalResults(examId: string, status: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/toggle_external_results`, { exam_id: examId, status });
    }

    getInstituteName(): Observable<any> {
        return this.http.get(`${this.apiUrl}/exams/institute_name`);
    }

    externalLogin(examId: any, email: any, password: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/external_login`, { exam_id: examId, email, password });
    }

    getExamSubmissions(examId: string): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/exams/submissions?exam_id=${examId}`).pipe(
            map(res => Array.isArray(res?.data) ? res.data : [])
        );
    }

    getPendingAssignments(examId: string): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/exams/pending_assignments?exam_id=${examId}`).pipe(
            map(res => Array.isArray(res?.data) ? res.data : [])
        );
    }

    getSubmissionDetails(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/exams/submission_details?id=${id}`).pipe(
            map(res => res?.data ?? null)
        );
    }

    evaluateSubmission(submissionId: string, evaluations: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/evaluate`, { submission_id: submissionId, evaluations });
    }

    savePerformanceSubmission(submission: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/save_performance`, submission);
    }

    submitInternalExam(submission: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/submit_internal`, submission);
    }

    submitExternalExam(submission: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/submit_external`, submission);
    }

    // Question Bank
    getQuestionBank(courseId?: string): Observable<QuestionBankItem[]> {
        const query = courseId ? `?course_id=${courseId}` : '';
        return this.http.get<any>(`${this.apiUrl}/exams/question_bank${query}`).pipe(
            map(res => (res.data || []).map((t: any) => ({
                id: t.id,
                title: t.title,
                courseId: t.course_id,
                questions: t.questions?.map((q: any) => ({
                    ...q,
                    options: q.options?.map((o: any) => ({
                        ...o,
                        option_text: o.option_text ?? o.optionText ?? '',
                        is_correct: o.is_correct != null ? o.is_correct == 1 : o.isCorrect == 1
                    }))
                })) || []
            })))
        );
    }

    saveQuestionBankItem(item: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/save_question_bank`, {
            ...item,
            course_id: item.course_id ?? item.courseId
        });
    }

    deleteQuestionBankItem(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/exams/delete_question_bank`, { id });
    }

    // Study Materials
    getStudyMaterials(filters: any = {}): Observable<StudyMaterial[]> {
        const query = this.buildQuery(filters);
        return this.http.get<any>(`${this.apiUrl}/operations/study_materials${query}`).pipe(
            map(res => (res.data || []).map((m: any) => ({
                id: String(m.id),
                title: m.title,
                description: m.description,
                courseId: m.course_id,
                courseName: m.course_name,
                fileUrl: m.file_url,
                fileName: m.file_name,
                fileType: m.file_type,
                targetType: m.target_type,
                targetIds: this.parseArrayField(m.target_ids || m.targetIds),
                batch_target_ids: this.parseArrayField(m.batch_target_ids || m.batch_ids || m.batchIds),
                student_target_ids: this.parseArrayField(m.student_target_ids || m.student_ids || m.studentIds),
                targetNames: this.parseArrayField(m.target_names),
                uploadedBy: m.uploaded_by,
                uploadedByName: m.uploaded_by_name,
                uploadedAt: m.uploaded_at
            })))
        );
    }

    getMyStudyMaterials(): Observable<StudyMaterial[]> {
        return this.http.get<any>(`${this.apiUrl}/operations/my_study_materials`).pipe(
            map(res => (res.data || []).map((m: any) => ({
                id: m.id,
                title: m.title,
                description: m.description,
                courseId: m.course_id,
                courseName: m.course_name,
                fileUrl: m.file_url,
                fileName: m.file_name,
                fileType: m.file_type,
                targetType: m.target_type,
                targetIds: this.parseArrayField(m.target_ids || m.targetIds),
                batch_target_ids: this.parseArrayField(m.batch_target_ids || m.batch_ids || m.batchIds),
                student_target_ids: this.parseArrayField(m.student_target_ids || m.student_ids || m.studentIds),
                targetNames: this.parseArrayField(m.target_names),
                uploadedBy: m.uploaded_by,
                uploadedByName: m.uploaded_by_name,
                uploadedAt: m.uploaded_at
            })))
        );
    }

    saveStudyMaterial(material: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/operations/save_study_material`, material);
    }

    deleteStudyMaterial(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/operations/delete_study_material`, { id });
    }

    uploadStudyMaterial(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('material', file);
        return this.http.post<any>(`${this.apiUrl}/operations/upload_study_material`, formData).pipe(
            map(res => ({
                ...res,
                file_path: res?.data?.path,
                file_name: res?.data?.file_name,
                file_type: res?.data?.file_type
            }))
        );
    }

    // New Features
    search(query: string): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/institute/search?q=${query}`).pipe(map(res => res.data || []));
    }

    getNotifications(): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/institute/notifications`).pipe(map(res => res.data || []));
    }

    markNotificationsRead(): Observable<any> {
        return this.http.post(`${this.apiUrl}/institute/mark_notification_read`, {});
    }

    getAttendanceReport(filters: any = {}): Observable<any[]> {
        const query = this.buildQuery(filters);
        return this.http.get<any>(`${this.apiUrl}/reports/attendance_report${query}`).pipe(
            map(res => (res.data || []).map((s: any) => ({
                ...s,
                total_sessions: parseInt(s.total_sessions) || 0,
                present_count: parseInt(s.present_count) || 0,
                absent_count: parseInt(s.absent_count) || 0,
                percentage: s.total_sessions > 0 ? Math.round((s.present_count / s.total_sessions) * 100) : 0
            })))
        );
    }

    getProfitLoss(filters: any = {}): Observable<any> {
        const query = this.buildQuery(filters);
        return this.http.get<any>(`${this.apiUrl}/reports/profit_loss${query}`).pipe(map(r => r.data));
    }

    getExpensesReport(filters: any = {}): Observable<any[]> {
        const query = this.buildQuery(filters);
        return this.http.get<any>(`${this.apiUrl}/reports/expenses_report${query}`).pipe(map(r => r.data));
    }

    getBatchPerformance(filters: any = {}): Observable<any[]> {
        const query = this.buildQuery(filters);
        return this.http.get<any>(`${this.apiUrl}/reports/batch_performance${query}`).pipe(map(r => r.data || []));
    }

    getCourseRevenue(filters: any = {}): Observable<any[]> {
        const query = this.buildQuery(filters);
        return this.http.get<any>(`${this.apiUrl}/reports/course_revenue${query}`).pipe(map(r => r.data || []));
    }

    getEnrollmentTrends(filters: any = {}): Observable<any[]> {
        const query = this.buildQuery(filters);
        return this.http.get<any>(`${this.apiUrl}/reports/enrollment_trends${query}`).pipe(map(r => r.data || []));
    }

    getStudentMap(filters: any = {}): Observable<any[]> {
        const query = this.buildQuery(filters);
        return this.http.get<any>(`${this.apiUrl}/reports/student_map${query}`).pipe(map(r => r.data || []));
    }

    getAuditLogs(filters: any = {}): Observable<any[]> {
        const query = this.buildQuery(filters);
        return this.http.get<any>(`${this.apiUrl}/reports/audit_logs${query}`).pipe(map(r => r.data || []));
    }

    getStaffWorklog(filters: any = {}): Observable<any[]> {
        const query = this.buildQuery(filters);
        return this.http.get<any>(`${this.apiUrl}/reports/staff_worklog${query}`).pipe(map(r => r.data || []));
    }

    // Expenses
    getExpenses(filters: any = {}): Observable<Expense[]> {
        const query = this.buildQuery(filters);
        return this.http.get<any>(`${this.apiUrl}/operations/expenses${query}`).pipe(
            map(res => {
                const raw = res.data || [];
                return raw.map((ex: any) => ({
                    ...ex,
                    expense_date: ex.expense_date || ex.expenseDate,
                    payment_method: ex.payment_method || ex.paymentMethod,
                    reference_no: ex.reference_no || ex.referenceNo,
                    created_by: ex.created_by || ex.createdBy
                }));
            })
        );
    }

    saveExpense(expense: Expense): Observable<any> {
        return this.http.post(`${this.apiUrl}/operations/save_expense`, expense);
    }

    deleteExpense(id: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/operations/delete_expense`, { id });
    }

    getExpenseStats(filters: any = {}): Observable<any[]> {
        const query = this.buildQuery(filters);
        return this.http.get<any>(`${this.apiUrl}/operations/expense_stats${query}`).pipe(map(res => res.data || []));
    }

    getCustomFields(location?: string): Observable<any[]> {
        const query = location ? `?location=${location}` : '';
        return this.http.get<any>(`${this.apiUrl}/customfields${query}`).pipe(
            map(res => (res.data || []).map((f: any) => ({
                ...f,
                id: f.id || f.field_id || f.custom_field_id || f.fieldId,
                location: f.location,
                field_label: f.field_label || f.label || f.name || f.field_name || f.fieldLabel || f.fieldName || '',
                field_type: f.field_type || f.type || f.input_type || f.fieldType || f.inputType || 'text',
                is_required: !!f.is_required || !!f.isRequired,
                options: f.options || ''
            })))
        );
    }

    getCustomFieldValues(location: string, entityId: string): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/customfields/entity_values?location=${location}&entity_id=${entityId}`).pipe(map(res => res.data || []));
    }

    saveCustomField(field: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/customfields/save`, field);
    }

    deleteCustomField(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/customfields/delete?id=${id}`);
    }

    private buildQuery(filters: any): string {
        let params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined) {
                params.set(key, filters[key]);
            }
        });
        return params.toString() ? '?' + params.toString() : '';
    }

    // Branches
    getBranches(): Observable<Branch[]> {
        return this.http.get<Branch[]>(`${this.apiUrl}/branches`);
    }

    getActiveBranches(): Observable<Branch[]> {
        return this.http.get<Branch[]>(`${this.apiUrl}/branches/active`);
    }

    saveBranch(branch: Branch): Observable<Branch> {
        if (branch.id) {
            return this.http.put<Branch>(`${this.apiUrl}/branches/${branch.id}`, branch);
        }
        return this.http.post<Branch>(`${this.apiUrl}/branches`, branch);
    }

    deleteBranch(id: string | number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/branches/${id}`);
    }

    setMainBranch(id: string | number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/branches/${id}/set-main`, {});
    }

    private parseArrayField(value: unknown): string[] {
        if (Array.isArray(value)) {
            return value.map(item => String(item));
        }
        if (typeof value !== 'string' || !value.trim()) {
            return [];
        }
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.map(item => String(item)) : [];
        } catch {
            return [];
        }
    }

    private normalizeSettings(settings: any): any {
        return {
            ...settings,
            institute_name: settings?.institute_name ?? settings?.instituteName,
            registration_id: settings?.registration_id ?? settings?.registrationId,
            logo_path: settings?.logo_path ?? settings?.logoPath,
            reg_prefix: settings?.reg_prefix ?? settings?.regPrefix,
            reg_suffix: settings?.reg_suffix ?? settings?.regSuffix,
            reg_start_from: settings?.reg_start_from ?? settings?.regStartFrom,
            reg_mode: settings?.reg_mode ?? settings?.regMode,
            reg_last_number: settings?.reg_last_number ?? settings?.regLastNumber,
            staff_id_prefix: settings?.staff_id_prefix ?? settings?.staffIdPrefix,
            staff_id_suffix: settings?.staff_id_suffix ?? settings?.staffIdSuffix,
            staff_id_start_from: settings?.staff_id_start_from ?? settings?.staffIdStartFrom,
            staff_id_mode: settings?.staff_id_mode ?? settings?.staffIdMode,
            staff_id_last_number: settings?.staff_id_last_number ?? settings?.staffIdLastNumber,
            course_id_prefix: settings?.course_id_prefix ?? settings?.courseIdPrefix,
            course_id_suffix: settings?.course_id_suffix ?? settings?.courseIdSuffix,
            course_id_start_from: settings?.course_id_start_from ?? settings?.courseIdStartFrom,
            course_id_mode: settings?.course_id_mode ?? settings?.courseIdMode,
            course_id_last_number: settings?.course_id_last_number ?? settings?.courseIdLastNumber,
            appearance_color: settings?.appearance_color ?? settings?.appearanceColor,
            appearance_mode: settings?.appearance_mode ?? settings?.appearanceMode,
            admin_as_staff: settings?.admin_as_staff ?? settings?.adminAsStaff,
            allow_performance_exams: settings?.allow_performance_exams ?? settings?.allowPerformanceExams,
            enableMultipleBranches: settings?.enableMultipleBranches ?? settings?.enable_multiple_branches
        };
    }
}
