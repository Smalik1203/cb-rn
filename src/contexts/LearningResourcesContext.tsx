import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from './AuthContext';

// Action types
const LEARNING_RESOURCES_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_RESOURCES: 'SET_RESOURCES',
  SET_QUIZZES: 'SET_QUIZZES',
  SET_ASSIGNMENTS: 'SET_ASSIGNMENTS',
  ADD_RESOURCE: 'ADD_RESOURCE',
  UPDATE_RESOURCE: 'UPDATE_RESOURCE',
  DELETE_RESOURCE: 'DELETE_RESOURCE',
  REFRESH_DATA: 'REFRESH_DATA',
} as const;

// Types
interface LearningResource {
  id: string;
  title: string;
  description?: string;
  resource_type: 'pdf' | 'video' | 'image' | 'document' | 'link';
  file_url?: string;
  file_size?: number;
  subject_id?: string;
  class_instance_id?: string;
  uploaded_by: string;
  school_code: string;
  is_public: boolean;
  tags?: string[];
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
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  subject_id?: string;
  class_instance_id?: string;
  created_by: string;
  school_code: string;
  time_limit?: number; // in minutes
  total_questions: number;
  total_marks: number;
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
}

interface Assignment {
  id: string;
  title: string;
  description?: string;
  subject_id?: string;
  class_instance_id?: string;
  created_by: string;
  school_code: string;
  due_date?: string;
  total_marks: number;
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
}

// Initial state
interface LearningResourcesState {
  loading: boolean;
  error: string | null;
  resources: LearningResource[];
  quizzes: Quiz[];
  assignments: Assignment[];
  lastUpdated: string | null;
}

const initialState: LearningResourcesState = {
  loading: false,
  error: null,
  resources: [],
  quizzes: [],
  assignments: [],
  lastUpdated: null
};

// Reducer
type LearningResourcesAction = 
  | { type: typeof LEARNING_RESOURCES_ACTIONS.SET_LOADING; payload: boolean }
  | { type: typeof LEARNING_RESOURCES_ACTIONS.SET_ERROR; payload: string | null }
  | { type: typeof LEARNING_RESOURCES_ACTIONS.SET_RESOURCES; payload: LearningResource[] }
  | { type: typeof LEARNING_RESOURCES_ACTIONS.SET_QUIZZES; payload: Quiz[] }
  | { type: typeof LEARNING_RESOURCES_ACTIONS.SET_ASSIGNMENTS; payload: Assignment[] }
  | { type: typeof LEARNING_RESOURCES_ACTIONS.ADD_RESOURCE; payload: LearningResource }
  | { type: typeof LEARNING_RESOURCES_ACTIONS.UPDATE_RESOURCE; payload: LearningResource }
  | { type: typeof LEARNING_RESOURCES_ACTIONS.DELETE_RESOURCE; payload: string }
  | { type: typeof LEARNING_RESOURCES_ACTIONS.REFRESH_DATA };

function learningResourcesReducer(state: LearningResourcesState, action: LearningResourcesAction): LearningResourcesState {
  switch (action.type) {
    case LEARNING_RESOURCES_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case LEARNING_RESOURCES_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case LEARNING_RESOURCES_ACTIONS.SET_RESOURCES:
      return { 
        ...state, 
        resources: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case LEARNING_RESOURCES_ACTIONS.SET_QUIZZES:
      return { 
        ...state, 
        quizzes: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case LEARNING_RESOURCES_ACTIONS.SET_ASSIGNMENTS:
      return { 
        ...state, 
        assignments: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case LEARNING_RESOURCES_ACTIONS.ADD_RESOURCE:
      return { 
        ...state, 
        resources: [...state.resources, action.payload],
        lastUpdated: new Date().toISOString()
      };
    
    case LEARNING_RESOURCES_ACTIONS.UPDATE_RESOURCE:
      return { 
        ...state, 
        resources: state.resources.map(resource => 
          resource.id === action.payload.id ? action.payload : resource
        ),
        lastUpdated: new Date().toISOString()
      };
    
    case LEARNING_RESOURCES_ACTIONS.DELETE_RESOURCE:
      return { 
        ...state, 
        resources: state.resources.filter(resource => resource.id !== action.payload),
        lastUpdated: new Date().toISOString()
      };
    
    case LEARNING_RESOURCES_ACTIONS.REFRESH_DATA:
      return { ...state, lastUpdated: new Date().toISOString() };
    
    default:
      return state;
  }
}

// Context
interface LearningResourcesContextType {
  state: LearningResourcesState;
  actions: {
    loadResources: (filters?: { subjectId?: string; classId?: string; type?: string }) => Promise<void>;
    loadQuizzes: (filters?: { subjectId?: string; classId?: string }) => Promise<void>;
    loadAssignments: (filters?: { subjectId?: string; classId?: string }) => Promise<void>;
    addResource: (resource: Omit<LearningResource, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateResource: (resource: LearningResource) => Promise<void>;
    deleteResource: (resourceId: string) => Promise<void>;
    refreshData: () => void;
    clearError: () => void;
  };
}

const LearningResourcesContext = createContext<LearningResourcesContextType | undefined>(undefined);

// Provider
export const LearningResourcesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(learningResourcesReducer, initialState);
  const { profile, user } = useAuth();
  const schoolCode = profile?.school_code;

  // Load resources
  const loadResources = useCallback(async (filters?: { subjectId?: string; classId?: string; type?: string }) => {
    if (!user) return;
    
    dispatch({ type: LEARNING_RESOURCES_ACTIONS.SET_LOADING, payload: true });
    try {
      let query = supabase
        .from('learning_resources')
        .select(`
          *,
          subject:subjects(id, subject_name),
          class_instance:class_instances(id, grade, section)
        `)
        .order('created_at', { ascending: false });

      // Filter by school_code if available, otherwise show all resources
      if (schoolCode) {
        query = query.eq('school_code', schoolCode);
      }

      if (filters?.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
      }
      if (filters?.classId) {
        query = query.eq('class_instance_id', filters.classId);
      }
      if (filters?.type) {
        query = query.eq('resource_type', filters.type);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      dispatch({ 
        type: LEARNING_RESOURCES_ACTIONS.SET_RESOURCES, 
        payload: (data as unknown as LearningResource[]) || [] 
      });
    } catch (error) {
      dispatch({ 
        type: LEARNING_RESOURCES_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load resources' 
      });
    }
  }, [user, schoolCode]);

  // Load quizzes
  const loadQuizzes = useCallback(async (filters?: { subjectId?: string; classId?: string }) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('tests')
        .select(`
          *,
          subject:subjects(id, subject_name),
          class_instance:class_instances(id, grade, section)
        `)
        .order('created_at', { ascending: false });

      // Filter by school_code if available
      if (schoolCode) {
        query = query.eq('school_code', schoolCode);
      }

      if (filters?.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
      }
      if (filters?.classId) {
        query = query.eq('class_instance_id', filters.classId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      dispatch({ 
        type: LEARNING_RESOURCES_ACTIONS.SET_QUIZZES, 
        payload: (data as unknown as Quiz[]) || [] 
      });
    } catch (error) {
      dispatch({ 
        type: LEARNING_RESOURCES_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load quizzes' 
      });
    }
  }, [user, schoolCode]);

  // Load assignments
  const loadAssignments = useCallback(async (filters?: { subjectId?: string; classId?: string }) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          subject:subjects(id, subject_name),
          class_instance:class_instances(id, grade, section)
        `)
        .order('created_at', { ascending: false });

      // Filter by school_code if available
      if (schoolCode) {
        query = query.eq('school_code', schoolCode);
      }

      if (filters?.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
      }
      if (filters?.classId) {
        query = query.eq('class_instance_id', filters.classId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      dispatch({ 
        type: LEARNING_RESOURCES_ACTIONS.SET_ASSIGNMENTS, 
        payload: (data as unknown as Assignment[]) || [] 
      });
    } catch (error) {
      dispatch({ 
        type: LEARNING_RESOURCES_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load assignments' 
      });
    }
  }, [user, schoolCode]);

  // Add resource
  const addResource = useCallback(async (resourceData: Omit<LearningResource, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user || !schoolCode) return;
    
    try {
      const { data, error } = await supabase
        .from('learning_resources')
        .insert([{
          ...resourceData,
          school_code: schoolCode,
          uploaded_by: user.id,
        }] as any)
        .select(`
          *,
          subject:subjects(id, subject_name),
          class_instance:class_instances(id, grade, section)
        `)
        .single();

      if (error) throw error;
      
      dispatch({ type: LEARNING_RESOURCES_ACTIONS.ADD_RESOURCE, payload: data as unknown as LearningResource });
    } catch (error) {
      dispatch({ 
        type: LEARNING_RESOURCES_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to add resource' 
      });
    }
  }, [user, schoolCode]);

  // Update resource
  const updateResource = useCallback(async (resource: LearningResource) => {
    if (!user || !schoolCode) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('learning_resources')
        .update({
          title: resource.title,
          description: resource.description,
          resource_type: resource.resource_type,
          file_url: resource.file_url,
          file_size: resource.file_size,
          subject_id: resource.subject_id,
          class_instance_id: resource.class_instance_id,
          is_public: resource.is_public,
          tags: resource.tags,
        })
        .eq('id', resource.id)
        .eq('school_code', schoolCode)
        .select(`
          *,
          subject:subjects(id, subject_name),
          class_instance:class_instances(id, grade, section)
        `)
        .single();

      if (error) throw error;
      
      dispatch({ type: LEARNING_RESOURCES_ACTIONS.UPDATE_RESOURCE, payload: data as unknown as LearningResource });
    } catch (error) {
      dispatch({ 
        type: LEARNING_RESOURCES_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to update resource' 
      });
    }
  }, [user, schoolCode]);

  // Delete resource
  const deleteResource = useCallback(async (resourceId: string) => {
    if (!user || !schoolCode) return;
    
    try {
      const { error } = await supabase
        .from('learning_resources')
        .delete()
        .eq('id', resourceId)
        .eq('school_code', schoolCode);

      if (error) throw error;
      
      dispatch({ type: LEARNING_RESOURCES_ACTIONS.DELETE_RESOURCE, payload: resourceId });
    } catch (error) {
      dispatch({ 
        type: LEARNING_RESOURCES_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to delete resource' 
      });
    }
  }, [user, schoolCode]);

  // Refresh data
  const refreshData = useCallback(() => {
    dispatch({ type: LEARNING_RESOURCES_ACTIONS.REFRESH_DATA });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: LEARNING_RESOURCES_ACTIONS.SET_ERROR, payload: null });
  }, []);

  // Auto-load data when context mounts
  useEffect(() => {
    if (user && schoolCode) {
      loadResources();
      loadQuizzes();
      loadAssignments();
    }
  }, [user, schoolCode, loadResources, loadQuizzes, loadAssignments]);

  const contextValue: LearningResourcesContextType = {
    state,
    actions: {
      loadResources,
      loadQuizzes,
      loadAssignments,
      addResource,
      updateResource,
      deleteResource,
      refreshData,
      clearError,
    },
  };

  return (
    <LearningResourcesContext.Provider value={contextValue}>
      {children}
    </LearningResourcesContext.Provider>
  );
};

// Hook
export const useLearningResources = (): LearningResourcesContextType => {
  const context = useContext(LearningResourcesContext);
  if (context === undefined) {
    throw new Error('useLearningResources must be used within a LearningResourcesProvider');
  }
  return context;
};
