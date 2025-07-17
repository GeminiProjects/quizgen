/**
 * 数据库 Schema 统一导出
 *
 * 导出所有表定义、关系和验证模式
 */

// 答题记录表
export {
  type Attempt,
  attempts,
  attemptsRelations,
  insertAttemptSchema,
  type NewAttempt,
  selectAttemptSchema,
} from './attempts';

// 认证相关表 (从 @repo/auth 导入)
export * from './auth';

// 工具函数导出
export { timestamps } from './columns.helpers';

// 演讲参与者表
export {
  insertLectureParticipantSchema,
  type LectureParticipant,
  lectureParticipants,
  lectureParticipantsRelations,
  type NewLectureParticipant,
  selectLectureParticipantSchema,
} from './lecture-participants';

// 演讲表
export {
  insertLectureSchema,
  type Lecture,
  lectures,
  lecturesRelations,
  type NewLecture,
  selectLectureSchema,
} from './lectures';

// 素材表
export {
  insertMaterialSchema,
  type Material,
  materials,
  materialsRelations,
  type NewMaterial,
  selectMaterialSchema,
} from './materials';

// 组织表
export {
  insertOrganizationSchema,
  type NewOrganization,
  type Organization,
  organizations,
  organizationsRelations,
  selectOrganizationSchema,
} from './organizations';

// 测试题表
export {
  insertQuizItemSchema,
  type NewQuizItem,
  type QuizItem,
  quizItems,
  quizItemsRelations,
  selectQuizItemSchema,
} from './quiz-items';

// 文字记录表
export {
  insertTranscriptSchema,
  type NewTranscript,
  selectTranscriptSchema,
  type Transcript,
  transcripts,
  transcriptsRelations,
} from './transcripts';
