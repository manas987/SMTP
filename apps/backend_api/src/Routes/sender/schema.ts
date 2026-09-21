import z from "zod";

export const createSenderSchema = z.object({
  email: z.string().email(),
});

export const deleteSenderSchema = z.object({
  senderId: z.int().positive(),
});
