export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    role_name?: string;
    token?: string;
}

export interface Course {
    id: string;
    course_id?: string;
    name: string;
    description: string;
    category?: string;
    duration: string; // e.g., "3 Months"
    fees: number;
    status: 'active' | 'inactive';
    syllabusPath?: string;
    imagePath?: string;
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
}

export interface Student {
    id: string;
    regNumber?: string;
    name: string;
    fatherName?: string;
    mobile: string;
    parentMobile?: string;
    dob?: string;
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
    instructor?: string;
    instructorName?: string;
    timing?: string;
    startDate?: string;
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
    question_type: 'mcq' | 'text';
    question_text: string;
    marks: number;
    options?: {
        id?: string;
        option_text: string;
        is_correct: number | boolean;
    }[];
    correctAnswer?: string;
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
    title: string; // e.g., "Sample Test", "Slip Test", "Model Exam"
    questions: ExamQuestion[];
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
    phone?: string;
    email?: string;
    isMain: boolean;
    status: 'active' | 'inactive';
    createdAt?: string;
}
