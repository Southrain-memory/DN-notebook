import type { Task, TaskInput } from './types';

/**
 * 任务数据仓库接口 —— 视图层只依赖此接口，不关心数据存在哪里。
 *
 * 第一版使用 LocalStorageTaskRepository（浏览器本地存储）。
 * 将来接入云数据库时，只需：
 *   1. 实现一个 CloudTaskRepository implements TaskRepository（内部调用 HTTP API）；
 *   2. 在 src/data/index.ts 中把默认仓库换成新实现。
 * 界面层代码无需任何改动。
 */
export interface TaskRepository {
  /** 读取全部任务 */
  getAll(): Promise<Task[]>;
  /** 新建任务，返回带 id 的新任务 */
  create(input: TaskInput): Promise<Task>;
  /** 更新任务（传入需要修改的字段），返回更新后的完整任务 */
  update(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task>;
  /** 删除任务 */
  delete(id: string): Promise<void>;
  /** 整体导入（覆盖现有数据），用于备份恢复 / 迁移到云端 */
  importAll(tasks: Task[]): Promise<void>;
}
