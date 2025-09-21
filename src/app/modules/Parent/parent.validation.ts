import { z } from "zod";

export const ParentValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  childs_name: z.string().min(1, "Child's name is required"),
  childs_grade: z.string().min(1, "Child's grade is required"),
  relationship_with_child: z
    .array(z.string())
    .min(1, "Relationship with child is required"),
  profileImage: z.string().optional(),
});
