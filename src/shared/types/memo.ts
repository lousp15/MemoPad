// Memo 实体类型

export interface Memo {
  uuid: string;
  content: string;
  remindTime: Date;
  status: 'pending' | 'completed' | 'expired';
  createdAt: Date;
  updatedAt: Date;
  reminderCount: number;
}
