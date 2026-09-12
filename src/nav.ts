export type Tab = 'day' | 'important' | 'gantt' | 'upcoming' | 'records' | 'trash' | 'settings';

export const TAB_TITLES: Record<Tab, string> = {
  day: '今天',
  important: '重要事项',
  gantt: '时间甘特图',
  upcoming: '即将到来',
  records: '记事',
  trash: '回收站',
  settings: '设置',
};
