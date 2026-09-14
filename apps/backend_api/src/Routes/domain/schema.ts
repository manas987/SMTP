import z from "zod";

export const createDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(253)
    .regex(
      /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/,
      "invalid domain",
    ),
});

export const verifyDomainSchema = z.object({
  domainId: z.int().positive(),
});

export const deleteDomainSchema = z.object({
  domainId: z.int().positive(),
});
