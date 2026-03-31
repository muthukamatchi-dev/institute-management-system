# Migration Mapping Report
## CodeIgniter 3 + Angular → Spring Boot + Angular (Latest)

---

## 1. Backend File-Level Mapping

### Controllers

| Original (CodeIgniter) | Migrated (Spring Boot) | Status |
|------------------------|------------------------|--------|
| `core/Api_Controller.php` | `security/TokenAuthFilter.java` + `config/SecurityConfig.java` | ✅ Complete |
| `controllers/api/Auth.php` | `controller/AuthController.java` + `service/AuthService.java` | ✅ Complete |
| `controllers/api/Institute.php` | `controller/InstituteController.java` + `service/InstituteService.java` | ✅ Complete |
| `controllers/api/Operations.php` | `controller/OperationsController.java` + `service/OperationsService.java` | ✅ Complete |
| `controllers/api/Reports.php` | `controller/ReportsController.java` + `service/ReportsService.java` | ✅ Complete |
| `controllers/api/CustomFields.php` | `controller/CustomFieldsController.java` | ✅ Complete |
| `controllers/api/Exams.php` | `controller/ExamsController.java` | ✅ API Contract (Stub implementations) |

### Models → JPA Entities + Repositories

| Original (CodeIgniter Model) | Migrated (Spring Boot) | Status |
|-------------------------------|------------------------|--------|
| `Auth_model.php` | `model/User.java`, `model/Staff.java`, `model/Student.java` + Repositories | ✅ Complete |
| `Institute_model.php` (1336 lines) | `model/Course.java`, `model/Batch.java`, `model/Student.java`, `model/Staff.java`, `model/InstituteSetting.java`, `model/ActivityLog.java`, `model/Notification.java`, `model/ScheduledClass.java` + `service/InstituteService.java` | ✅ Complete |
| `Operations_model.php` (499 lines) | `model/Fee.java`, `model/Receipt.java`, `model/Attendance.java`, `model/StudyMaterial.java`, `model/Expense.java` + `service/OperationsService.java` | ✅ Complete |
| `Exams_model.php` (1340 lines) | `model/Exam.java`, `model/ExamQuestion.java`, `model/ExamOption.java`, `model/ExamAssignment.java`, `model/ExamSubmission.java`, `model/ExamSubmissionAnswer.java`, `model/ExternalExam.java`, `model/ExternalQuestion.java`, `model/ExternalOption.java`, `model/ExternalParticipant.java`, `model/ExternalExamSubmission.java`, `model/ExternalSubmissionAnswer.java`, `model/QuestionTemplate.java`, `model/TemplateQuestion.java`, `model/TemplateOption.java` | ✅ Entity Complete |
| `Reports_model.php` (183 lines) | `service/ReportsService.java` | ✅ Complete |
| `Custom_fields_model.php` (105 lines) | `model/CustomField.java`, `model/CustomFieldValue.java` + Repositories | ✅ Complete |

### Configuration

| Original | Migrated | Status |
|----------|----------|--------|
| `config/database.php` | `src/main/resources/application.properties` | ✅ Complete |
| `config/routes.php` | Controller `@RequestMapping`/`@GetMapping`/`@PostMapping` annotations | ✅ Complete |

---

## 2. API Contract Mapping (All Endpoints Preserved)

### Auth API (`/api/auth/`)
| Method | Path | Original | Migration |
|--------|------|----------|-----------|
| POST | `/api/auth/login` | `Auth::login()` | `AuthController::login()` |
| POST | `/api/auth/logout` | `Auth::logout()` | `AuthController::logout()` |
| GET | `/api/auth/me` | `Auth::me()` | `AuthController::me()` |
| POST | `/api/auth/change_password` | `Auth::change_password()` | `AuthController::changePassword()` |
| POST | `/api/auth/update_profile` | `Auth::update_profile()` | `AuthController::updateProfile()` |

### Institute API (`/api/institute/`)
| Method | Path | Original | Migration |
|--------|------|----------|-----------|
| GET | `/api/institute/courses` | `Institute::courses()` | `InstituteController::getCourses()` |
| POST | `/api/institute/save_course` | `Institute::save_course()` | `InstituteController::saveCourse()` |
| POST | `/api/institute/delete_course` | `Institute::delete_course()` | `InstituteController::deleteCourse()` |
| GET | `/api/institute/batches` | `Institute::batches()` | `InstituteController::getBatches()` |
| POST | `/api/institute/save_batch` | `Institute::save_batch()` | `InstituteController::saveBatch()` |
| POST | `/api/institute/delete_batch` | `Institute::delete_batch()` | `InstituteController::deleteBatch()` |
| GET | `/api/institute/students` | `Institute::students()` | `InstituteController::getStudents()` |
| POST | `/api/institute/save_student` | `Institute::save_student()` | `InstituteController::saveStudent()` |
| POST | `/api/institute/delete_student` | `Institute::delete_student()` | `InstituteController::deleteStudent()` |
| GET | `/api/institute/staff` | `Institute::staff()` | `InstituteController::getStaff()` |
| POST | `/api/institute/save_staff` | `Institute::save_staff()` | `InstituteController::saveStaff()` |
| POST | `/api/institute/delete_staff` | `Institute::delete_staff()` | `InstituteController::deleteStaff()` |
| GET | `/api/institute/settings` | `Institute::settings()` | `InstituteController::getSettings()` |
| POST | `/api/institute/save_settings` | `Institute::save_settings()` | `InstituteController::saveSettings()` |
| GET | `/api/institute/next_reg_number` | `Institute::next_reg_number()` | `InstituteController::getNextRegNumber()` |
| GET | `/api/institute/next_staff_id` | `Institute::next_staff_id()` | `InstituteController::getNextStaffId()` |
| GET | `/api/institute/next_course_id` | `Institute::next_course_id()` | `InstituteController::getNextCourseId()` |
| GET | `/api/institute/search` | `Institute::search()` | `InstituteController::search()` |
| GET | `/api/institute/notifications` | `Institute::notifications()` | `InstituteController::getNotifications()` |
| POST | `/api/institute/mark_notification_read` | `Institute::mark_notification_read()` | `InstituteController::markNotificationRead()` |
| POST | `/api/institute/mark_completed` | `Institute::mark_completed()` | `InstituteController::markCompleted()` |
| POST | `/api/institute/update_allocation` | `Institute::update_allocation()` | `InstituteController::updateAllocation()` |
| POST | `/api/institute/schedule_class` | `Institute::schedule_class()` | `InstituteController::scheduleClass()` |
| POST | `/api/institute/delete_schedule` | `Institute::delete_schedule()` | `InstituteController::deleteSchedule()` |
| GET | `/api/institute/my_schedule` | `Institute::my_schedule()` | `InstituteController::getMySchedule()` |
| GET | `/api/institute/clone_previous_schedule` | `Institute::clone_previous_schedule()` | `InstituteController::clonePreviousSchedule()` |
| POST | `/api/institute/upload_syllabus` | `Institute::upload_syllabus()` | `InstituteController::uploadSyllabus()` |
| POST | `/api/institute/upload_course_image` | `Institute::upload_course_image()` | `InstituteController::uploadCourseImage()` |
| GET | `/api/institute/my_students` | `Institute::my_students()` | `InstituteController::getMyStudents()` |
| GET | `/api/institute/my_courses` | `Institute::my_courses()` | `InstituteController::getMyCourses()` |
| GET | `/api/institute/my_batches` | `Institute::my_batches()` | `InstituteController::getMyBatches()` |
| GET | `/api/institute/staff_resources` | `Institute::staff_resources()` | `InstituteController::getStaffResources()` |

### Operations API (`/api/operations/`)
| Method | Path | Original | Migration |
|--------|------|----------|-----------|
| GET | `/api/operations/fees` | `Operations::fees()` | `OperationsController::getFees()` |
| POST | `/api/operations/collect_fee` | `Operations::collect_fee()` | `OperationsController::collectFee()` |
| GET | `/api/operations/receipts` | `Operations::receipts()` | `OperationsController::getReceipts()` |
| GET | `/api/operations/get_attendance` | `Operations::get_attendance()` | `OperationsController::getAttendance()` |
| POST | `/api/operations/save_attendance` | `Operations::save_attendance()` | `OperationsController::saveAttendance()` |
| GET | `/api/operations/get_class_attendance` | `Operations::get_class_attendance()` | `OperationsController::getClassAttendance()` |
| GET | `/api/operations/student_progress` | `Operations::student_progress()` | `OperationsController::getStudentProgress()` |
| GET | `/api/operations/study_materials` | `Operations::study_materials()` | `OperationsController::getStudyMaterials()` |
| GET | `/api/operations/my_study_materials` | `Operations::my_study_materials()` | `OperationsController::getMyStudyMaterials()` |
| POST | `/api/operations/save_study_material` | `Operations::save_study_material()` | `OperationsController::saveStudyMaterial()` |
| POST | `/api/operations/delete_study_material` | `Operations::delete_study_material()` | `OperationsController::deleteStudyMaterial()` |
| POST | `/api/operations/upload_study_material` | `Operations::upload_study_material()` | `OperationsController::uploadStudyMaterial()` |
| GET | `/api/operations/expenses` | `Operations::expenses()` | `OperationsController::getExpenses()` |
| POST | `/api/operations/save_expense` | `Operations::save_expense()` | `OperationsController::saveExpense()` |
| POST | `/api/operations/delete_expense` | `Operations::delete_expense()` | `OperationsController::deleteExpense()` |
| GET | `/api/operations/expense_stats` | `Operations::expense_stats()` | `OperationsController::getExpenseStats()` |

### Reports API (`/api/reports/`)
| Method | Path | Original | Migration |
|--------|------|----------|-----------|
| GET | `/api/reports/dashboard_stats` | `Reports::dashboard_stats()` | `ReportsController::dashboardStats()` |
| GET | `/api/reports/recent_activities` | `Reports::recent_activities()` | `ReportsController::recentActivities()` |
| GET | `/api/reports/upcoming_deadlines` | `Reports::upcoming_deadlines()` | `ReportsController::upcomingDeadlines()` |
| GET | `/api/reports/attendance_report` | `Reports::attendance_report()` | `ReportsController::attendanceReport()` |
| GET | `/api/reports/profit_loss` | `Reports::profit_loss()` | `ReportsController::profitLoss()` |
| GET | `/api/reports/expenses_report` | `Reports::expenses_report()` | `ReportsController::expensesReport()` |
| GET | `/api/reports/batch_performance` | `Reports::batch_performance()` | `ReportsController::batchPerformance()` |
| GET | `/api/reports/course_revenue` | `Reports::course_revenue()` | `ReportsController::courseRevenue()` |
| GET | `/api/reports/enrollment_trends` | `Reports::enrollment_trends()` | `ReportsController::enrollmentTrends()` |
| GET | `/api/reports/student_map` | `Reports::student_map()` | `ReportsController::studentMap()` |
| GET | `/api/reports/audit_logs` | `Reports::audit_logs()` | `ReportsController::auditLogs()` |
| GET | `/api/reports/staff_worklog` | `Reports::staff_worklog()` | `ReportsController::staffWorklog()` |

### Exams API (`/api/exams/`) - All 25+ Endpoints
| Method | Path | Original | Migration |
|--------|------|----------|-----------|
| GET | `/api/exams/internal` | `Exams::internal()` | `ExamsController::getInternalExams()` |
| GET | `/api/exams/external` | `Exams::external()` | `ExamsController::getExternalExams()` |
| POST | `/api/exams/save_internal` | `Exams::save_internal()` | `ExamsController::saveInternalExam()` |
| POST | `/api/exams/save_external` | `Exams::save_external()` | `ExamsController::saveExternalExam()` |
| POST | `/api/exams/delete` | `Exams::delete()` | `ExamsController::deleteExam()` |
| POST | `/api/exams/assign` | `Exams::assign()` | `ExamsController::assignExam()` |
| POST | `/api/exams/reassign` | `Exams::reassign()` | `ExamsController::reassignExam()` |
| GET | `/api/exams/assigned` | `Exams::assigned()` | `ExamsController::getAssignedExams()` |
| GET | `/api/exams/results` | `Exams::results()` | `ExamsController::getResults()` |
| GET | `/api/exams/submissions` | `Exams::submissions()` | `ExamsController::getSubmissions()` |
| GET | `/api/exams/submission_details` | `Exams::submission_details()` | `ExamsController::getSubmissionDetails()` |
| GET | `/api/exams/pending_assignments` | `Exams::pending_assignments()` | `ExamsController::getPendingAssignments()` |
| POST | `/api/exams/evaluate` | `Exams::evaluate()` | `ExamsController::evaluateSubmission()` |
| POST | `/api/exams/submit_internal` | `Exams::submit_internal()` | `ExamsController::submitInternal()` |
| POST | `/api/exams/submit_external` | `Exams::submit_external()` | `ExamsController::submitExternal()` |
| POST | `/api/exams/save_performance` | `Exams::save_performance()` | `ExamsController::savePerformance()` |
| GET | `/api/exams/question_bank` | `Exams::question_bank()` | `ExamsController::getQuestionBank()` |
| POST | `/api/exams/save_question_bank` | `Exams::save_question_bank()` | `ExamsController::saveQuestionBank()` |
| POST | `/api/exams/delete_question_bank` | `Exams::delete_question_bank()` | `ExamsController::deleteQuestionBank()` |
| POST | `/api/exams/save_participant` | `Exams::save_participant()` | `ExamsController::saveParticipant()` |
| GET | `/api/exams/external_participants` | `Exams::external_participants()` | `ExamsController::getExternalParticipants()` |
| POST | `/api/exams/bulk_save_participants` | `Exams::bulk_save_participants()` | `ExamsController::bulkSaveParticipants()` |
| GET | `/api/exams/external_submissions` | `Exams::external_submissions()` | `ExamsController::getExternalSubmissions()` |
| GET | `/api/exams/external_submission_details` | `Exams::external_submission_details()` | `ExamsController::getExternalSubmissionDetails()` |
| POST | `/api/exams/evaluate_external` | `Exams::evaluate_external()` | `ExamsController::evaluateExternal()` |
| POST | `/api/exams/toggle_external_results` | `Exams::toggle_external_results()` | `ExamsController::toggleExternalResults()` |
| GET | `/api/exams/institute_name` | `Exams::institute_name()` | `ExamsController::getInstituteName()` |
| POST | `/api/exams/external_login` | `Exams::external_login()` | `ExamsController::externalLogin()` |

### Custom Fields API (`/api/customfields/`)
| Method | Path | Original | Migration |
|--------|------|----------|-----------|
| GET | `/api/customfields` | `CustomFields::index()` | `CustomFieldsController::getFields()` |
| GET | `/api/customfields/entity_values` | `CustomFields::entity_values()` | `CustomFieldsController::getEntityValues()` |
| POST | `/api/customfields/save` | `CustomFields::save()` | `CustomFieldsController::saveField()` |
| GET | `/api/customfields/delete` | `CustomFields::delete()` | `CustomFieldsController::deleteField()` |

---

## 3. Frontend Mapping

| Original File | Migrated File | Change |
|---------------|---------------|--------|
| `src/app/services/auth.service.ts` | Same structure, updated `apiUrl` to `http://localhost:8080/api/auth` | URL only |
| `src/app/services/data.service.ts` | Same structure, updated `apiUrl` to `http://localhost:8080/api` | URL only |
| `src/app/services/theme.service.ts` | No change | Identical |
| `src/app/models/index.ts` | No change | Identical |
| `src/app/app.routes.ts` | No change | Identical |
| `src/app/app.config.ts` | No change | Identical |
| `src/app/app.component.ts` | No change | Identical |
| All feature components | No change to logic or templates | Identical |

---

## 4. Multi-Tenant Additions

| Layer | Component | Implementation |
|-------|-----------|----------------|
| Backend | `TenantContext.java` | ThreadLocal holder for current tenant |
| Backend | `TokenAuthFilter.java` | Reads `X-Tenant-ID` from request header |
| Database | All tables | `tenant_id VARCHAR(100) DEFAULT 'default'` column added |
| Database | Indexes | `idx_*_tenant` indexes on all tenant_id columns |
| Frontend | HTTP Interceptor | Add `X-Tenant-ID` header (future implementation) |

---

## 5. Database Table Count

| Category | Count |
|----------|-------|
| Core tables | 12 (roles, users, settings, courses, batches, students, staff, fees, receipts, attendance, activity_log, notifications) |
| Schedule tables | 1 (scheduled_classes) |
| Exam tables | 6 (exams, exam_questions, exam_options, exam_assignments, exam_submissions, exam_answers) |
| External exam tables | 6 (external_exams, external_questions, external_options, external_participants, external_submissions, external_answers) |
| Study material tables | 2 (study_materials, study_material_assignments) |
| Expense tables | 1 (expenses) |
| Custom field tables | 2 (custom_fields, custom_field_values) |
| Question bank tables | 3 (question_templates, template_questions, template_options) |
| **Total** | **34 tables** |

---

## 6. Technology Stack Comparison

| Aspect | Original | Migrated |
|--------|----------|----------|
| Backend Framework | CodeIgniter 3 (PHP) | Spring Boot 3.2.5 (Java 17) |
| ORM | CodeIgniter Query Builder | Spring Data JPA / Hibernate |
| Authentication | Custom token in header | Spring Security + TokenAuthFilter |
| CORS | Manual headers in `Api_Controller.php` | `CorsConfig.java` |
| File Upload | PHP native `$_FILES` | Spring MultipartFile |
| Frontend Framework | Angular (older) | Angular 19+ (latest) |
| CSS Framework | Tailwind CSS | Tailwind CSS (preserved) |
| Database | MySQL | MySQL (same, with `tenant_id`) |
| API Response | `$this->response()` wrapper | `ApiResponse` DTO |
| Routing | `config/routes.php` | `@RequestMapping` annotations |
| Multi-tenancy | None | `X-Tenant-ID` header + ThreadLocal |
