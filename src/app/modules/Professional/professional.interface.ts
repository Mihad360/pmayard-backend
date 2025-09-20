interface TimeSlot {
  startTime: string; // Start time of the slot (e.g., "9:00 AM")
  endTime: string; // End time of the slot (e.g., "10:00 AM")
  status: "available" | "booked" | "disabled"; // Slot status
}

interface Availability {
  date: Date; // Specific date for availability
  timeSlots: TimeSlot[]; // Multiple time slots for that day
}

export interface IProfessional {
  name: string;
  bio: string;
  phoneNumber: string;
  profileImage: string;
  qualification: string;
  subjects: string[];
  availability: Availability[]; // Array of availability objects
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
