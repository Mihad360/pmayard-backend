import { z } from "zod";

export const sessionValidationSchema = z.object({
  body: z.object({
    parent: z.string(), // Validates that parent is a non-empty string
    professional: z.string(), // Validates that professional is a non-empty string
    day: z.enum([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]),
    date: z.date(),
    time: z.string(),
    subject: z.string(),
    status: z.enum(["Upcoming", "Completed", "Canceled"]),
  }),
});

export const sessionStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(["Completed", "Canceled"]),
  }),
});
