export type Priority = 'high' | 'medium' | 'low';

/** 重复规则：undefined 表示不重复 */
export type RepeatKind = 'daily' | 'weekly' | 'monthly';

/** 任务内的子任务清单项 */
export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

/** 一条任务 / 记事 */
export interface Task {
  id: string;
  /** 标题 */
  title: string;
  /** 备注（可为空字符串） */
  note: string;
  /** 所属日期，本地时区 YYYY-MM-DD */
  date: string;
  /** 开始时间 HH:MM（可选，用于时间甘特图） */
  startTime?: string;
  /** 结束时间 HH:MM（可选，用于时间甘特图） */
  endTime?: string;
  /** 重复规则（可选，完成后由数据层自动生成下一次） */
  repeat?: RepeatKind;
  /** 子任务清单（可选） */
  subtasks?: Subtask[];
  /** 优先级 */
  priority: Priority;
  /** 是否已完成 */
  done: boolean;
  /** 完成时间戳（毫秒），未完成为 undefined */
  doneAt?: number;
  /** 删除时间戳（毫秒）：有值表示已进回收站，可恢复；undefined 为正常任务 */
  deletedAt?: number;
  /** 创建时间戳（毫秒） */
  createdAt: number;
  /** 最后修改时间戳（毫秒） */
  updatedAt: number;
}

/** 新建任务时的输入 */
export interface TaskInput {
  title: string;
  note?: string;
  date: string;
  priority: Priority;
  startTime?: string;
  endTime?: string;
  repeat?: RepeatKind;
  subtasks?: Subtask[];
}

/** HH:MM 时间格式 */
export const TIME_RE = /^\d{2}:\d{2}$/;

/** 排序权重：高优先级在前 */
export const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

// ── 记事（已发生事件的记录） ─────────────────────────────

/** 记事分类 */
export interface RecordCategory {
  id: string;
  name: string;
  /** 主题色（hex） */
  color: string;
}

/** 一条记事：某天发生的事 */
export interface EventRecord {
  id: string;
  /** 一句话标题 */
  title: string;
  /** 补充描述（可为空） */
  note: string;
  /** 发生日期 YYYY-MM-DD */
  date: string;
  /** 所属分类 id */
  categoryId: string;
  createdAt: number;
  updatedAt: number;
}

/** 新建记事的输入 */
export interface EventInput {
  title: string;
  note?: string;
  date: string;
  categoryId: string;
}

/** 内置分类（“其他”为兜底分类，不可删除） */
export const DEFAULT_CATEGORIES: RecordCategory[] = [
  { id: 'work', name: '工作', color: '#6366f1' },
  { id: 'life', name: '生活', color: '#10b981' },
  { id: 'study', name: '学习', color: '#f59e0b' },
  { id: 'health', name: '健康', color: '#f43f5e' },
  { id: 'other', name: '其他', color: '#64748b' },
];

/** 兜底分类 id：删除分类时其下的记事会归入这里 */
export const FALLBACK_CATEGORY_ID = 'other';

/** 自定义分类的候选色板 */
export const CATEGORY_PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#ec4899', '#84cc16'];
