import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs, { type Dayjs } from 'dayjs';

interface MemoEditorProps {
  open: boolean;
  initialContent?: string;
  initialRemindTime?: Date;
  onSave: (content: string, remindTime: Date) => void;
  onCancel: () => void;
}

export function MemoEditor({
  open,
  initialContent = '',
  initialRemindTime,
  onSave,
  onCancel,
}: MemoEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [remindTime, setRemindTime] = useState<Dayjs | null>(
    initialRemindTime ? dayjs(initialRemindTime) : dayjs().add(1, 'day'),
  );

  useEffect(() => {
    if (open) {
      setContent(initialContent);
      setRemindTime(
        initialRemindTime
          ? dayjs(initialRemindTime)
          : dayjs().add(1, 'day'),
      );
    }
  }, [open, initialContent, initialRemindTime]);

  const handleSave = () => {
    if (!content.trim()) return;
    onSave(content.trim(), remindTime?.toDate() ?? new Date());
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialContent ? '编辑备忘录' : '新建备忘录'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          maxRows={10}
          label="内容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          sx={{ mt: 1, mb: 2 }}
          data-testid="memo-editor"
        />
        <DateTimePicker
          label="提醒时间"
          value={remindTime}
          onChange={(v) => setRemindTime(v)}
          sx={{ width: '100%' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>取消</Button>
        <Button onClick={handleSave} variant="contained" disabled={!content.trim()}>
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
