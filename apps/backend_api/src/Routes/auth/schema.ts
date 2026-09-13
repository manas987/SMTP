import z from "zod";

export const signup = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(8),
});

export const signin = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(8),
});