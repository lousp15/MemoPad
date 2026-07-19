import React, { useState } from 'react';
import { Box, Button, Checkbox, FormControlLabel, Stack } from '@mui/material';
import type { Memo } from '@shared/types/memo';
import { MemoCard } from './MemoCard';
import { useUiStore } from '../../stores/uiStore';

interface MemoListProps {
  memos: Memo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (memo: Memo) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
}

export function MemoList({
  memos,
  selectedId,
  onSelect,
  onEdit,
  onComplete,
  onDelete,
  onBatchDelete,
}: MemoListProps) {
  const batchMode = useUiStore((s) => s.batchMode);
  const setBatchMode = useUiStore((s) => s.setBatchMode);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === memos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(memos.map((m) => m.uuid));
    }
  };

  const handleBatchDelete = () => {
    onBatchDelete(selectedIds);
    setSelectedIds([]);
    setBatchMode(false);
  };

  if (memos.length === 0) return null;

  return (
    <Box>
      {(batchMode || selectedIds.length > 0) && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectedIds.length === memos.length && memos.length > 0}
                indeterminate={
                  selectedIds.length > 0 && selectedIds.length < memos.length
                }
                onChange={toggleAll}
              />
            }
            label={`全选 (${selectedIds.length}/${memos.length})`}
          />
          <Button
            size="small"
            color="error"
            variant="outlined"
            disabled={selectedIds.length === 0}
            onClick={handleBatchDelete}
          >
            批量删除 ({selectedIds.length})
          </Button>
          <Button size="small" onClick={() => { setSelectedIds([]); setBatchMode(false); }}>
            取消
          </Button>
        </Stack>
      )}
      {memos.map((memo) => (
        <MemoCard
          key={memo.uuid}
          memo={memo}
          selected={selectedId === memo.uuid}
          onSelect={() => onSelect(memo.uuid)}
          onEdit={() => onEdit(memo)}
          onComplete={() => onComplete(memo.uuid)}
          onDelete={() => onDelete(memo.uuid)}
          showCheckbox={batchMode}
          checked={selectedIds.includes(memo.uuid)}
          onToggleCheck={() => toggleSelect(memo.uuid)}
        />
      ))}
    </Box>
  );
}
