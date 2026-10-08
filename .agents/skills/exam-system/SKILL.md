---
name: exam-system
description: Guidelines, architectures, and conventions for Classivo internal and external exam portals, question types, section handling, and candidate submissions.
---

# Classivo Exam & Assessment System

## 1. Architecture Overview
- **Shared Assessment Component**:
  - Desktop: `PublicExamPortalComponent` (`frontend/src/app/features/exams/public-exam-portal.component.ts`)
  - Mobile: `PublicExamPortalMobileComponent` (`frontend/src/app/features/exams/public-exam-portal-mobile.component.ts`)
  - Both routes (`/internal/exam/:examId` and `/public/exam/:examId`) utilize `deviceRoute` to load these components.
- **Backend Endpoints**:
  - `GET /api/exams/external?id=:id` / `/api/exams/external_exam_for_portal/:id`: Publicly accessible without authentication for taking external exams.
  - `POST /api/exams/submit_external`: Endpoint to submit answers.
  - `POST /api/exams/submit_internal`: Endpoint for authenticated internal students.

## 2. Question Types and Data Model
| Question Type | Input Component | Answer Storage | Evaluation |
|---|---|---|---|
| `mcq` | Multi-choice card selection | `selected_option_id` | Auto-graded against `ExternalOption.is_correct = 1` |
| `fillups` | Text `<input>` | `answer_text` | Auto-graded against `ExternalQuestion.correct_answer` (case-insensitive) |
| `descriptive` / `text` | Multi-line `<textarea>` | `answer_text` | Marked for faculty manual evaluation (`is_evaluated = 0`) |
| `either_or` | Choice A/B toggle switch + `<textarea>` | `either_or_selected`, `either_a_text`, `either_b_text`, `answer_text` | Marked for faculty manual evaluation |
| `true_false` | True / False selection buttons | `answer_text` ('True' / 'False') | Auto-graded against `ExternalQuestion.correct_answer` |
| `section_header` / `section_break` | Full-width Section Banner card | Not scored / No answer required | Excluded from question counts & grading |

## 3. Section Handling Rules
1. **Identification**:
   A question is identified as a section if:
   - `is_section_title == true` or `is_section_break == true`
   - `question_type` is `'section_header'`, `'section_break'`, or `'section'`
   - `marks == 0` and the text starts with `SECTION`, `PART`, or roman numeral subheaders.
2. **Exclusion from Question Numbering**:
   - Section items must NOT be counted as questions (e.g. `Question 1 of 16` rather than `Part 1 of 20`).
   - Use `getQuestionNumber(i)` to compute ordinal numbering of actual questions.
   - Use `getTotalQuestionsCount()` to compute total count of actual questions.
3. **Display**:
   - Render a distinct amber-accented Section Announcement card with a prominent "Proceed to Section Questions →" button.
   - In progress dot strips, sections are rendered as horizontal pills (`w-6 h-2 rounded-sm bg-amber-500`) while questions are circular dots.

## 4. Submission Validation & Missed Questions Alert
- Before finalizing submission, run `getUnansweredQuestions()` to find questions where `!isQuestionAnswered(idx)`.
- If unanswered questions exist:
  - Display the submission confirmation modal with an **Incomplete Assessment** warning (⚠️).
  - Show clickable pill badges for each missed question (`Question X`) so students can click to jump directly to it and answer.
  - Offer a "Review Question X" button and a secondary "Submit Anyway" button.
- If all questions are answered:
  - Show **Assessment Complete** confirmation (✓) before locking the submission.
- On timer expiration (`handleTimeUp`), submission is executed immediately without blocking.
