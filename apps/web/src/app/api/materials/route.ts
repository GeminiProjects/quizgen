/**
 * 材料列表查询 API 路由
 * GET /api/materials?lectureId=xxx
 */
import { db, desc, eq, lectures, materials } from '@repo/db';
import { type NextRequest, NextResponse } from 'next/server';
import { getServerSideSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const session = await getServerSideSession();
    if (!session) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 2. 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const lectureId = searchParams.get('lectureId');

    if (!lectureId) {
      return NextResponse.json({ error: '缺少演讲 ID' }, { status: 400 });
    }

    // 3. 验证演讲权限
    const [lecture] = await db
      .select()
      .from(lectures)
      .where(eq(lectures.id, lectureId))
      .limit(1);

    if (!lecture) {
      return NextResponse.json({ error: '演讲不存在' }, { status: 404 });
    }

    if (lecture.owner_id !== session.user.id) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    // 4. 查询材料列表
    const materialsList = await db
      .select()
      .from(materials)
      .where(eq(materials.lecture_id, lectureId))
      .orderBy(desc(materials.created_at));

    // 5. 返回材料列表
    return NextResponse.json({
      materials: materialsList.map((material) => ({
        id: material.id,
        file_name: material.file_name,
        file_type: material.file_type,
        upload_status: material.upload_status,
        processing_progress: material.processing_progress || 0,
        text_content: material.text_content,
        error_message: material.error_message,
        created_at: material.created_at,
        updated_at: material.updated_at,
      })),
    });
  } catch (error) {
    console.error('Get materials list error:', error);
    return NextResponse.json(
      {
        error: '查询失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
