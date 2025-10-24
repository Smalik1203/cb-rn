import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from './AuthContext';

// Action types
const CALENDAR_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_EVENTS: 'SET_EVENTS',
  SET_HOLIDAYS: 'SET_HOLIDAYS',
  SET_WORKING_DAYS: 'SET_WORKING_DAYS',
  ADD_EVENT: 'ADD_EVENT',
  UPDATE_EVENT: 'UPDATE_EVENT',
  DELETE_EVENT: 'DELETE_EVENT',
  REFRESH_DATA: 'REFRESH_DATA',
} as const;

// Types
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  event_type: 'academic' | 'holiday' | 'exam' | 'meeting' | 'other';
  is_all_day: boolean;
  school_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'religious' | 'academic' | 'local';
  school_code: string;
  is_recurring: boolean;
  created_at: string;
}

interface WorkingDay {
  id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  is_working: boolean;
  school_code: string;
  academic_year_id: string;
  created_at: string;
}

// Initial state
interface CalendarState {
  loading: boolean;
  error: string | null;
  events: CalendarEvent[];
  holidays: Holiday[];
  workingDays: WorkingDay[];
  lastUpdated: string | null;
}

const initialState: CalendarState = {
  loading: false,
  error: null,
  events: [],
  holidays: [],
  workingDays: [],
  lastUpdated: null
};

// Reducer
type CalendarAction = 
  | { type: typeof CALENDAR_ACTIONS.SET_LOADING; payload: boolean }
  | { type: typeof CALENDAR_ACTIONS.SET_ERROR; payload: string | null }
  | { type: typeof CALENDAR_ACTIONS.SET_EVENTS; payload: CalendarEvent[] }
  | { type: typeof CALENDAR_ACTIONS.SET_HOLIDAYS; payload: Holiday[] }
  | { type: typeof CALENDAR_ACTIONS.SET_WORKING_DAYS; payload: WorkingDay[] }
  | { type: typeof CALENDAR_ACTIONS.ADD_EVENT; payload: CalendarEvent }
  | { type: typeof CALENDAR_ACTIONS.UPDATE_EVENT; payload: CalendarEvent }
  | { type: typeof CALENDAR_ACTIONS.DELETE_EVENT; payload: string }
  | { type: typeof CALENDAR_ACTIONS.REFRESH_DATA };

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case CALENDAR_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case CALENDAR_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case CALENDAR_ACTIONS.SET_EVENTS:
      return { 
        ...state, 
        events: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case CALENDAR_ACTIONS.SET_HOLIDAYS:
      return { 
        ...state, 
        holidays: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case CALENDAR_ACTIONS.SET_WORKING_DAYS:
      return { 
        ...state, 
        workingDays: action.payload,
        lastUpdated: new Date().toISOString()
      };
    
    case CALENDAR_ACTIONS.ADD_EVENT:
      return { 
        ...state, 
        events: [...state.events, action.payload],
        lastUpdated: new Date().toISOString()
      };
    
    case CALENDAR_ACTIONS.UPDATE_EVENT:
      return { 
        ...state, 
        events: state.events.map(event => 
          event.id === action.payload.id ? action.payload : event
        ),
        lastUpdated: new Date().toISOString()
      };
    
    case CALENDAR_ACTIONS.DELETE_EVENT:
      return { 
        ...state, 
        events: state.events.filter(event => event.id !== action.payload),
        lastUpdated: new Date().toISOString()
      };
    
    case CALENDAR_ACTIONS.REFRESH_DATA:
      return { ...state, lastUpdated: new Date().toISOString() };
    
    default:
      return state;
  }
}

// Context
interface CalendarContextType {
  state: CalendarState;
  actions: {
    loadEvents: (startDate?: string, endDate?: string) => Promise<void>;
    loadHolidays: (year?: number) => Promise<void>;
    loadWorkingDays: () => Promise<void>;
    addEvent: (event: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateEvent: (event: CalendarEvent) => Promise<void>;
    deleteEvent: (eventId: string) => Promise<void>;
    refreshData: () => void;
    clearError: () => void;
  };
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

// Provider
export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(calendarReducer, initialState);
  const { profile, user } = useAuth();
  const schoolCode = profile?.school_code;

  // Load events
  const loadEvents = useCallback(async (startDate?: string, endDate?: string) => {
    if (!user || !schoolCode) return;
    
    dispatch({ type: CALENDAR_ACTIONS.SET_LOADING, payload: true });
    try {
      let query = supabase
        .from('school_calendar_events')
        .select('*')
        .eq('school_code', schoolCode)
        .order('start_date', { ascending: true });

      if (startDate) {
        query = query.gte('start_date', startDate);
      }
      if (endDate) {
        query = query.lte('end_date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      dispatch({ 
        type: CALENDAR_ACTIONS.SET_EVENTS, 
        payload: (data as unknown as CalendarEvent[]) || [] 
      });
    } catch (error) {
      dispatch({ 
        type: CALENDAR_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load events' 
      });
    }
  }, [user, schoolCode]);

  // Load holidays
  const loadHolidays = useCallback(async (year?: number) => {
    if (!user || !schoolCode) return;
    
    try {
      const targetYear = year || new Date().getFullYear();
      const startDate = `${targetYear}-01-01`;
      const endDate = `${targetYear}-12-31`;

      const { data, error } = await supabase
        .from('school_calendar_events')
        .select('*')
        .eq('school_code', schoolCode)
        .eq('event_type', 'holiday')
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .order('start_date', { ascending: true });

      if (error) throw error;
      
      dispatch({ 
        type: CALENDAR_ACTIONS.SET_HOLIDAYS, 
        payload: (data as unknown as Holiday[]) || [] 
      });
    } catch (error) {
      dispatch({ 
        type: CALENDAR_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to load holidays' 
      });
    }
  }, [user, schoolCode]);

  // Load working days - Not implemented as working_days table doesn't exist
  const loadWorkingDays = useCallback(async () => {
    // Working days functionality not available in current schema
    // Could be implemented using school_calendar_events with event_type = 'working_day'
    dispatch({ 
      type: CALENDAR_ACTIONS.SET_WORKING_DAYS, 
      payload: [] 
    });
  }, []);

  // Add event
  const addEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user || !schoolCode) return;
    
    try {
      const { data, error } = await supabase
        .from('school_calendar_events')
        .insert([{
          ...eventData,
          school_code: schoolCode,
          created_by: user.id,
        }] as any)
        .select()
        .single();

      if (error) throw error;
      
      dispatch({ type: CALENDAR_ACTIONS.ADD_EVENT, payload: data as unknown as CalendarEvent });
    } catch (error) {
      dispatch({ 
        type: CALENDAR_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to add event' 
      });
    }
  }, [user, schoolCode]);

  // Update event
  const updateEvent = useCallback(async (event: CalendarEvent) => {
    if (!user || !schoolCode) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('school_calendar_events')
        .update({
          title: event.title,
          description: event.description,
          start_date: event.start_date,
          end_date: event.end_date,
          start_time: event.start_time,
          end_time: event.end_time,
          event_type: event.event_type,
          is_all_day: event.is_all_day,
        })
        .eq('id', event.id)
        .eq('school_code', schoolCode)
        .select()
        .single();

      if (error) throw error;
      
      dispatch({ type: CALENDAR_ACTIONS.UPDATE_EVENT, payload: data as unknown as CalendarEvent });
    } catch (error) {
      dispatch({ 
        type: CALENDAR_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to update event' 
      });
    }
  }, [user, schoolCode]);

  // Delete event
  const deleteEvent = useCallback(async (eventId: string) => {
    if (!user || !schoolCode) return;
    
    try {
      const { error } = await supabase
        .from('school_calendar_events')
        .delete()
        .eq('id', eventId)
        .eq('school_code', schoolCode);

      if (error) throw error;
      
      dispatch({ type: CALENDAR_ACTIONS.DELETE_EVENT, payload: eventId });
    } catch (error) {
      dispatch({ 
        type: CALENDAR_ACTIONS.SET_ERROR, 
        payload: error instanceof Error ? error.message : 'Failed to delete event' 
      });
    }
  }, [user, schoolCode]);

  // Refresh data
  const refreshData = useCallback(() => {
    dispatch({ type: CALENDAR_ACTIONS.REFRESH_DATA });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: CALENDAR_ACTIONS.SET_ERROR, payload: null });
  }, []);

  // Auto-load data when context mounts
  useEffect(() => {
    if (user && schoolCode) {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      loadEvents(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      );
      loadHolidays();
      loadWorkingDays();
    }
  }, [user, schoolCode, loadEvents, loadHolidays, loadWorkingDays]);

  const contextValue: CalendarContextType = {
    state,
    actions: {
      loadEvents,
      loadHolidays,
      loadWorkingDays,
      addEvent,
      updateEvent,
      deleteEvent,
      refreshData,
      clearError,
    },
  };

  return (
    <CalendarContext.Provider value={contextValue}>
      {children}
    </CalendarContext.Provider>
  );
};

// Hook
export const useCalendar = (): CalendarContextType => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
