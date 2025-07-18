import {
  and,
  asc,
  count,
  db,
  desc,
  eq,
  isNotNull,
  like,
  or,
  organizations,
  users,
} from '@repo/db';
import { type NextRequest, NextResponse } from 'next/server';
import { getServerSideSession } from '@/lib/auth';

/**
 * 构建搜索条件
 */
function buildSearchConditions(search: string) {
  const conditions = [isNotNull(organizations.password)];

  if (search) {
    const searchPattern = `%${search}%`;
    const searchCondition = or(
      like(organizations.name, searchPattern),
      like(organizations.description, searchPattern)
    );
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  return conditions;
}

/**
 * 获取所有公开组织列表（用于选择加入）
 * 返回所有设置了密码的组织，供演讲者选择
 */
export async function GET(request: NextRequest) {
  // 验证用户身份
  const session = await getServerSideSession();
  if (!session?.user) {
    return NextResponse.json(
      {
        success: false,
        message: '未登录',
      },
      { status: 401 }
    );
  }

  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get('limit') || '20'))
    );
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // 计算偏移量
    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = buildSearchConditions(search);

    // 构建查询 - 只查询设置了密码的组织（公开组织）
    const query = db
      .select({
        id: organizations.id,
        name: organizations.name,
        description: organizations.description,
        created_at: organizations.created_at,
        updated_at: organizations.updated_at,
        owner: {
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        },
      })
      .from(organizations)
      .innerJoin(users, eq(organizations.owner_id, users.id))
      .where(and(...conditions));

    // 应用排序
    if (sortBy === 'name') {
      query.orderBy(
        sortOrder === 'asc' ? asc(organizations.name) : desc(organizations.name)
      );
    } else {
      query.orderBy(
        sortOrder === 'asc'
          ? asc(organizations.created_at)
          : desc(organizations.created_at)
      );
    }

    // 添加分页
    query.limit(limit).offset(offset);

    // 执行查询
    const result = await query;

    // 获取总数
    const [{ total }] = await db
      .select({ total: count() })
      .from(organizations)
      .where(and(...buildSearchConditions(search)));

    // 计算总页数
    const totalCount = Number(total) || 0;
    const pages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        data: result,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages,
        },
      },
    });
  } catch (error) {
    console.error('获取公开组织列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        message: '获取组织列表失败',
      },
      { status: 500 }
    );
  }
}
