import { z } from "zod";
import {
  isUsernameIdentity,
  usernameSchema,
  usernameSignupEnabled,
} from "@/lib/auth/local-username";
import { AUTH_PASSWORD_MIN_LENGTH } from "@/lib/auth/password-policy";

const MIN_LENGTH_MESSAGE = `Password must contain at least ${AUTH_PASSWORD_MIN_LENGTH} characters`;

export type LoginProvider = "google" | "github" | "discord" | "microsoft";

const emailSchema = z
  .string()
  .email()
  .max(128, "Email must contain at most 128 characters")
  .trim()
  .refine((value) => !isUsernameIdentity(value), "Invalid email");

export const loginFormSchema = z.object({
  email: z
    .string()
    .pipe(
      z.union([
        emailSchema,
        usernameSchema.refine(() => usernameSignupEnabled(), "Invalid email"),
      ]),
    ),
  password: z
    .string()
    .min(6, "Password must contain at least 6 characters")
    .max(64, "Password must contain at most 64 characters"),
});

export const signupFormSchema = z
  .object({
    email: z.string().transform((value, ctx) => {
      const result = (
        usernameSignupEnabled() ? usernameSchema : emailSchema
      ).safeParse(value);
      if (result.success) return result.data;
      for (const issue of result.error.issues) ctx.addIssue(issue);
      return z.NEVER;
    }),
    password: z
      .string()
      .min(AUTH_PASSWORD_MIN_LENGTH, MIN_LENGTH_MESSAGE)
      .max(64, "Password must contain at most 64 characters"),
    confirmPassword: z
      .string()
      .min(AUTH_PASSWORD_MIN_LENGTH, MIN_LENGTH_MESSAGE)
      .max(64, "Password must contain at most 64 characters"),
    marketingOptOut: z.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const sendEmailFormSchema = z.object({
  email: z
    .string()
    .email()
    .max(128, "Email must contain at most 128 characters")
    .trim(),
});

export const changePasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(AUTH_PASSWORD_MIN_LENGTH, MIN_LENGTH_MESSAGE)
      .max(64, "Password must contain at most 64 characters"),
    confirmPassword: z
      .string()
      .min(AUTH_PASSWORD_MIN_LENGTH, MIN_LENGTH_MESSAGE)
      .max(64, "Password must contain at most 64 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
