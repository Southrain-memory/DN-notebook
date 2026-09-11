import { useEffect, useRef, useState } from 'react';
import { CalendarDays, MessageSquareText, Plus, Sparkles } from 'lucide-react';
import type { Priority, TaskInput } from '../data';
import { humanDate, todayStr } from '../utils/date';
import { parseQuickInput } from '../utils/quickParse';
import { PriorityPicker } from './PriorityPicker';
import { TimeRangePicker } from './TimeRangePicker';

interface Props {
  /** 默认归属日期（跟随当前浏览的日期） */
  defaultDate: string;
  onAdd: (input: TaskInput) => void;
  /** 固定优先级（「重要事项」页固定为高） */
  forcedPriority?: Priority;
}

/** 快速添加卡片：输入标题回车即添加，展开后可设置日期、时间段、优先级、备注 */
export function QuickAdd({ defaultDate, onAdd, forcedPriority }: Props) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [priority, setPriority] = useState<Priority>(forcedPriority ?? 'medium');
  const [startTime, setStartTime] = useState<string | undefined>(undefined);
  const [endTime, setEndTime] = useState<string | undefined>(undefined);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDate(defaultDate);
  }, [defaultDate]);

  // 支持快捷键 N 聚焦输入框
  useEffect(() => {
    const onFocusRequest = () => inputRef.current?.focus();
    window.addEventListener('quickadd:focus', onFocusRequest);
    return () => window.removeEventListener('quickadd:focus', onFocusRequest);
  }, []);

  const defaultPriority = forcedPriority ?? 'medium';
  const expanded =
    focused ||
    title.trim() !== '' ||
    note.trim() !== '' ||
    date !== defaultDate ||
    priority !== defaultPriority ||
    !!startTime ||
    !!endTime;

  const submit = () => {
    const raw = title.trim();
    if (!raw) return;
    // 中文 Quick Add：识别日期/时间段/优先级/重复，剩余部分作为标题
    const parsed = parseQuickInput(raw);
    const nextDate = parsed.date ?? date;
    const nextPriority = forcedPriority ?? (parsed.priority ?? priority);
    const parsedHasTime = parsed.startTime !== undefined || parsed.endTime !== undefined;
    const nextStart = parsedHasTime ? parsed.startTime : startTime;
    const nextEnd = parsedHasTime ? parsed.endTime : endTime;
    onAdd({
      title: parsed.title || raw,
      note: note.trim(),
      date: nextDate,
      priority: nextPriority,
      startTime: nextStart,
      endTime: nextEnd,
      repeat: parsed.repeat,
    });
    // 同步识别结果到选项芯片，让用户看到刚才被识别的内容
    if (parsed.date) setDate(parsed.date);
    if (parsed.priority && !forcedPriority) setPriority(parsed.priority);
    setStartTime(nextStart);
    setEndTime(nextEnd);
    setTitle('');
    setNote('');
    inputRef.current?.focus();
  };

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
    }
  };

  const dateDirty = date !== todayStr();

  return (
    <div
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      className="relative rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-center gap-3">
        <Plus
          className={`h-5 w-5 shrink-0 transition-colors ${expanded ? 'text-rose-500' : 'text-stone-300 dark:text-zinc-600'}`}
        />
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit();
          }}
          placeholder={forcedPriority ? '添加重要事项，如"每周五 交周报"' : '今天要做什么？试试"明天下午3点 开会"'}
          className="w-full bg-transparent text-[15px] text-stone-800 outline-none placeholder:text-stone-400 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-stone-200 dark:text-zinc-700" aria-hidden />
      </div>

      {expanded && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3 dark:border-zinc-800/80">
          {/* 日期选择（原生日期选择器） */}
          <button
            type="button"
            onClick={openDatePicker}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              dateDirty
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
                : 'text-stone-500 hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <CalendarDays className="h-3.5 w-3.5" />
            {dateDirty ? humanDate(date) : '今天'}
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            tabIndex={-1}
            aria-hidden
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="pointer-events-none absolute h-px w-px opacity-0"
          />
          {!forcedPriority && <PriorityPicker value={priority} onChange={setPriority} />}
          <TimeRangePicker
            start={startTime}
            end={endTime}
            onChange={(s, e) => {
              setStartTime(s);
              setEndTime(e);
            }}
          />
          {/* 备注 */}
          <div className="flex min-w-[140px] flex-1 items-center gap-1.5 rounded-lg bg-stone-100/80 px-2.5 py-1.5 dark:bg-zinc-800/60">
            <MessageSquareText className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-zinc-500" />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) submit();
              }}
              placeholder="备注（可选）"
              className="w-full bg-transparent text-xs text-stone-600 outline-none placeholder:text-stone-400 dark:text-zinc-300 dark:placeholder:text-zinc-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
