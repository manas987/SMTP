import z from "zod";

export const createSenderSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const deleteSenderSchema = z.object({
  senderId: z.int().positive(),
});
