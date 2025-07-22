import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Input } from '@repo/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@repo/ui/components/select';
import { Users } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';

export type Organization = {
  id: string | number;
  name: string;
  description?: string;
  createdAt?: string;
  memberCount?: number;
  quizCount?: number;
  quizTypes?: string[];
};

type OrganizationListContainerProps = {
  organizations: Organization[];
};

const quizTypeOptions = [
  { value: 'all', label: '全部题型' },
  { value: 'single', label: '单选题' },
  { value: 'multi', label: '多选题' },
  { value: 'judge', label: '判断题' },
];

const sortOptions = [
  { value: 'createdAt', label: '按创建时间' },
  { value: 'memberCount', label: '按人数' },
  { value: 'quizCount', label: '按题目数量' },
];

const OrganizationListContainer: React.FC<OrganizationListContainerProps> = ({
  organizations,
}) => {
  const [search, setSearch] = useState('');
  const [filterQuizType, setFilterQuizType] = useState('all');
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredOrganizations = useMemo(() => {
    let result = organizations;
    if (search) {
      result = result.filter(
        (org) =>
          org.name.includes(search) ||
          (org.description?.includes(search) ?? false)
      );
    }
    if (filterQuizType !== 'all') {
      result = result.filter((org) => org.quizTypes?.includes(filterQuizType));
    }
    result = [...result].sort((a, b) => {
      let compareValue = 0;
      if (sortKey === 'createdAt') {
        compareValue =
          new Date(a.createdAt || '').getTime() -
          new Date(b.createdAt || '').getTime();
      } else if (sortKey === 'memberCount') {
        compareValue = (a.memberCount || 0) - (b.memberCount || 0);
      } else if (sortKey === 'quizCount') {
        compareValue = (a.quizCount || 0) - (b.quizCount || 0);
      }
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    return result;
  }, [organizations, search, filterQuizType, sortKey, sortOrder]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Users className="h-5 w-5" />
          组织列表
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <Input
            className="w-full md:w-60"
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索组织名称/描述"
            value={search}
          />
          <Select onValueChange={setFilterQuizType} value={filterQuizType}>
            <SelectTrigger className="w-full md:w-40" />
            <SelectContent>
              {quizTypeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setSortKey} value={sortKey}>
            <SelectTrigger className="w-full md:w-40" />
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}
            value={sortOrder}
          >
            <SelectTrigger className="w-full md:w-32" />
            <SelectContent>
              <SelectItem value="desc">降序</SelectItem>
              <SelectItem value="asc">升序</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrganizations.length > 0 ? (
            filteredOrganizations.map((org) => (
              <div
                className="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm"
                key={org.id}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-base">{org.name}</span>
                </div>
                <div className="line-clamp-2 text-muted-foreground text-sm">
                  {org.description || '暂无描述'}
                </div>
                <div className="flex flex-wrap gap-2 text-muted-foreground text-xs">
                  <span>人数: {org.memberCount ?? '-'}</span>
                  <span>题目数: {org.quizCount ?? '-'}</span>
                  <span>
                    题型:{' '}
                    {org.quizTypes && org.quizTypes.length > 0
                      ? org.quizTypes.join('、')
                      : '-'}
                  </span>
                  <span>
                    创建时间:{' '}
                    {org.createdAt
                      ? new Date(org.createdAt).toLocaleDateString()
                      : '-'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-muted-foreground">
              暂无组织
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrganizationListContainer;
