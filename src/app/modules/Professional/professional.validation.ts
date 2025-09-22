import { z } from "zod";

const TimeSlotSchema = z.object({
  startTime: z.string().min(5, "Start time must be in format HH:MM AM/PM"),
  endTime: z.string().min(5, "End time must be in format HH:MM AM/PM"),
  status: z.enum(["available", "booked", "disabled"]),
});

const AvailabilitySchema = z.object({
  day: z.enum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ]),
  timeSlots: z.array(TimeSlotSchema),
});

export const ProfessionalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bio: z.string().min(1, "Bio is required"),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
  profileImage: z.string(),
  qualification: z.string().min(1, "Qualification is required"),
  subjects: z.array(z.string()).nonempty("At least one subject is required"),
  availability: z
    .array(AvailabilitySchema)
    .nonempty("Availability is required"),
});
