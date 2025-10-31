# Test Management Implementation Plan for React Native

## Overview
Based on the ClassBridge V1 web application, this document outlines how to implement a comprehensive Test Management System in the React Native app (cb-rn).

## Database Schema (Already Exists! ✅)

Your React Native app already has all the necessary tables:

### Core Tables
1. **`tests`** - Test definitions
   - `id`, `title`, `description`
   - `class_instance_id`, `subject_id`, `school_code`
   - `test_type` (Unit Test, Chapter Test, Assignment, etc.)
   - `test_mode` (online/offline)
   - `time_limit_seconds`
   - `test_date`, `status`
   - `allow_reattempts`

2. **`test_questions`** - Questions for online tests
   - `id`, `test_id`
   - `question_text`, `question_type` (mcq, one_word, long_answer)
   - `options[]`, `correct_index`, `correct_text`
   - `points`, `order_index`

3. **`test_attempts`** - Student test attempts (for online tests)
   - `id`, `test_id`, `student_id`
   - `answers` (jsonb), `score`
   - `status` (in_progress, completed, abandoned)
   - `started_at`, `completed_at`
   - `earned_points`, `total_points`

4. **`test_marks`** - Manual marks (for offline tests)
   - `id`, `test_id`, `student_id`
   - `marks_obtained`, `max_marks`
   - `remarks`, `created_by`

---

## Features to Implement

### 1. **Assessments Overview** (Main Dashboard)
**File**: `app/(tabs)/assessments.tsx`

**Features**:
- ✅ Statistics Cards:
  - Total Assessments
  - Scheduled Tests
  - Completed Tests
  - Graded Tests

- ✅ Test List with filters:
  - Filter by class, subject, status
  - Search by title
  - Sort by date/status

- ✅ Quick Actions:
  - Create new test
  - View test details
  - Edit/Delete test
  - Manage questions (for online tests)
  - Upload marks (for offline tests)

**Tabs**:
1. **All Tests** - List view with filters
2. **Create Test** - Form to create new test
3. **Results** - View test results and marks
4. **Analytics** - Performance analytics

---

### 2. **Create Test** (Test Creation Form)

**Form Fields**:
```typescript
{
  title: string;
  description: string;
  class_instance_id: uuid;
  subject_id: uuid;
  test_type: 'Unit Test' | 'Chapter Test' | 'Assignment' | 'Practical' | 'Project';
  test_mode: 'online' | 'offline';
  test_date: date;
  time_limit_seconds?: number; // Only for online tests
  allow_reattempts: boolean; // Only for online tests
  status: 'active' | 'inactive';
}
```

**UI Components**:
- Class selector dropdown
- Subject selector dropdown
- Test type selector
- Toggle for online/offline mode
- Date picker for test date
- Time limit input (online only)
- Allow reattempts toggle (online only)

---

### 3. **Question Builder** (For Online Tests Only)

**File**: `src/components/tests/QuestionBuilder.tsx`

**Features**:
- Add multiple question types:
  - **MCQ** (Multiple Choice Questions)
    - Question text
    - 4 options
    - Correct option selection
    - Points
  - **One Word Answer**
    - Question text
    - Correct answer text
    - Points
  - **Long Answer**
    - Question text
    - Points (manual grading)

- Question Management:
  - Add new question
  - Edit existing question
  - Delete question
  - Reorder questions (drag & drop or up/down buttons)
  - Preview question

**UI Layout**:
```
┌─────────────────────────────────────┐
│ Question Builder - Math Unit Test 1 │
├─────────────────────────────────────┤
│ [+ Add MCQ] [+ Add One Word] [+ Long Answer]
│                                      │
│ Question 1 (10 points)               │
│ ┌─────────────────────────────────┐ │
│ │ What is 2+2?                    │ │
│ │ ○ 3                             │ │
│ │ ● 4 (Correct)                   │ │
│ │ ○ 5                             │ │
│ │ ○ 6                             │ │
│ └─────────────────────────────────┘ │
│ [Edit] [Delete] [↑] [↓]             │
│                                      │
│ Question 2 (5 points)                │
│ ...                                  │
│                                      │
│ [Save Questions] [Preview]           │
└─────────────────────────────────────┘
```

---

### 4. **Test Taking Screen** (For Students - Online Tests)

**File**: `src/components/tests/TestTakingScreen.tsx`

**Features**:
- Timer countdown (if time limit set)
- Question navigation:
  - Current question indicator
  - Next/Previous buttons
  - Question palette (all questions overview)
  - Mark for review
- Answer input:
  - Radio buttons for MCQ
  - Text input for one word
  - TextArea for long answer
- Auto-save answers (every 30 seconds)
- Submit test confirmation
- Warning before leaving test

**UI Layout**:
```
┌─────────────────────────────────────┐
│ Math Unit Test 1    ⏱️ 45:30 left  │
├─────────────────────────────────────┤
│ Question 3 of 20               [10 pts]
│                                      │
│ What is the capital of France?      │
│                                      │
│ ○ London                             │
│ ○ Berlin                             │
│ ○ Paris                              │
│ ○ Madrid                             │
│                                      │
│ [Mark for Review]                    │
│                                      │
│ ┌────────────────────────────────┐  │
│ │ Questions: 1 2 3 4 5 ...      │  │
│ │ ✓ ✓ ● □ □ □ ...              │  │
│ └────────────────────────────────┘  │
│                                      │
│ [← Previous]        [Next →]         │
│                  [Submit Test]       │
└─────────────────────────────────────┘
```

---

### 5. **Offline Test Marks Manager** (For Teachers)

**File**: `src/components/tests/OfflineTestMarksManager.tsx`

**Features**:
- View all students in class
- Enter marks for each student
- Bulk upload via Excel/CSV (optional)
- Add remarks per student
- Save marks
- View marks summary

**UI Layout**:
```
┌─────────────────────────────────────┐
│ Upload Marks - Science Practical    │
│ Class: Grade 10 - Section A         │
│ Max Marks: 50                        │
├─────────────────────────────────────┤
│ Student Name    Roll No.  Marks  Remarks
│ ─────────────────────────────────────
│ Amit Sharma     10A001    [42 ]  Excellent
│ Priya Singh     10A002    [38 ]  Good
│ Rahul Kumar     10A003    [45 ]  Outstanding
│ ...                                  │
│                                      │
│ Progress: 25/30 students marked      │
│                                      │
│ [Import Excel] [Save Marks]          │
└─────────────────────────────────────┘
```

---

### 6. **Test Results & Analytics**

**File**: `src/components/tests/TestResults.tsx`

**Features**:

**For Teachers**:
- Class-wise performance
- Subject-wise analytics
- Individual student performance
- Question-wise analysis (which questions were difficult)
- Export results to Excel/PDF

**For Students**:
- View own test results
- See correct answers (after test completion)
- Performance trends
- Subject-wise performance graph

**UI Components**:
- Result cards with percentage
- Grade badges (A+, A, B, etc.)
- Performance charts (bar/line charts)
- Detailed answer review

---

## Component Structure

```
src/
├── components/
│   └── tests/
│       ├── TestCard.tsx                 # Single test card component
│       ├── TestList.tsx                 # List of tests
│       ├── TestForm.tsx                 # Create/Edit test form
│       ├── QuestionBuilder.tsx          # Build questions for online tests
│       ├── QuestionCard.tsx             # Single question display
│       ├── TestTakingScreen.tsx         # Student test taking interface
│       ├── OfflineTestMarksManager.tsx  # Upload marks for offline tests
│       ├── TestResults.tsx              # View test results
│       ├── TestAnalytics.tsx            # Analytics dashboard
│       └── index.ts                     # Export all components
│
├── hooks/
│   ├── useTests.ts                      # Fetch tests
│   ├── useTestQuestions.ts              # Fetch/manage questions
│   ├── useTestAttempts.ts               # Manage test attempts
│   └── useTestMarks.ts                  # Manage offline marks
│
├── services/
│   └── api.ts                           # Add test-related API functions
│
app/(tabs)/
└── assessments.tsx                      # Main assessments screen
```

---

## API Services to Create

**File**: `src/services/api.ts`

```typescript
// Tests
export const getTests = (schoolCode: string, classInstanceId?: string)
export const createTest = (testData: TestInput)
export const updateTest = (testId: string, testData: Partial<TestInput>)
export const deleteTest = (testId: string)

// Questions (Online Tests)
export const getTestQuestions = (testId: string)
export const createQuestion = (questionData: QuestionInput)
export const updateQuestion = (questionId: string, data: Partial<QuestionInput>)
export const deleteQuestion = (questionId: string)
export const reorderQuestions = (testId: string, questionIds: string[])

// Test Attempts (Student Side - Online)
export const startTestAttempt = (testId: string, studentId: string)
export const saveTestAnswers = (attemptId: string, answers: object)
export const submitTest = (attemptId: string)
export const getStudentAttempts = (studentId: string)

// Test Marks (Offline Tests)
export const uploadTestMarks = (marks: TestMarkInput[])
export const getTestMarks = (testId: string)
export const updateStudentMark = (markId: string, data: Partial<TestMarkInput>)

// Analytics
export const getTestAnalytics = (testId: string)
export const getClassAnalytics = (classInstanceId: string)
export const getStudentAnalytics = (studentId: string)
```

---

## User Flows

### Teacher Flow (Creating Online Test)
1. Navigate to Assessments tab
2. Click "Create Test"
3. Fill test details:
   - Title, description
   - Select class & subject
   - Choose test type
   - Select "Online" mode
   - Set test date & time limit
4. Click "Save & Add Questions"
5. Question Builder opens
6. Add questions (MCQ, one word, long answer)
7. Set points for each question
8. Save questions
9. Activate test (status = active)

### Teacher Flow (Creating Offline Test)
1. Navigate to Assessments tab
2. Click "Create Test"
3. Fill test details:
   - Select "Offline" mode
   - Set max marks
4. Save test
5. After conducting test physically:
   - Open test
   - Click "Upload Marks"
   - Enter marks for each student
   - Add remarks
   - Save marks

### Student Flow (Taking Online Test)
1. Navigate to Assessments tab
2. See list of available tests
3. Click on active test
4. Click "Start Test"
5. Timer starts
6. Answer questions
7. Navigate between questions
8. Mark questions for review
9. Submit test
10. View results (if grading is automatic)

### Student Flow (Viewing Results)
1. Navigate to Results tab
2. See list of completed tests
3. Click on test to view:
   - Marks obtained
   - Percentage
   - Grade
   - Correct answers
   - Teacher remarks

---

## Key Differences: Online vs Offline Tests

| Feature | Online Test | Offline Test |
|---------|-------------|--------------|
| Questions | Stored in database (`test_questions`) | No questions stored |
| Student Interface | Take test in app | Conducted on paper |
| Marking | Auto-grading (MCQ, one word) | Manual entry by teacher |
| Results | Immediate (for auto-graded) | After teacher uploads |
| Time Limit | Enforced by app | Managed physically |
| Data Storage | `test_attempts` table | `test_marks` table |

---

## Implementation Priority

### Phase 1: Basic Test Management (Week 1)
1. ✅ Create assessments tab layout
2. ✅ Test list with filters
3. ✅ Create test form
4. ✅ Basic CRUD operations

### Phase 2: Offline Test Support (Week 2)
1. ✅ Marks upload interface
2. ✅ Student list with marks input
3. ✅ Save marks to database
4. ✅ View marks (student & teacher)

### Phase 3: Online Test - Questions (Week 3)
1. ✅ Question builder UI
2. ✅ MCQ question type
3. ✅ One word question type
4. ✅ Long answer question type
5. ✅ Question reordering

### Phase 4: Online Test - Taking (Week 4)
1. ✅ Test taking interface
2. ✅ Timer implementation
3. ✅ Answer storage
4. ✅ Auto-save functionality
5. ✅ Submit test

### Phase 5: Results & Analytics (Week 5)
1. ✅ Results display
2. ✅ Performance analytics
3. ✅ Charts and graphs
4. ✅ Export functionality

---

## Next Steps

1. **Review this document** - Make sure you understand all features
2. **Prioritize features** - Decide which to build first
3. **Start with Phase 1** - Basic test list and CRUD
4. **Create components incrementally** - One feature at a time

Would you like me to:
1. Start implementing Phase 1 (basic test management)?
2. Create the folder structure and base files?
3. Generate the TypeScript types for tests?
4. Build the hooks for data fetching?

Let me know what you'd like to start with!
