import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  display_name: z.string(),
  role: z.string(),
  avatar_url: z.string().optional().nullable(),
  mfa_enabled: z.boolean().default(false),
  created_at: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema,
  access_token: z.string(),
  refresh_token: z.string(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const MFARequiredSchema = z.object({
  mfa_required: z.literal(true),
  temp_token: z.string().optional(),
});

export const GenericSuccessSchema = z.object({
  status: z.literal('success'),
  message: z.string().optional(),
  data: z.any().optional(),
});

export const GenericErrorSchema = z.object({
  status: z.literal('error'),
  message: z.string(),
  details: z.any().optional(),
});
