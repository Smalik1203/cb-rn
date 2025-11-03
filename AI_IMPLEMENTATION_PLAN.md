# 🤖 AI Features Implementation Plan
## School Management App - Krishnaveni Talent School

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Database Schema Changes](#database-schema-changes)
3. [Implementation Phases](#implementation-phases)
4. [Technical Stack](#technical-stack)
5. [Feature-by-Feature Implementation](#feature-by-feature-implementation)
6. [API Integration Guide](#api-integration-guide)
7. [Cost Estimates](#cost-estimates)
8. [Security & Privacy](#security--privacy)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Plan](#deployment-plan)

---

## 🎯 Overview

This document outlines the complete implementation plan for integrating AI features into the school management application. The plan is divided into 3 phases over 6 months, with each phase delivering production-ready features.

**Total Features**: 10 major AI capabilities
**Timeline**: 6 months (3 phases)
**Budget**: ~$500-800/month for AI APIs
**Team Required**: 2 developers + 1 QA

---

## 🗄️ Database Schema Changes

### Phase 1: Foundation Tables

#### 1. AI Question Bank Table
```sql
-- Store AI-generated questions
CREATE TABLE ai_generated_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_code TEXT NOT NULL REFERENCES schools(school_code),
  test_id UUID REFERENCES tests(id),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'mcq', 'one_word', 'subjective'
  options JSONB, -- Array of options for MCQ
  correct_answer TEXT,
  correct_index INTEGER,
  points INTEGER DEFAULT 10,
  difficulty_level TEXT, -- 'easy', 'medium', 'hard'
  subject_id UUID REFERENCES subjects(id),
  chapter_id UUID REFERENCES syllabus(id),
  topic_id UUID REFERENCES syllabus(id),
  source_content TEXT, -- Original content used to generate
  source_type TEXT, -- 'pdf', 'video', 'chapter'
  ai_model TEXT, -- 'gpt-4', 'claude', etc.
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  quality_score FLOAT, -- 0-100 based on teacher feedback
  usage_count INTEGER DEFAULT 0,
  teacher_approved BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_questions_school ON ai_generated_questions(school_code);
CREATE INDEX idx_ai_questions_subject ON ai_generated_questions(subject_id);
CREATE INDEX idx_ai_questions_difficulty ON ai_generated_questions(difficulty_level);
```

#### 2. AI Chat Conversations Table
```sql
-- Store chatbot conversations
CREATE TABLE ai_chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_code TEXT NOT NULL REFERENCES schools(school_code),
  user_id UUID NOT NULL, -- student_id or admin_id
  user_type TEXT NOT NULL, -- 'student', 'parent', 'teacher', 'admin'
  conversation_title TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- 'active', 'closed', 'archived'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB, -- Store context like subject, chapter, etc.
  tokens_used INTEGER,
  model TEXT, -- 'gpt-4', 'gpt-3.5-turbo', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_conversations_user ON ai_chat_conversations(user_id);
CREATE INDEX idx_chat_messages_conversation ON ai_chat_messages(conversation_id);
```

#### 3. AI Analytics & Predictions Table
```sql
-- Store AI predictions and insights
CREATE TABLE ai_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_code TEXT NOT NULL REFERENCES schools(school_code),
  prediction_type TEXT NOT NULL, -- 'exam_performance', 'attendance_risk', 'fee_default'
  student_id UUID REFERENCES students(id),
  class_instance_id UUID REFERENCES class_instances(id),
  prediction_value FLOAT, -- Score, percentage, etc.
  confidence_score FLOAT, -- 0-100
  factors JSONB, -- Contributing factors
  recommendation TEXT,
  predicted_for_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  actual_outcome FLOAT, -- For measuring accuracy
  outcome_recorded_at TIMESTAMPTZ
);

CREATE INDEX idx_predictions_student ON ai_predictions(student_id);
CREATE INDEX idx_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX idx_predictions_date ON ai_predictions(predicted_for_date);
```

#### 4. AI Grading Results Table
```sql
-- Store AI grading results for subjective answers
CREATE TABLE ai_grading_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_result_id UUID REFERENCES test_results(id),
  question_id UUID REFERENCES test_questions(id),
  student_answer TEXT,
  ai_score FLOAT,
  max_score FLOAT,
  feedback TEXT,
  rubric_scores JSONB, -- Breakdown by criteria
  teacher_override_score FLOAT,
  teacher_feedback TEXT,
  graded_by TEXT, -- 'gpt-4', 'claude', etc.
  graded_at TIMESTAMPTZ DEFAULT NOW(),
  teacher_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_grading_test_result ON ai_grading_results(test_result_id);
```

#### 5. AI Content Summaries Table
```sql
-- Store AI-generated summaries of resources
CREATE TABLE ai_content_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_code TEXT NOT NULL REFERENCES schools(school_code),
  resource_id UUID REFERENCES learning_resources(id),
  summary_type TEXT, -- 'brief', 'detailed', 'flashcards', 'notes'
  summary_content TEXT,
  key_points JSONB, -- Array of key points
  generated_by TEXT, -- AI model used
  language TEXT DEFAULT 'en',
  reading_time_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_summaries_resource ON ai_content_summaries(resource_id);
```

### Phase 2: Advanced Features

#### 6. AI Timetable Suggestions Table
```sql
-- Store AI-generated timetable suggestions
CREATE TABLE ai_timetable_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_code TEXT NOT NULL REFERENCES schools(school_code),
  class_instance_id UUID REFERENCES class_instances(id),
  suggestion_date DATE,
  timetable_data JSONB, -- Complete timetable structure
  optimization_score FLOAT, -- 0-100
  constraints_met JSONB, -- Which constraints were satisfied
  conflicts_detected JSONB, -- Any detected conflicts
  reasoning TEXT, -- Why this timetable is optimal
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES admins(id)
);

CREATE INDEX idx_timetable_suggestions_class ON ai_timetable_suggestions(class_instance_id);
```

#### 7. Student Learning Profiles Table
```sql
-- AI-generated student learning profiles
CREATE TABLE student_learning_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) UNIQUE,
  learning_style TEXT, -- 'visual', 'auditory', 'kinesthetic', 'mixed'
  attention_span_minutes INTEGER,
  best_performance_time TEXT, -- 'morning', 'afternoon', 'evening'
  strong_subjects JSONB, -- Array of subject IDs
  weak_subjects JSONB,
  preferred_content_types JSONB, -- 'video', 'pdf', 'interactive'
  engagement_score FLOAT, -- 0-100
  learning_pace TEXT, -- 'fast', 'medium', 'slow'
  profile_data JSONB, -- Complete profile with analytics
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_profile_student ON student_learning_profiles(student_id);
```

#### 8. AI Task Priorities Table
```sql
-- AI-calculated task priorities for students
CREATE TABLE ai_task_priorities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id),
  student_id UUID REFERENCES students(id),
  priority_score FLOAT, -- 0-100
  urgency_level TEXT, -- 'critical', 'high', 'medium', 'low'
  difficulty_estimate TEXT, -- 'easy', 'medium', 'hard'
  estimated_time_minutes INTEGER,
  recommended_start_date TIMESTAMPTZ,
  reasoning TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_priorities_student ON ai_task_priorities(student_id);
CREATE INDEX idx_task_priorities_task ON ai_task_priorities(task_id);
```

### Phase 3: Premium Features

#### 9. AI Resource Recommendations Table
```sql
-- Store AI-generated resource recommendations
CREATE TABLE ai_resource_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  resource_id UUID REFERENCES learning_resources(id),
  recommendation_reason TEXT,
  relevance_score FLOAT, -- 0-100
  based_on JSONB, -- Factors like weak subjects, syllabus progress
  recommended_at TIMESTAMPTZ DEFAULT NOW(),
  viewed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ,
  helpful BOOLEAN,
  feedback TEXT
);

CREATE INDEX idx_resource_recs_student ON ai_resource_recommendations(student_id);
```

#### 10. AI Attendance Patterns Table
```sql
-- Track and analyze attendance patterns
CREATE TABLE ai_attendance_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id),
  pattern_type TEXT, -- 'weekly', 'monthly', 'seasonal'
  pattern_description TEXT,
  risk_level TEXT, -- 'low', 'medium', 'high', 'critical'
  predicted_absences INTEGER,
  confidence FLOAT,
  recommendations JSONB, -- Actions to take
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_sent_at TIMESTAMPTZ
);

CREATE INDEX idx_attendance_patterns_student ON ai_attendance_patterns(student_id);
CREATE INDEX idx_attendance_patterns_risk ON ai_attendance_patterns(risk_level);
```

#### 11. AI Configuration & Settings Table
```sql
-- Store AI feature configurations
CREATE TABLE ai_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_code TEXT NOT NULL REFERENCES schools(school_code) UNIQUE,
  features_enabled JSONB, -- Which AI features are active
  api_keys_encrypted JSONB, -- Encrypted API keys
  model_preferences JSONB, -- Preferred models for each feature
  usage_limits JSONB, -- Monthly token limits, etc.
  auto_grading_threshold FLOAT, -- Min confidence to auto-grade
  notification_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_code TEXT NOT NULL REFERENCES schools(school_code),
  feature_type TEXT NOT NULL, -- 'question_gen', 'grading', 'chat', etc.
  model_used TEXT,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,4),
  user_id UUID, -- Who triggered the AI call
  user_type TEXT,
  response_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_logs_school ON ai_usage_logs(school_code);
CREATE INDEX idx_usage_logs_date ON ai_usage_logs(created_at);
```

---

## 🚀 Implementation Phases

### **Phase 1: Quick Wins (Months 1-2)**

**Goal**: Deploy 4 high-impact, easy-to-implement features

#### Features:
1. **AI Question Generator**
2. **AI Chatbot for Students/Parents**
3. **Attendance Pattern Analysis**
4. **Smart Notifications**

#### Timeline:
- **Week 1-2**: Database setup, API integration
- **Week 3-4**: Question Generator implementation
- **Week 5-6**: Chatbot implementation
- **Week 7**: Attendance pattern analysis
- **Week 8**: Testing & deployment

#### Deliverables:
- ✅ Working question generator in test creation flow
- ✅ Chatbot accessible from all screens
- ✅ Attendance risk alerts for admins
- ✅ Intelligent notification system

---

### **Phase 2: High Impact (Months 3-4)**

**Goal**: Deploy advanced analytics and automation features

#### Features:
5. **Predictive Analytics (Exam Performance)**
6. **AI Grading Assistant**
7. **AI Timetable Generator**
8. **Content Summarizer**

#### Timeline:
- **Week 9-10**: Predictive analytics model training
- **Week 11-12**: AI grading implementation
- **Week 13-14**: Timetable generator
- **Week 15-16**: Content summarizer + testing

#### Deliverables:
- ✅ Performance prediction dashboard
- ✅ Auto-grading for subjective tests
- ✅ One-click timetable generation
- ✅ Auto-summarize PDFs and videos

---

### **Phase 3: Premium Features (Months 5-6)**

**Goal**: Personalization and advanced recommendations

#### Features:
9. **Personalized Learning Paths**
10. **Smart Resource Recommendations**
11. **AI Task Prioritization**
12. **Student Learning Profiles**

#### Timeline:
- **Week 17-18**: Learning profile generation
- **Week 19-20**: Personalized learning paths
- **Week 21-22**: Resource recommendation engine
- **Week 23-24**: Final testing, optimization, deployment

#### Deliverables:
- ✅ Complete student learning profiles
- ✅ Personalized study recommendations
- ✅ Auto-prioritized task lists
- ✅ Adaptive resource suggestions

---

## 🛠️ Technical Stack

### AI/ML Services

| Feature | Recommended AI Service | Alternative | Cost/Month |
|---------|------------------------|-------------|------------|
| Question Generation | OpenAI GPT-4 | Claude 3 Sonnet | $200-300 |
| Chatbot | OpenAI GPT-3.5-turbo | Claude 3 Haiku | $100-150 |
| Grading | Claude 3 Sonnet | GPT-4 | $150-200 |
| Content Summarization | Claude 3 Sonnet | GPT-3.5-turbo | $50-100 |
| Predictions | Custom ML (TensorFlow) | AutoML | $0-50 |
| Pattern Analysis | Python (scikit-learn) | AWS SageMaker | $0-100 |

### Development Stack
```javascript
// Backend
- Supabase (PostgreSQL) - Already in use
- Edge Functions for AI API calls
- Python for ML models (optional)

// Frontend
- React Native (existing)
- New AI-specific hooks
- Real-time updates via Supabase subscriptions

// AI Integration
- OpenAI SDK
- Anthropic SDK (Claude)
- LangChain (optional for complex workflows)
```

---

## 📝 Feature-by-Feature Implementation

### **1. AI Question Generator**

#### Database Changes:
```sql
-- Already covered in ai_generated_questions table above
```

#### Implementation Steps:

**Step 1: Create AI Service**
```typescript
// src/services/aiQuestionGenerator.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateQuestions(params: {
  content: string;
  questionType: 'mcq' | 'one_word' | 'subjective';
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
  subject: string;
  chapter: string;
}) {
  const prompt = `Generate ${params.count} ${params.difficulty} ${params.questionType} questions from the following content:

Subject: ${params.subject}
Chapter: ${params.chapter}

Content:
${params.content}

Format each question as JSON with:
- question_text
- options (for MCQ, array of 4 options)
- correct_answer
- correct_index (for MCQ, 0-3)
- explanation

Return as a JSON array.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert educational content creator. Generate high-quality, accurate questions.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}
```

**Step 2: Create Database Hook**
```typescript
// src/hooks/useAIQuestions.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { generateQuestions } from '../services/aiQuestionGenerator';

export function useGenerateQuestions() {
  return useMutation({
    mutationFn: async (params: {
      content: string;
      testId: string;
      questionType: string;
      difficulty: string;
      count: number;
      subjectId: string;
      chapterId?: string;
    }) => {
      // Call AI service
      const questions = await generateQuestions(params);

      // Save to database
      const { data, error } = await supabase
        .from('ai_generated_questions')
        .insert(
          questions.map((q: any) => ({
            test_id: params.testId,
            question_text: q.question_text,
            question_type: params.questionType,
            options: q.options,
            correct_answer: q.correct_answer,
            correct_index: q.correct_index,
            difficulty_level: params.difficulty,
            subject_id: params.subjectId,
            chapter_id: params.chapterId,
            ai_model: 'gpt-4',
            source_content: params.content.substring(0, 500),
          }))
        )
        .select();

      if (error) throw error;
      return data;
    },
  });
}
```

**Step 3: Update UI Component**
```typescript
// src/components/tests/QuestionBuilderScreen.tsx
// Add new button:

<TouchableOpacity
  style={styles.aiGenerateButton}
  onPress={() => setShowAIGeneratorModal(true)}
>
  <Sparkles size={20} color="#fff" />
  <Text style={styles.aiButtonText}>Generate with AI</Text>
</TouchableOpacity>

// Add modal for AI generation:
<AIQuestionGeneratorModal
  visible={showAIGeneratorModal}
  onDismiss={() => setShowAIGeneratorModal(false)}
  testId={testId}
  onQuestionsGenerated={handleAIQuestionsGenerated}
/>
```

**Step 4: Create AI Generator Modal Component**
```typescript
// src/components/tests/AIQuestionGeneratorModal.tsx
export function AIQuestionGeneratorModal({ visible, onDismiss, testId, onQuestionsGenerated }) {
  const [content, setContent] = useState('');
  const [questionType, setQuestionType] = useState('mcq');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(10);
  const generateMutation = useGenerateQuestions();

  const handleGenerate = async () => {
    try {
      const questions = await generateMutation.mutateAsync({
        content,
        testId,
        questionType,
        difficulty,
        count,
        subjectId: /* get from context */,
      });
      onQuestionsGenerated(questions);
      onDismiss();
    } catch (error) {
      Alert.alert('Error', 'Failed to generate questions');
    }
  };

  return (
    <Modal visible={visible} onDismiss={onDismiss}>
      <View style={styles.container}>
        <Text variant="headlineSmall">Generate Questions with AI</Text>

        <TextInput
          label="Paste chapter content or PDF text"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={10}
        />

        <SegmentedButtons
          value={questionType}
          onValueChange={setQuestionType}
          buttons={[
            { value: 'mcq', label: 'MCQ' },
            { value: 'one_word', label: 'One Word' },
            { value: 'subjective', label: 'Subjective' },
          ]}
        />

        <SegmentedButtons
          value={difficulty}
          onValueChange={setDifficulty}
          buttons={[
            { value: 'easy', label: 'Easy' },
            { value: 'medium', label: 'Medium' },
            { value: 'hard', label: 'Hard' },
          ]}
        />

        <TextInput
          label="Number of questions"
          value={String(count)}
          onChangeText={(v) => setCount(parseInt(v))}
          keyboardType="number-pad"
        />

        <Button
          mode="contained"
          onPress={handleGenerate}
          loading={generateMutation.isPending}
        >
          Generate Questions
        </Button>
      </View>
    </Modal>
  );
}
```

---

### **2. AI Chatbot**

#### Database Changes:
```sql
-- Already covered in ai_chat_conversations and ai_chat_messages tables
```

#### Implementation Steps:

**Step 1: Create Chat Service**
```typescript
// src/services/aiChatbot.ts
import OpenAI from 'openai';
import { supabase } from '../lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function sendChatMessage(params: {
  conversationId: string;
  message: string;
  userId: string;
  userType: string;
  context?: any; // Student data, timetable, etc.
}) {
  // Get conversation history
  const { data: messages } = await supabase
    .from('ai_chat_messages')
    .select('*')
    .eq('conversation_id', params.conversationId)
    .order('created_at', { ascending: true });

  // Build context-aware system message
  const systemMessage = `You are a helpful school assistant. You have access to:
- Student timetable, attendance, grades
- School calendar and events
- Fee information
- Task assignments

User type: ${params.userType}
Context: ${JSON.stringify(params.context)}

Answer questions accurately and helpfully.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemMessage },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: params.message }
    ],
  });

  const assistantMessage = response.choices[0].message.content;

  // Save both messages to DB
  await supabase.from('ai_chat_messages').insert([
    {
      conversation_id: params.conversationId,
      role: 'user',
      content: params.message,
    },
    {
      conversation_id: params.conversationId,
      role: 'assistant',
      content: assistantMessage,
      model: 'gpt-3.5-turbo',
      tokens_used: response.usage?.total_tokens,
    }
  ]);

  return assistantMessage;
}
```

**Step 2: Create Chat Component**
```typescript
// src/components/chat/AIChatScreen.tsx
export function AIChatScreen() {
  const { profile } = useAuth();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const sendMessageMutation = useSendChatMessage();

  useEffect(() => {
    // Create or load conversation
    initializeConversation();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const response = await sendMessageMutation.mutateAsync({
      conversationId,
      message: inputText,
      userId: profile.id,
      userType: profile.role,
    });

    setInputText('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <MessageBubble message={item} />
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me anything..."
        />
        <IconButton icon="send" onPress={handleSend} />
      </View>
    </View>
  );
}
```

**Step 3: Add Floating Chat Button**
```typescript
// Add to DrawerContent.tsx or main layout
<TouchableOpacity
  style={styles.chatFab}
  onPress={() => router.push('/chat')}
>
  <MessageCircle size={24} color="#fff" />
</TouchableOpacity>
```

---

### **3. Attendance Pattern Analysis**

#### Implementation Steps:

**Step 1: Create Analysis Service**
```typescript
// src/services/attendanceAnalyzer.ts
export async function analyzeAttendancePatterns(studentId: string) {
  // Fetch last 3 months of attendance
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('student_id', studentId)
    .gte('date', dayjs().subtract(3, 'months').format('YYYY-MM-DD'))
    .order('date', { ascending: true });

  // Analyze patterns
  const patterns = {
    totalDays: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    percentage: 0,
    weekdayPattern: {},
    consecutiveAbsences: 0,
    riskLevel: 'low',
  };

  patterns.percentage = (patterns.present / patterns.totalDays) * 100;

  // Find weekday pattern
  attendance.forEach(a => {
    const day = dayjs(a.date).format('dddd');
    if (!patterns.weekdayPattern[day]) {
      patterns.weekdayPattern[day] = { total: 0, absent: 0 };
    }
    patterns.weekdayPattern[day].total++;
    if (a.status === 'absent') {
      patterns.weekdayPattern[day].absent++;
    }
  });

  // Determine risk level
  if (patterns.percentage < 75) patterns.riskLevel = 'critical';
  else if (patterns.percentage < 85) patterns.riskLevel = 'high';
  else if (patterns.percentage < 90) patterns.riskLevel = 'medium';

  // Save to database
  await supabase.from('ai_attendance_patterns').insert({
    student_id: studentId,
    pattern_type: 'monthly',
    pattern_description: `${patterns.percentage.toFixed(1)}% attendance. Frequently absent on ${getMostAbsentDay(patterns.weekdayPattern)}`,
    risk_level: patterns.riskLevel,
    confidence: 0.85,
    recommendations: generateRecommendations(patterns),
  });

  return patterns;
}
```

**Step 2: Add to Dashboard**
```typescript
// Update analytics.tsx to show attendance alerts
<AttendanceRiskAlerts />
```

---

### **4. Predictive Analytics**

#### Implementation Steps:

**Step 1: Create Prediction Model**
```typescript
// src/services/performancePredictor.ts
export async function predictExamPerformance(studentId: string, subjectId: string) {
  // Gather features
  const features = await gatherStudentFeatures(studentId, subjectId);

  // Simple weighted prediction (can be replaced with ML model)
  const prediction = calculatePrediction(features);

  // Save prediction
  await supabase.from('ai_predictions').insert({
    student_id: studentId,
    prediction_type: 'exam_performance',
    prediction_value: prediction.score,
    confidence_score: prediction.confidence,
    factors: prediction.factors,
    recommendation: prediction.recommendation,
  });

  return prediction;
}

function gatherStudentFeatures(studentId: string, subjectId: string) {
  // Get:
  // - Past test scores in this subject
  // - Attendance percentage
  // - Task completion rate
  // - Syllabus progress
  // - Time spent on resources
  // - Recent test trends
}

function calculatePrediction(features) {
  // Weighted algorithm:
  const weights = {
    pastScores: 0.40,
    attendance: 0.20,
    taskCompletion: 0.15,
    syllabusProgress: 0.15,
    trend: 0.10,
  };

  const score =
    features.avgPastScores * weights.pastScores +
    features.attendancePercentage * weights.attendance +
    features.taskCompletionRate * weights.taskCompletion +
    features.syllabusProgressPercentage * weights.syllabusProgress +
    features.recentTrend * weights.trend;

  return {
    score: Math.round(score),
    confidence: calculateConfidence(features),
    factors: identifyKeyFactors(features),
    recommendation: generateRecommendation(score, features),
  };
}
```

---

### **5. AI Grading Assistant**

#### Implementation:

**Step 1: Create Grading Service**
```typescript
// src/services/aiGrader.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function gradeSubjectiveAnswer(params: {
  question: string;
  expectedAnswer: string;
  studentAnswer: string;
  maxScore: number;
  rubric?: string[];
}) {
  const prompt = `Grade the following student answer:

Question: ${params.question}

Expected Answer: ${params.expectedAnswer}

Student Answer: ${params.studentAnswer}

Maximum Score: ${params.maxScore}

${params.rubric ? `Grading Rubric:\n${params.rubric.join('\n')}` : ''}

Provide:
1. Score (0-${params.maxScore})
2. Detailed feedback
3. Rubric scores (if applicable)
4. Suggestions for improvement

Return as JSON with: score, feedback, rubric_scores, suggestions`;

  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });

  const result = JSON.parse(response.content[0].text);

  // Save to database
  await supabase.from('ai_grading_results').insert({
    question_id: params.questionId,
    test_result_id: params.testResultId,
    student_answer: params.studentAnswer,
    ai_score: result.score,
    max_score: params.maxScore,
    feedback: result.feedback,
    rubric_scores: result.rubric_scores,
    graded_by: 'claude-3-sonnet',
  });

  return result;
}
```

---

## 🔌 API Integration Guide

### Environment Variables Setup

```bash
# .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AI_FEATURES_ENABLED=true
AI_USAGE_LIMIT_MONTHLY=100000 # tokens
```

### Supabase Edge Function for AI Calls

```typescript
// supabase/functions/ai-generate/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { action, params } = await req.json()

  // Verify user authentication
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  )

  // Check usage limits
  const { data: usage } = await supabaseClient
    .from('ai_usage_logs')
    .select('tokens_used')
    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1))

  const totalTokens = usage?.reduce((sum, u) => sum + u.tokens_used, 0) || 0
  if (totalTokens > 100000) {
    return new Response(JSON.stringify({ error: 'Monthly limit exceeded' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Route to appropriate AI service
  let result
  switch (action) {
    case 'generate_questions':
      result = await generateQuestions(params)
      break
    case 'grade_answer':
      result = await gradeAnswer(params)
      break
    // ... other actions
  }

  // Log usage
  await supabaseClient.from('ai_usage_logs').insert({
    feature_type: action,
    tokens_used: result.tokens,
    cost_usd: result.cost,
  })

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## 💰 Cost Estimates

### Monthly AI API Costs (Estimated)

| Feature | Usage Estimate | Cost/Month |
|---------|----------------|------------|
| Question Generation | 1000 questions | $150-200 |
| Chatbot | 5000 messages | $100-150 |
| Auto-Grading | 500 answers | $80-120 |
| Content Summaries | 200 resources | $40-60 |
| Predictions | Background processing | $30-50 |
| **TOTAL** | | **$400-580/month** |

### Scaling Considerations:
- **Small school (100 students)**: $200-300/month
- **Medium school (500 students)**: $500-700/month
- **Large school (1000+ students)**: $1000-1500/month

### Cost Optimization:
1. Use GPT-3.5-turbo for simple tasks ($10x cheaper than GPT-4)
2. Cache common responses
3. Implement rate limiting
4. Use Claude Haiku for basic queries
5. Batch processing for predictions

---

## 🔒 Security & Privacy

### Data Protection

1. **API Key Security**
```typescript
// Never expose API keys in frontend
// Always use Supabase Edge Functions or backend

// Encrypt API keys in database
import crypto from 'crypto';

function encryptAPIKey(key: string) {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  return cipher.update(key, 'utf8', 'hex') + cipher.final('hex');
}
```

2. **Student Data Privacy**
- Never send personally identifiable information to AI
- Anonymize data before AI processing
- Clear data retention policies

```typescript
function anonymizeStudentData(student) {
  return {
    id: hashId(student.id),
    performance: student.test_scores,
    attendance: student.attendance_percentage,
    // No name, email, or personal info
  };
}
```

3. **Rate Limiting**
```typescript
// Implement per-user rate limits
const RATE_LIMIT = {
  chat: 50, // messages per day
  question_gen: 100, // questions per day
  grading: 200, // answers per day
};
```

### Compliance
- **GDPR**: Right to delete AI-generated data
- **COPPA**: Parental consent for students under 13
- **FERPA**: Educational records privacy

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// __tests__/aiQuestionGenerator.test.ts
describe('AI Question Generator', () => {
  it('should generate MCQ questions', async () => {
    const result = await generateQuestions({
      content: 'Sample chapter text...',
      questionType: 'mcq',
      count: 5,
    });

    expect(result).toHaveLength(5);
    expect(result[0]).toHaveProperty('options');
    expect(result[0].options).toHaveLength(4);
  });
});
```

### Integration Tests
```typescript
// Test full workflow
it('should generate and save questions to database', async () => {
  const questions = await generateAndSaveQuestions({
    testId: 'test-123',
    content: 'Chapter content...',
  });

  const { data } = await supabase
    .from('ai_generated_questions')
    .select()
    .eq('test_id', 'test-123');

  expect(data).toHaveLength(questions.length);
});
```

### Load Testing
- Simulate 100 concurrent AI requests
- Test rate limiting
- Monitor token usage

---

## 🚢 Deployment Plan

### Phase 1 Deployment (Week 8)

**Pre-deployment:**
1. Run database migrations
2. Set up environment variables
3. Deploy Edge Functions
4. Enable AI features for test school

**Deployment:**
```bash
# Run migrations
npm run supabase:migrate

# Deploy edge functions
npm run supabase:deploy

# Update environment
npm run deploy:production
```

**Post-deployment:**
1. Monitor error logs
2. Track API costs
3. Gather user feedback
4. A/B test AI vs manual workflows

### Rollback Plan
```sql
-- Disable AI features
UPDATE ai_configurations
SET features_enabled = '{}'::jsonb
WHERE school_code = 'SCHOOL_CODE';

-- Revert to manual workflows
```

---

## 📊 Success Metrics

### KPIs to Track

| Metric | Target | Measurement |
|--------|--------|-------------|
| Question generation time saved | 80% reduction | Before: 2hr → After: 15min |
| Grading time saved | 70% reduction | Auto-grade accuracy >85% |
| Chatbot resolution rate | 60% of queries | % resolved without human |
| Attendance prediction accuracy | 80%+ | Compare predicted vs actual |
| Student engagement | +30% | Resource usage, task completion |
| Teacher satisfaction | 4.5/5 | Survey after 1 month |
| Cost per student/month | <$5 | Total AI costs / student count |

---

## 🛟 Support & Maintenance

### Monitoring
```typescript
// Set up monitoring dashboard
- API response times
- Error rates
- Token usage
- Cost tracking
- User feedback
```

### Regular Tasks
- **Daily**: Monitor costs, check error logs
- **Weekly**: Review AI-generated content quality
- **Monthly**: Analyze usage patterns, optimize costs
- **Quarterly**: Update models, retrain predictions

---

## 📚 Documentation

### User Guides Needed
1. **Teachers**: How to use AI question generator
2. **Students**: How to interact with AI tutor
3. **Admins**: How to configure AI settings
4. **Parents**: How to use chatbot for queries

### Technical Documentation
1. API reference for all AI services
2. Database schema documentation
3. Troubleshooting guide
4. Cost optimization guide

---

## 🎯 Next Steps

### Immediate Actions (Week 1)
1. ✅ Set up OpenAI account and get API key
2. ✅ Set up Anthropic account for Claude
3. ✅ Create database tables (run migrations)
4. ✅ Install required packages:
```bash
npm install openai @anthropic-ai/sdk
npm install --save-dev @types/openai
```

### Week 2-3
1. ✅ Implement question generator
2. ✅ Create UI components
3. ✅ Write tests
4. ✅ Deploy to staging

### Week 4-8
1. ✅ Roll out remaining Phase 1 features
2. ✅ Gather feedback
3. ✅ Optimize based on usage
4. ✅ Plan Phase 2

---

## 📞 Support

For questions or issues during implementation:
- **Technical Lead**: [Your contact]
- **AI/ML Consultant**: [Contact if needed]
- **Database Admin**: [Contact]

---

## 📝 Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-03 | 1.0 | Initial implementation plan |
| | | Database schema defined |
| | | 3-phase roadmap created |

---

**Document Status**: ✅ Ready for Implementation
**Last Updated**: January 3, 2025
**Next Review**: End of Phase 1 (Week 8)

