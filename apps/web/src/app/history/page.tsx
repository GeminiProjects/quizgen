'use client';
import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import { Select } from '@repo/ui/components/select';
import { format } from 'date-fns';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';

type AttemptRecord = {
  id: string;
  date: string; // ISO string
  lecture: string;
  score: number;
  total: number;
};

const mockAttempts: AttemptRecord[] = [
  {
    id: '1',
    date: '2024-06-01T10:00:00Z',
    lecture: 'AI导论',
    score: 8,
    total: 10,
  },
  {
    id: '2',
    date: '2024-06-02T14:30:00Z',
    lecture: '数据结构',
    score: 7,
    total: 10,
  },
  {
    id: '3',
    date: '2024-06-03T09:15:00Z',
    lecture: 'AI导论',
    score: 10,
    total: 10,
  },
  {
    id: '4',
    date: '2024-06-04T16:45:00Z',
    lecture: '操作系统',
    score: 6,
    total: 10,
  },
  // ...可扩展更多mock数据
];

const PAGE_SIZE = 2;

const getUniqueLectures = (records: AttemptRecord[]) => [
  ...new Set(records.map((r) => r.lecture)),
];

const HistoryPage: React.FC = () => {
  const [lecture, setLecture] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // 过滤后的数据
  const filtered = useMemo(() => {
    return mockAttempts.filter((r) => {
      if (lecture && r.lecture !== lecture) {
        return false;
      }
      if (startDate && r.date < startDate) {
        return false;
      }
      if (endDate && r.date > endDate) {
        return false;
      }
      return true;
    });
  }, [lecture, startDate, endDate]);

  // 分页
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // 讲座选项
  const lectures = useMemo(() => getUniqueLectures(mockAttempts), []);

  // 页码越界修正
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages || 1);
    }
  }, [totalPages, page]);

  const handleFilter = () => {
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-4 font-bold text-2xl text-foreground">历史答题记录</h1>
      <Card className="mb-6 flex flex-col items-center gap-4 p-4 md:flex-row">
        <Select
          aria-label="按讲座筛选"
          onValueChange={setLecture}
          value={lecture}
        >
          <option value="">全部讲座</option>
          {lectures.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
        <Input
          aria-label="起始日期"
          className="w-36"
          onChange={(e) => setStartDate(e.target.value)}
          type="date"
          value={startDate}
        />
        <Input
          aria-label="结束日期"
          className="w-36"
          onChange={(e) => setEndDate(e.target.value)}
          type="date"
          value={endDate}
        />
        <Button aria-label="筛选" onClick={handleFilter}>
          筛选
        </Button>
      </Card>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-background text-foreground">
          <thead>
            <tr className="bg-muted">
              <th className="px-4 py-2 text-left">答题时间</th>
              <th className="px-4 py-2 text-left">讲座名称</th>
              <th className="px-4 py-2 text-left">分数</th>
              <th className="px-4 py-2 text-left">题目数</th>
              <th className="px-4 py-2 text-left">正确率</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  className="py-8 text-center text-muted-foreground"
                  colSpan={5}
                >
                  暂无答题记录
                </td>
              </tr>
            ) : (
              paged.map((r) => (
                <tr
                  aria-label={`答题记录 ${r.lecture} ${r.date}`}
                  className="outline-none transition-colors hover:bg-accent focus:bg-accent"
                  key={r.id}
                  tabIndex={0}
                >
                  <td className="px-4 py-2">
                    {format(new Date(r.date), 'yyyy-MM-dd HH:mm')}
                  </td>
                  <td className="px-4 py-2">{r.lecture}</td>
                  <td className="px-4 py-2">{r.score}</td>
                  <td className="px-4 py-2">{r.total}</td>
                  <td className="px-4 py-2">
                    {((r.score / r.total) * 100).toFixed(0)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* 分页器 */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <Button
          aria-label="上一页"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          variant="outline"
        >
          上一页
        </Button>
        <span className="px-2 text-sm">
          第 {page} / {totalPages || 1} 页
        </span>
        <Button
          aria-label="下一页"
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          variant="outline"
        >
          下一页
        </Button>
      </div>
    </div>
  );
};

export default HistoryPage;
