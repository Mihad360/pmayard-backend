import { UserModel } from "../modules/User/user.model";

const admin = {
  email: "admin@gmail.com",
  password: "123456",
  role: "admin",
  isVerified: true,
  //   profilePhotoUrl:
  //     "https://res.cloudinary.com/dmzmx97wn/image/upload/v1754835427/IMG-20250331-WA0261.jpg",
  roleRef: "Admin",
};

const seedSuperAdmin = async () => {
  const isSuperAdminExist = await UserModel.findOne({
    email: admin.email,
  });
  if (!isSuperAdminExist) {
    await UserModel.create(admin);
  }
};

export default seedSuperAdmin;
