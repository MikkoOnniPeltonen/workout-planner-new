import { z } from 'zod';

// Single source of truth for password rules: the backend validates with them and the
// signup form renders them as live hints.
export const passwordRules = [
  { label: 'At least 12 characters', test: (value: string) => value.length >= 12 },
  { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One number', test: (value: string) => /\d/.test(value) },
] as const;

export const passwordSchema = passwordRules.reduce(
  (schema, rule) => schema.refine(rule.test, `Password needs ${rule.label.toLowerCase()}.`),
  z
    .string()
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      'Password must be at most 72 UTF-8 bytes.',
    ),
);

const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Provide a valid email address.'));

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(60, 'Name must be at most 60 characters.'),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
