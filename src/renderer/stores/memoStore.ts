import { create } from 'zustand';
import type { Memo } from '@shared/types/memo';

interface MemoState {
  memos: Memo[];
  selectedId: string | null;
  filter: 'all' | 'pending' | 'completed' | 'expired';
  isOverLimit: boolean;

  setMemos: (memos: Memo[] | ((prev: Memo[]) => Memo[])) => void;
  setSelectedId: (id: string | null) => void;
  setFilter: (filter: MemoState['filter']) => void;
  addMemo: (memo: Memo) => void;
  updateMemo: (memo: Memo) => void;
  deleteMemo: (uuid: string) => void;
  setIsOverLimit: (over: boolean) => void;
}

export const useMemoStore = create<MemoState>((set) => ({
  memos: [],
  selectedId: null,
  filter: 'all',
  isOverLimit: false,

  setMemos: (memosOrFn) =>
    set((state) => ({
      memos:
        typeof memosOrFn === 'function'
          ? (memosOrFn as (prev: Memo[]) => Memo[])(state.memos)
          : memosOrFn,
    })),
  setSelectedId: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),

  addMemo: (memo) =>
    set((state) => ({ memos: [...state.memos, memo] })),

  updateMemo: (memo) =>
    set((state) => ({
      memos: state.memos.map((m) => (m.uuid === memo.uuid ? memo : m)),
    })),

  deleteMemo: (uuid) =>
    set((state) => ({
      memos: state.memos.filter((m) => m.uuid !== uuid),
    })),

  setIsOverLimit: (over) => set({ isOverLimit: over }),
}));
