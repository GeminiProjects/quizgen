// /**
//  * 文件上传 API 路由
//  * POST /api/materials/upload
//  */

// import {
//   createGeminiClient,
//   FileProcessor,
//   MAX_FILE_SIZE,
//   SUPPORTED_MIME_TYPES,
//   type SupportedMimeType,
// } from '@repo/ai';
// import { db, eq, lectures, materials } from '@repo/db';
// import { type NextRequest, NextResponse } from 'next/server';
// import { getServerSideSession } from '@/lib/auth';

// export async function POST(request: NextRequest) {
//   try {
//     // 1. 验证用户身份
//     const session = await getServerSideSession();
//     if (!session) {
//       return NextResponse.json({ error: '未登录' }, { status: 401 });
//     }

//     // 2. 解析请求
//     const formData = await request.formData();
//     const file = formData.get('file') as File;
//     const lectureId = formData.get('lectureId') as string;

//     // 3. 验证参数
//     if (!file) {
//       return NextResponse.json({ error: '请选择文件' }, { status: 400 });
//     }

//     if (!lectureId) {
//       return NextResponse.json({ error: '缺少演讲 ID' }, { status: 400 });
//     }

//     // 4. 验证文件大小
//     if (file.size > MAX_FILE_SIZE) {
//       return NextResponse.json(
//         { error: `文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024} MB` },
//         { status: 400 }
//       );
//     }

//     // 5. 验证文件类型
//     if (!SUPPORTED_MIME_TYPES.includes(file.type as SupportedMimeType)) {
//       return NextResponse.json(
//         {
//           error: '不支持的文件类型',
//           supportedTypes: SUPPORTED_MIME_TYPES,
//         },
//         { status: 400 }
//       );
//     }

//     // 6. 验证演讲是否存在并且用户有权限
//     const [lecture] = await db
//       .select()
//       .from(lectures)
//       .where(eq(lectures.id, lectureId))
//       .limit(1);

//     if (!lecture) {
//       return NextResponse.json({ error: '演讲不存在' }, { status: 404 });
//     }

//     if (lecture.owner_id !== session.user.id) {
//       return NextResponse.json({ error: '无权限' }, { status: 403 });
//     }

//     // 7. 创建数据库记录
//     const [material] = await db
//       .insert(materials)
//       .values({
//         lecture_id: lectureId,
//         file_name: file.name,
//         file_type: file.type,
//         upload_status: 'uploading',
//         created_by: session.user.id,
//       })
//       .returning();

//     // 8. 异步处理文件
//     processFileAsync(material.id, file).catch(async (error) => {
//       console.error('文件处理失败:', error);

//       // 如果是早期失败（如 fetch failed），删除数据库记录
//       const errorMessage = error.message || '处理失败';
//       const isEarlyFailure =
//         errorMessage.includes('fetch failed') ||
//         errorMessage.includes('Gemini API 文件上传失败');

//       if (isEarlyFailure) {
//         // 删除失败的记录
//         try {
//           await db.delete(materials).where(eq(materials.id, material.id));
//           console.log(`已删除失败的材料记录: ${material.id}`);
//         } catch (deleteError) {
//           console.error('删除失败记录时出错:', deleteError);
//         }
//       } else {
//         // 其他类型的失败，只更新状态
//         try {
//           await db
//             .update(materials)
//             .set({
//               upload_status: 'failed',
//               error_message: errorMessage,
//             })
//             .where(eq(materials.id, material.id));
//         } catch (updateError) {
//           console.error('更新失败状态时出错:', updateError);
//         }
//       }
//     });

//     // 9. 立即返回，让前端轮询状态
//     return NextResponse.json({
//       materialId: material.id,
//       status: 'uploading',
//     });
//   } catch (error) {
//     console.error('Upload error:', error);
//     return NextResponse.json(
//       {
//         error: '上传失败',
//         details: error instanceof Error ? error.message : '未知错误',
//       },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * 异步处理文件
//  * @param materialId - 材料记录 ID
//  * @param file - 文件对象
//  */
// async function processFileAsync(materialId: string, file: File) {
//   try {
//     // 1. 检查环境变量
//     const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
//     if (!apiKey) {
//       throw new Error('缺少 GOOGLE_GENERATIVE_AI_API_KEY 环境变量');
//     }

//     // 2. 创建 Gemini 客户端和文件处理器
//     const client = createGeminiClient(apiKey);
//     const processor = new FileProcessor(client);

//     // 3. 更新状态：处理中
//     await db
//       .update(materials)
//       .set({ upload_status: 'processing', processing_progress: 30 })
//       .where(eq(materials.id, materialId));

//     // 4. 转换文件为 Buffer
//     const arrayBuffer = await file.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);

//     // 5. 上传到 Gemini 并等待处理
//     const fileInfo = await processor.uploadAndProcess(
//       buffer,
//       file.type,
//       file.name
//     );

//     // 6. 更新状态：提取中
//     await db
//       .update(materials)
//       .set({
//         upload_status: 'extracting',
//         processing_progress: 70,
//         gemini_file_uri: fileInfo.uri,
//       })
//       .where(eq(materials.id, materialId));

//     // 7. 提取文本内容
//     if (!fileInfo.uri) {
//       throw new Error('文件上传成功但未返回 URI');
//     }

//     const extractedText = await processor.extractText(
//       fileInfo.uri,
//       file.name,
//       file.type
//     );

//     // 8. 更新状态：完成
//     await db
//       .update(materials)
//       .set({
//         upload_status: 'completed',
//         processing_progress: 100,
//         text_content: extractedText,
//       })
//       .where(eq(materials.id, materialId));

//     console.log(`材料处理完成: ${materialId}`);
//   } catch (error) {
//     console.error(`材料处理失败 (${materialId}):`, error);

//     // 更新状态：失败
//     await db
//       .update(materials)
//       .set({
//         upload_status: 'failed',
//         error_message: error instanceof Error ? error.message : '未知错误',
//       })
//       .where(eq(materials.id, materialId));

//     throw error;
//   }
// }

// // 配置最大请求体大小
// export const maxDuration = 60; // 60 秒超时
