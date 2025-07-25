/**
 * 材料状态查询 API 路由
 * GET /api/materials/[id]/status
 */
import { db, eq, lectures, materials } from '@repo/db';
import { type NextRequest, NextResponse } from 'next/server';
import { getServerSideSession } from '@/lib/auth';

export async function GET(
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
    const [material] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, id))
      .limit(1);

    if (!material) {
      return NextResponse.json({ error: '材料不存在' }, { status: 404 });
    }

    // 3. 查询关联的演讲
    const [lecture] = await db
      .select()
      .from(lectures)
      .where(eq(lectures.id, material.lecture_id))
      .limit(1);

    // 4. 验证权限 - 只有创建者或演讲的创建者可以查看
    const hasPermission =
      material.created_by === session.user.id ||
      (lecture && lecture.owner_id === session.user.id);

    if (!hasPermission) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    // 5. 返回材料状态信息
    return NextResponse.json({
      id: material.id,
      fileName: material.file_name,
      fileType: material.file_type,
      status: material.status,
      progress: 0, // 不再存储进度
      textContent: material.text_content,
      error: material.error_message,
      createdAt: material.created_at,
      updatedAt: material.updated_at,
    });
  } catch (error) {
    console.error('Get material status error:', error);
    return NextResponse.json(
      {
        error: '查询失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
