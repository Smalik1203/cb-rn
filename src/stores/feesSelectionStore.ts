import { create } from 'zustand';

interface FeesSelectionStore {
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  setSelection: (ids: string[]) => void;
  hasSelection: () => boolean;
  getSelectedIdsArray: () => string[];
}

export const useFeesSelectionStore = create<FeesSelectionStore>((set, get) => ({
  selectedIds: new Set<string>(),
  
  toggleSelect: (id: string) => {
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedIds: next };
    });
  },
  
  clearSelection: () => {
    set({ selectedIds: new Set<string>() });
  },
  
  setSelection: (ids: string[]) => {
    set({ selectedIds: new Set(ids) });
  },
  
  hasSelection: () => {
    return get().selectedIds.size > 0;
  },
  
  getSelectedIdsArray: () => {
    return Array.from(get().selectedIds);
  },
}));

