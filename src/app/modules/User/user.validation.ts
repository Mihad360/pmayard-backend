import z from "zod";

export const userValidationSchema = z.object({
  body: z.object({
    roleId: z.string().optional().nullable(), // roleId is optional, or can be null
    email: z.string().toLowerCase().min(1, { message: "Email is required" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 8 characters long" })
      .max(20, { message: "Password must not exceed 128 characters" })
      .nonempty({ message: "Password is required" }),
    role: z.enum(["professional", "parent", "admin"], {
      message: "Role must be one of 'professional', 'parent', or 'admin'",
    }),
  }),
});
