/**
 * 材料删除 API 路由
 * DELETE /api/materials/[id]
 */
import { db, eq, materials } from '@repo/db';
import { type NextRequest, NextResponse } from 'next/server';
import { getServerSideSession } from '@/lib/auth';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 验证用户身份
    const session = await getServerSideSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: '缺少材料 ID' }, { status: 400 });
    }

    // 2. 查询材料记录
    const material = await db.query.materials.findFirst({
      where: (t, { eq: whereEq }) => whereEq(t.id, id),
      with: {
        lecture: true,
      },
    });

    if (!material) {
      return NextResponse.json({ error: '材料不存在' }, { status: 404 });
    }

    // 3. 验证权限 - 只有创建者或演讲的创建者可以删除
    const hasPermission =
      material.created_by === session.user.id ||
      material.lecture.owner_id === session.user.id;

    if (!hasPermission) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    // 4. 删除材料记录
    await db.delete(materials).where(eq(materials.id, id));

    // 5. 返回成功响应
    return NextResponse.json({
      success: true,
      message: '材料已删除',
    });
  } catch (error) {
    console.error('Delete material error:', error);
    return NextResponse.json(
      {
        error: '删除失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
