import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from './AuthContext';

// Action types
const TASK_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_TASKS: 'SET_TASKS',
  SET_ASSIGNMENTS: 'SET_ASSIGNMENTS',
  SET_PROJECTS: 'SET_PROJECTS',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  REFRESH_DATA: 'REFRESH_DATA',
} as const;

// Types
interface Task {
  id: string;
  title: string;
  description?: string;
  task_type: 'assignment' | 'project' | 'homework' | 'exam' | 'other';
  subject_id?: string;
  class_instance_id?: string;
  assigned_by: string;
  assigned_to?: string; // For individual assignments
  school_code: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  total_marks?: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  subject?: {
    id: string;
    subject_name: string;
  };
  class_instance?: {
    id: string;
    grade: number;
    section: string;
  };
  assigned_by_user?: {
    id: string;
    full_name: string;
  };
}

interface Assignment extends Task {
  task_type: 'assignment';
  submission_instructions?: string;
  allowed_file_types?: string[];
  max_file_size?: number;
}

interface Project extends Task {
  task_type: 'project';
  project_guidelines?: string;
  group_size?: number;
  collaboration_allowed: boolean;
}

// Initial state
interface TaskManagementState {
  loading: boolean;
  error: string | null;
  tasks: Task[];
  assignments: Assignment[];
  projects: Project[];
  lastUpdated: string | null;
}

const initialState: TaskManagementState = {
  loading: false,
  error: null,
  tasks: [],
  assignments: [],
  projects: [],
  lastUpdated: null
};

// Reducer
type TaskManagementAction = 
  | { type: typeof TASK_ACTIONS.SET_LOADING; payload: boolean }
  | { type: typeof TASK_ACTIONS.SET_ERROR; payload: string | null }
  | { type: typeof TASK_ACTIONS.SET_TASKS; payload: Task[] }
  | { type: typeof TASK_ACTIONS.SET_ASSIGNMENTS; payload: Assignment[] }
  | { type: typeof TASK_ACTIONS.SET_PROJECTS; payload: Project[] }
  | { type: typeof TASK_ACTIONS.ADD_TASK; payload: Task }
  | { type: typeof TASK_ACTIONS.UPDATE_TASK; payload: Task }
  | { type: typeof TASK_ACTIONS.DELETE_TASK; payload: string }
  | { type: typeof TASK_ACTIONS.REFRESH_DATA };

function taskManagementReducer(state: TaskManagementState, action: TaskManagementAction): TaskManagementState {
  switch (action.type) {
    case TASK_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case TASK_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case TASK_ACTIONS.SET_TASKS:
      return { 
        ...state, 
        tasks: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case TASK_ACTIONS.SET_ASSIGNMENTS:
      return { 
        ...state, 
        assignments: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case TASK_ACTIONS.SET_PROJECTS:
      return { 
        ...state, 
        projects: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case TASK_ACTIONS.ADD_TASK:
      return { 
        ...state, 
        tasks: [...state.tasks, action.payload],
        lastUpdated: new Date().toISOString()
      };
    
    case TASK_ACTIONS.UPDATE_TASK:
      return { 
        ...state, 
        tasks: state.tasks.map(task => 
          task.id === action.payload.id ? action.payload : task
        ),
        lastUpdated: new Date().toISOString()
      };
    
    case TASK_ACTIONS.DELETE_TASK:
      return { 
        ...state, 
        tasks: state.tasks.filter(task => task.id !== action.payload),
        lastUpdated: new Date().toISOString()
      };
    
    case TASK_ACTIONS.REFRESH_DATA:
      return { ...state, lastUpdated: new Date().toISOString() };
    
    default:
      return state;
  }
}

// Context
interface TaskManagementContextType {
  state: TaskManagementState;
  actions: {
    loadTasks: (filters?: { subjectId?: string; classId?: string; type?: string; status?: string }) => Promise<void>;
    loadAssignments: (filters?: { subjectId?: string; classId?: string }) => Promise<void>;
    loadProjects: (filters?: { subjectId?: string; classId?: string }) => Promise<void>;
    addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    refreshData: () => void;
    clearError: () => void;
  };
}

const TaskManagementContext = createContext<TaskManagementContextType | undefined>(undefined);

// Provider
export const TaskManagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskManagementReducer, initialState);
  const { profile, user } = useAuth();
  const schoolCode = profile?.school_code;

  // Load tasks
  const loadTasks = useCallback(async (filters?: { subjectId?: string; classId?: string; type?: string; status?: string }) => {
    if (!user || !schoolCode) return;
    
    dispatch({ type: TASK_ACTIONS.SET_LOADING, payload: true });
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          subject:subjects(id, subject_name),
          class_instance:class_instances(id, grade, section)
        `)
        .eq('school_code', schoolCode)
        .order('created_at', { ascending: false });

      if (filters?.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
      }
      if (filters?.classId) {
        query = query.eq('class_instance_id', filters.classId);
      }
      if (filters?.type) {
        query = query.eq('task_type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      dispatch({ 
        type: TASK_ACTIONS.SET_TASKS, 
        payload: (data as unknown as Task[]) || [] 
      });
    } catch (error) {
      dispatch({ 
        type: TASK_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load tasks' 
      });
    }
  }, [user, schoolCode]);

  // Load assignments
  const loadAssignments = useCallback(async (filters?: { subjectId?: string; classId?: string }) => {
    if (!user || !schoolCode) return;
    
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          subject:subjects(id, subject_name),
          class_instance:class_instances(id, grade, section),
          assigned_by_user:admin!tasks_assigned_by_fkey(id, full_name)
        `)
        .eq('school_code', schoolCode)
        .eq('task_type', 'assignment')
        .order('created_at', { ascending: false });

      if (filters?.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
      }
      if (filters?.classId) {
        query = query.eq('class_instance_id', filters.classId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      dispatch({ 
        type: TASK_ACTIONS.SET_ASSIGNMENTS, 
        payload: (data as unknown as Assignment[]) || [] 
      });
    } catch (error) {
      dispatch({ 
        type: TASK_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load assignments' 
      });
    }
  }, [user, schoolCode]);

  // Load projects
  const loadProjects = useCallback(async (filters?: { subjectId?: string; classId?: string }) => {
    if (!user || !schoolCode) return;
    
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          subject:subjects(id, subject_name),
          class_instance:class_instances(id, grade, section),
          assigned_by_user:admin!tasks_assigned_by_fkey(id, full_name)
        `)
        .eq('school_code', schoolCode)
        .eq('task_type', 'project')
        .order('created_at', { ascending: false });

      if (filters?.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
      }
      if (filters?.classId) {
        query = query.eq('class_instance_id', filters.classId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      dispatch({ 
        type: TASK_ACTIONS.SET_PROJECTS, 
        payload: (data as unknown as Project[]) || [] 
      });
    } catch (error) {
      dispatch({ 
        type: TASK_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load projects' 
      });
    }
  }, [user, schoolCode]);

  // Add task
  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user || !schoolCode) return;
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          school_code: schoolCode,
          assigned_by: user.id,
        }] as any)
        .select(`
          *,
          subject:subjects(id, subject_name),
          class_instance:class_instances(id, grade, section),
          assigned_by_user:admin!tasks_assigned_by_fkey(id, full_name)
        `)
        .single();

      if (error) throw error;
      
      dispatch({ type: TASK_ACTIONS.ADD_TASK, payload: data as unknown as Task });
    } catch (error) {
      dispatch({ 
        type: TASK_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to add task' 
      });
    }
  }, [user, schoolCode]);

  // Update task
  const updateTask = useCallback(async (task: Task) => {
    if (!user || !schoolCode) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('tasks')
        .update({
          title: task.title,
          description: task.description,
          task_type: task.task_type,
          subject_id: task.subject_id,
          class_instance_id: task.class_instance_id,
          assigned_to: task.assigned_to,
          due_date: task.due_date,
          priority: task.priority,
          status: task.status,
          total_marks: task.total_marks,
          is_published: task.is_published,
        })
        .eq('id', task.id)
        .eq('school_code', schoolCode)
        .select(`
          *,
          subject:subjects(id, subject_name),
          class_instance:class_instances(id, grade, section),
          assigned_by_user:admin!tasks_assigned_by_fkey(id, full_name)
        `)
        .single();

      if (error) throw error;
      
      dispatch({ type: TASK_ACTIONS.UPDATE_TASK, payload: data as unknown as Task });
    } catch (error) {
      dispatch({ 
        type: TASK_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to update task' 
      });
    }
  }, [user, schoolCode]);

  // Delete task
  const deleteTask = useCallback(async (taskId: string) => {
    if (!user || !schoolCode) return;
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('school_code', schoolCode);

      if (error) throw error;
      
      dispatch({ type: TASK_ACTIONS.DELETE_TASK, payload: taskId });
    } catch (error) {
      dispatch({ 
        type: TASK_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to delete task' 
      });
    }
  }, [user, schoolCode]);

  // Refresh data
  const refreshData = useCallback(() => {
    dispatch({ type: TASK_ACTIONS.REFRESH_DATA });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: TASK_ACTIONS.SET_ERROR, payload: null });
  }, []);

  // Auto-load data when context mounts
  useEffect(() => {
    if (user && schoolCode) {
      loadTasks();
      loadAssignments();
      loadProjects();
    }
  }, [user, schoolCode, loadTasks, loadAssignments, loadProjects]);

  const contextValue: TaskManagementContextType = {
    state,
    actions: {
      loadTasks,
      loadAssignments,
      loadProjects,
      addTask,
      updateTask,
      deleteTask,
      refreshData,
      clearError,
    },
  };

  return (
    <TaskManagementContext.Provider value={contextValue}>
      {children}
    </TaskManagementContext.Provider>
  );
};

// Hook
export const useTaskManagement = (): TaskManagementContextType => {
  const context = useContext(TaskManagementContext);
  if (context === undefined) {
    throw new Error('useTaskManagement must be used within a TaskManagementProvider');
  }
  return context;
};
