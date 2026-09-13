import z from "zod";

export const createOrgSchema = z.object({
  name: z.string().min(1),
});

export const updateOrgSchema = z.object({
  orgId: z.int().positive(),
  name: z.string().min(1),
});

export const deleteOrgSchema = z.object({
  orgId: z.int().positive(),
});
