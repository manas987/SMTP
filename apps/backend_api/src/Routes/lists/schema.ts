import z from "zod";

export const createListSchema = z.object({
  orgId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(100),
});

export const readListsSchema = z.object({
  orgId: z.coerce.number().int().positive(),
});

export const readListMembersSchema = z.object({
  listId: z.coerce.number().int().positive(),
});

export const updateListSchema = z.object({
  listId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(100),
});

export const addListMemberSchema = z.object({
  listId: z.coerce.number().int().positive(),
  email: z.string().trim().email(),
});

export const deleteListMemberSchema = z.object({
  listId: z.coerce.number().int().positive(),
  email: z.string().trim().email(),
});

export const deleteListSchema = z.object({
  listId: z.coerce.number().int().positive(),
});