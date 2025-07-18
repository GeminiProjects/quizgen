/**
 * 材料状态查询 API 路由
 * GET /api/materials/[id]/status
 */
import { db } from '@repo/db';
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
    const material = await db.query.materials.findFirst({
      where: (materials, { eq }) => eq(materials.id, id),
      with: {
        lecture: true,
      },
    });

    if (!material) {
      return NextResponse.json({ error: '材料不存在' }, { status: 404 });
    }

    // 3. 验证权限 - 只有创建者或演讲的创建者可以查看
    const hasPermission =
      material.created_by === session.user.id ||
      material.lecture.owner_id === session.user.id;

    if (!hasPermission) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    // 4. 返回材料状态信息
    return NextResponse.json({
      id: material.id,
      fileName: material.file_name,
      fileType: material.file_type,
      status: material.upload_status,
      progress: material.processing_progress || 0,
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
