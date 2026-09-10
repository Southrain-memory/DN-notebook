import type { TaskRepository } from './taskRepository';
import { LocalStorageTaskRepository } from './localStorageRepository';
import { ElectronFileRepository, isElectron } from './electronRepository';

export type {
  Task,
  TaskInput,
  Priority,
  RepeatKind,
  Subtask,
  EventRecord,
  EventInput,
  RecordCategory,
} from './types';
export { PRIORITY_ORDER, DEFAULT_CATEGORIES, FALLBACK_CATEGORY_ID, CATEGORY_PALETTE } from './types';
export type { TaskRepository } from './taskRepository';

// ────────────────────────────────────────────────────────────────
// 数据层入口。同一份界面代码自动选择仓库实现：
//   · Electron 桌面版 → ElectronFileRepository（用户数据目录 tasks.json）
//   · 浏览器 / 单文件版 → LocalStorageTaskRepository（localStorage）
//
// 将来要切换到云数据库时：
//   1. 新建 cloudRepository.ts，实现 TaskRepository 接口（内部调 HTTP API）；
//   2. 在下面的选择逻辑里加一个分支即可，界面层零改动。
// ────────────────────────────────────────────────────────────────
let repository: TaskRepository = isElectron() ? new ElectronFileRepository() : new LocalStorageTaskRepository();

export function getTaskRepository(): TaskRepository {
  return repository;
}

/** 供测试或高级用法替换仓库实现 */
export function setTaskRepository(repo: TaskRepository): void {
  repository = repo;
}
