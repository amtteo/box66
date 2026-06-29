import * as z from "zod";

export const SignInSchema = z.object({
  email: z.email({ error: "Zadaj platný e-mail." }).trim(),
  password: z.string().min(1, { error: "Zadaj heslo." }),
});

export const SignUpSchema = z.object({
  fullName: z
    .string()
    .min(2, { error: "Meno musí mať aspoň 2 znaky." })
    .max(120, { error: "Meno je príliš dlhé." })
    .trim(),
  email: z.email({ error: "Zadaj platný e-mail." }).trim(),
  password: z.string().min(6, { error: "Heslo musí mať aspoň 6 znakov." }),
});

export type AuthFormState =
  | {
      ok?: false;
      errors?: Record<string, string[]>;
      message?: string;
      values?: Record<string, string>;
    }
  | undefined;

export type CheckoutSignInState =
  | {
      ok: true;
      customer: { name?: string; email: string };
    }
  | AuthFormState;
