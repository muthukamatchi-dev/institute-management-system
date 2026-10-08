export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    role_name?: string;
    token?: string;
    tenant_code?: string;
    is_read_only?: boolean;
}

export interface Course {
    id: string;
    course_id?: string;
    name: string;
    description: string;
    category?: string;
    duration: string; // e.g., "3 Months"
    fees: number;
    status: 'active' | 'inactive' | 'upcoming' | string;
    syllabusPath?: string;
    imagePath?: string;
    courseType?: string;
    course_type?: string;
    subjects?: any;
    feePeriod?: 'course' | 'day' | 'week' | 'month' | 'year';
    fee_period?: 'course' | 'day' | 'week' | 'month' | 'year';
    scheduleType?: 'Weekdays' | 'Weekends' | 'Weekdays + Weekends' | 'Custom Days' | string;
    schedule_type?: string;
    customDays?: string[] | string;
    custom_days?: string;
    isOnline?: boolean;
    is_online?: boolean;
    validFrom?: string;
    valid_from?: string;
    validTo?: string;
    valid_to?: string;
}

export interface Batch {
    id: string;
    batchName: string;
    courseId: string;
    courseName?: string;
    instructor?: string;
    instructorName?: string;
    timing: string; // e.g., "10:00 AM - 12:00 PM"
    startDate: string;
    status: 'ongoing' | 'completed' | 'upcoming';
    totalFees?: number;
    studentCount?: number;
    subject?: string;
}

export interface Student {
    id: string;
    regNumber?: string;
    name: string;
    fatherName?: string;
    mobile: string;
    parentMobile?: string;
    dob?: string;
    gender?: string;
    qualification?: string;
    email: string;
    courseId: string;
    courseName?: string;
    batchId: string;
    batchName?: string;
    joiningDate: string;
    feeStatus: 'paid' | 'pending' | 'partially_paid';
    status: 'active' | 'inactive' | 'completed' | 'suspended' | 'discontinued';
    referredBy?: string;
    referralProfession?: string;
    address?: string;
    instructor?: string;
    instructorName?: string;
    timing?: string;
    startDate?: string;
    selectedSubjects?: any;
    selected_subjects?: any;
    photo?: string;
    subjectAllocations?: string;
    batchIds?: number[];
    batchSubjects?: string[];
    enrolledCourseNames?: string[];
}

export interface FeeRecord {
    id: string;
    studentId: string;
    studentName?: string;
    regNumber?: string;
    batchId: string;
    batchName?: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    lastPaymentDate: string;
    status: 'paid' | 'pending' | 'partially_paid';
    studentStatus?: string;
    batchStatus?: string;
    paymentMethod?: string;
    refNo?: string;
    courseName?: string;
    reminder_date?: string;
    is_reminder_enabled?: number;
    course_duration?: string;
    course_fee_period?: string;
    course_fee_flat?: number;
    course_units?: number;
    monthly_amount?: number;
    fee_overdue?: number;
    this_period_payable?: number;
}

export interface AttendanceRecord {
    id: string;
    studentId: string;
    studentName?: string;
    batchId: string;
    date: string;
    status: 'present' | 'absent';
    studentStatus?: string;
}

export interface DashboardStats {
    totalStudents: number;
    activeStudents: number;
    completedStudents: number;
    totalBatches: number;
    totalCourses: number;
    totalFeesCollected: number;
    feeOverdue?: number;
}

export interface RecentActivity {
    id: string;
    type: 'enrollment' | 'fee_payment' | 'attendance' | 'course_added';
    description: string;
    timestamp: string;
}

export interface Staff {
    id: string;
    staff_id?: string;
    name: string;
    email: string;
    mobile: string;
    qualification: string;
    experience: string;
    designation: string;
    joiningDate: string;
    status: 'active' | 'inactive';
    salary?: number;
    photo?: string;
}

export interface Exam {
    id?: string;
    title: string;
    type: 'internal' | 'external';
    courseId?: string;
    totalMarks: number;
    durationMinutes: number;
    status: 'active' | 'stopped' | 'draft';
    createdAt?: string;
    questions?: ExamQuestion[];
}

export interface ExamQuestion {
    id?: string;
    examId?: string;
    question_type: 'mcq' | 'text' | 'fillups' | 'match' | 'true_false' | 'descriptive' | 'either_or' | 'section_header' | 'section_break' | string;
    question_text: string;
    question_a?: string;
    question_b?: string;
    marks: number;
    options?: {
        id?: string;
        option_text: string;
        is_correct: number | boolean;
    }[];
    correctAnswer?: string;
    correct_answer?: string;
    match_pairs?: { left: string; right: string }[];
    is_section_title?: boolean;
    is_section_break?: boolean;
}


export interface ExamSubmission {
    id?: string;
    examId: string;
    studentId?: string;
    participantId?: string;
    score: number;
    isEvaluated: boolean;
    submittedAt: string;
    answers?: any[];
}


export interface QuestionBankItem {
    id: string;
    courseId: string;
    courseName?: string;
    subject?: string;
    title: string; // e.g., "Sample Test", "Slip Test", "Model Exam"
    questions: any[];
    createdAt?: string;
}

export interface StudyMaterial {
    id: string;
    title: string;
    description?: string;
    courseId: string;
    courseName?: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    targetType: 'batch' | 'student' | 'all' | 'none' | 'mixed';
    targetIds: string[]; // batch IDs or student IDs (legacy/single)
    batch_target_ids?: string[];
    student_target_ids?: string[];
    targetNames?: string[]; // batch names or student names
    uploadedBy: string; // User ID
    uploadedByName?: string;
    uploadedAt: string;
    subject?: string;
}

export interface Expense {
    id?: string;
    title: string;
    category: string;
    amount: number;
    expense_date: string;
    description?: string;
    reference_no?: string;
    payment_method?: string;
    created_by?: string;
    created_by_name?: string;
    created_at?: string;
}

export interface Branch {
    id?: string | number;
    name: string;
    code: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    isMain: boolean;
    status: 'active' | 'inactive';
    createdAt?: string;
    updatedAt?: string;
}

export interface Program {
    id: string;
    programCode?: string;
    name: string;
    description: string;
    category?: string;
    totalDuration?: string;
    totalFee: number;
    feeMode: 'lump_sum' | 'per_module' | string;
    status: 'active' | 'inactive' | string;
    imagePath?: string;
    moduleCount?: number;
    modules?: ProgramModule[];
    createdAt?: string;
}

export interface ProgramModule {
    id: string;
    programId: string;
    courseId: string;
    courseName?: string;
    courseDuration?: string;
    courseFees?: number;
    courseType?: string;
    moduleOrder: number;
    moduleName?: string;
    isMandatory: boolean;
    prerequisiteType: 'NONE' | 'PREVIOUS_MODULE' | 'SPECIFIC_COURSE' | string;
    prerequisiteCourseId?: string;
    prerequisiteCourseName?: string;
    prerequisiteModuleId?: string;
    minAttendancePct?: number;
    minExamScorePct?: number;
}

export interface StudentProgramEnrollment {
    id: string;
    studentId: string;
    programId: string;
    enrollmentDate: string;
    completionDate?: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED' | 'DISCONTINUED' | string;
    currentModuleOrder: number;
}

export interface StudentModuleProgress {
    progressId?: string;
    moduleId: string;
    courseId: string;
    courseName?: string;
    courseDuration?: string;
    courseFees?: number;
    moduleOrder: number;
    moduleName: string;
    isMandatory: boolean;
    prerequisiteType: string;
    status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED' | string;
    unlockedAt?: string;
    startedAt?: string;
    completedAt?: string;
    batchId?: string;
}

