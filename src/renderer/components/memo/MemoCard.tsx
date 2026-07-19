import React from 'react';
import type { Memo } from '@shared/types/memo';

interface MemoCardProps {
  memo: Memo;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showCheckbox?: boolean;
  checked?: boolean;
  onToggleCheck?: () => void;
}

export function MemoCard({
  memo,
  selected,
  onSelect,
  onEdit,
  onDelete,
  showCheckbox,
  checked,
  onToggleCheck,
}: MemoCardProps) {
  const statusColor: Record<string, string> = {
    pending: '#1976d2',
    completed: '#4caf50',
    expired: '#f44336',
  };

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '12px 16px',
        border: `1px solid ${selected ? '#1976d2' : '#e0e0e0'}`,
        borderRadius: 8,
        marginBottom: 8,
        cursor: 'pointer',
        background: selected ? '#e3f2fd' : '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {showCheckbox && (
        <input
          type="checkbox"
          checked={!!checked}
          onChange={onToggleCheck}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>
          {memo.content.length > 100
            ? memo.content.slice(0, 100) + '...'
            : memo.content}
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 12, color: '#666' }}>
          <span
            style={{
              color: statusColor[memo.status],
              fontWeight: 600,
            }}
          >
            {memo.status === 'pending'
              ? '待办'
              : memo.status === 'completed'
                ? '已完成'
                : '已过期'}
          </span>
          <span>
            提醒: {new Date(memo.remindTime).toLocaleString('zh-CN')}
          </span>
        </div>
      </div>
      {onEdit && (
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          编辑
        </button>
      )}
      {onDelete && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          删除
        </button>
      )}
    </div>
  );
}
