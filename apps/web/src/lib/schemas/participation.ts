import { z } from "zod";

export const submitAnswerSchema = z.object({
  lectureId: z.string().cuid2(),
  quizItemId: z.string().cuid2(),
  answer: z.number().int(),
});
