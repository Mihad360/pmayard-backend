import { Types } from "mongoose";
import { sendEmail } from "../../utils/sendEmail";
import { ParentModel } from "../Parent/parent.model";
import { ProfessionalModel } from "../Professional/professional.model";
import { UserModel } from "../User/user.model";

export const sessionSearch = ["day", "subject", "status"];
export const parentSearch = [
  "name",
  "phoneNumber",
  "childs_name",
  "childs_grade",
  "relationship_with_child",
];
export const professionalSearch = [
  "name",
  "phoneNumber",
  "bio",
  "qualification",
  "subjects",
];

export const sendAssignmentEmail = async (
  professionalId: string | Types.ObjectId | undefined,
  parentId: string | Types.ObjectId | undefined,
  sessionCode: string | undefined,
) => {
  try {
    // Find the professional details
    const professional =
      await ProfessionalModel.findById(professionalId).populate("user");
    if (!professional) {
      throw new Error("Professional not found");
    }

    const parentExist = await ParentModel.findById(parentId).populate("user");
    if (!parentExist) {
      throw new Error("Parent not found");
    }

    const parentEmail = await UserModel.findById(parentExist.user);
    const email = parentEmail?.email;

    // Construct the email subject and body
    const emailSubject = `You have been assigned to a new professional`;
    const emailBody = `
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <p>Dear <span style="font-weight: bold; color: #2C3E50;">${parentExist.name}</span>,</p>
      
      <p>We are pleased to inform you that you have been assigned to a new professional for your child’s session.</p>

      <p style="margin-bottom: 10px;">
        <strong>Professional Details:</strong>
      </p>

      <table style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="font-weight: bold; width: 150px;">Name:</td>
          <td>${professional.name}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Phone Number:</td>
          <td>${professional.phoneNumber}</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Bio:</td>
          <td>${professional.bio}</td>
        </tr>
      </table>

      <p style="font-weight: bold; color: #E74C3C;">
        Your session code to access the session: 
        <span style="font-size: 18px; font-weight: bold; color: #16A085;">${sessionCode}</span>
      </p>

      <p>Please use this code to access the session.</p>

      <br>
      <p>Best regards,</p>
      <p style="font-weight: bold;">Your Team</p>
    </body>
  </html>
`;

    // Send the email
    await sendEmail(email as string, emailSubject, emailBody);

    return { message: "Email sent successfully" };
  } catch (error) {
    throw new Error(`Error sending email: ${error}`);
  }
};
