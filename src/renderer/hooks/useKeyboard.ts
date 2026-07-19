import { useEffect } from 'react';

interface UseKeyboardOptions {
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * 全局快捷键绑定。
 * 检测 document.activeElement 是否为 INPUT/TEXTAREA/[contenteditable]，
 * 若是则跳过全局快捷键，交给浏览器原生处理（如 TextField 内的文本撤销）。
 */
export function useKeyboard({ onUndo, onRedo }: UseKeyboardOptions): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      const isInputFocused =
        tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;

      if (isInputFocused) return; // 交给 MUI TextField 内部处理

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        onUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        onRedo();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onUndo, onRedo]);
}
