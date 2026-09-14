import z from "zod";

export const createListSchema = z.object({
  name: z.string().min(1),
});

export const readListsSchema = z.object({});

export const readListMembersSchema = z.object({
  listId: z.int().positive(),
});

export const updateListSchema = z.object({
  listId: z.int().positive(),
  name: z.string().min(1),
});

export const addListMemberSchema = z.object({
  listId: z.int().positive(),
  email: z.string().email(),
});

export const deleteListMemberSchema = z.object({
  listId: z.int().positive(),
  email: z.string().email(),
});

export const deleteListSchema = z.object({
  listId: z.int().positive(),
});