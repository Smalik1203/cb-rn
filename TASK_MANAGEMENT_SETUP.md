# Task Management Feature - Setup Instructions

## Required Dependencies

The task management feature requires two additional React Native packages:

### 1. Install expo-document-picker
```bash
npx expo install expo-document-picker
```

### 2. Install @react-native-community/datetimepicker
```bash
npx expo install @react-native-community/datetimepicker
```

## After Installation

Run the development server:
```bash
npx expo start
```

## Features Implemented

### ✅ For Admin/Teachers:
- **Create Task** - Floating Action Button (FAB) to open form
- **Edit Task** - Three-dot menu on each task card
- **Delete Task** - Three-dot menu with confirmation dialog
- **Task Form** with fields:
  - Task Title (required)
  - Priority (Low/Medium/High/Urgent)
  - Class selection (required)
  - Subject selection (required)
  - Assigned Date (date picker)
  - Due Date (date picker)
  - File Attachments (document picker, max 10MB)
  - Description (optional, 1000 chars)
  - Instructions (optional, 1000 chars)

### ✅ For Students:
- View tasks assigned to their class
- Checkbox to mark tasks complete/incomplete
- View task details, attachments, due dates

### ✅ Filters:
- Search by title/description
- Filter by Class
- Filter by Subject
- Filter by Priority
- Active filters display with remove chips

### ✅ Real-time Stats:
- Total tasks
- Upcoming tasks
- Overdue tasks

### ✅ Task Display:
- Priority badges (color-coded)
- Due date status (Overdue/Due Today/Due Soon/Upcoming)
- Subject and class tags
- Attachment indicators
- Pull-to-refresh

## Database Integration

All data is fetched from and saved to Supabase:
- `tasks` table - Main task data
- `task_submissions` table - Student completion tracking
- `student` table - Student information
- `subjects` table - Subject names
- `class_instances` table - Class information
- `academic_years` table - Academic year data

## File Structure

```
/Users/shivagowtham/Desktop/cb-rn/
├── app/(tabs)/tasks.tsx                     # Main tasks screen
├── src/
│   ├── hooks/
│   │   └── useTasks.ts                      # Data fetching hooks
│   └── components/
│       └── tasks/
│           └── TaskFormModal.tsx            # Create/Edit form
```

## Usage

### Creating a Task (Admin/Teacher):
1. Tap the "Create Task" FAB button (bottom-right)
2. Fill in the required fields
3. Optionally add attachments
4. Tap "Create Task"

### Editing a Task (Admin/Teacher):
1. Tap the three-dot menu on a task card
2. Select "Edit"
3. Modify fields as needed
4. Tap "Update Task"

### Deleting a Task (Admin/Teacher):
1. Tap the three-dot menu on a task card
2. Select "Delete"
3. Confirm deletion

### Completing a Task (Student):
1. Tap the checkbox next to a task
2. Task is automatically marked as complete
3. Tap again to mark incomplete

## Notes

- File upload to Supabase Storage is prepared but requires additional setup
- Maximum file size: 10MB per file
- Supported file types: Images, PDF, DOC, DOCX, TXT
- Tasks are soft-deleted (is_active = false)
- Students can only see tasks for their assigned class

