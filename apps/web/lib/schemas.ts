import { z } from "zod";

export const componentSchema = z.object({
  name: z.string().max(60),
  amount: z.number().finite().min(0).max(100_000_000),
  x: z.string().max(40).optional(),
});

export const profileSchema = z
  .object({
    role: z.string().max(60).optional(),
    experienceYears: z.number().min(0).max(60).optional(),
    cityTier: z.enum(["metro", "non-metro"]).optional(),
    monthlyRent: z.number().min(0).max(10_000_000).optional(),
    declaredDeductions: z.number().min(0).max(10_000_000).optional(),
  })
  .optional();

export const salaryInputSchema = z.object({
  earnings: z.array(componentSchema).max(30),
  deductions: z.array(componentSchema).max(30),
  includeEPF: z.boolean(),
  includeTDS: z.boolean(),
  fy: z.literal("FY2025-26").optional(),
  profile: profileSchema,
});

export const offerInputSchema = z.object({
  label: z.string().max(60),
  annualCTC: z.number().min(0).max(1_000_000_000),
  variableShare: z.number().min(0).max(1),
  fy: z.literal("FY2025-26").optional(),
});

export const offersSchema = z.object({
  offers: z.array(offerInputSchema).min(2).max(4),
});

export const waitlistSchema = z.object({
  email: z.string().email().max(200),
  source: z.string().max(60).default("landing"),
});
