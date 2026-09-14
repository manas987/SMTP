import z from "zod";

export const sendListEmailSchema = z.object({
  listId: z.int().positive(),
  senderId: z.int().positive(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export const sendSingleEmailSchema = z.object({
  to: z.string().email(),
  senderId: z.int().positive(),
  subject: z.string().min(1),
  body: z.string().min(1),
});