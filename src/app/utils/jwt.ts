import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

export const createToken = (
  jwtPayload: JwtPayload,
  secretToken: string,
  expiry: string, // Allow both string (e.g., "1h") or number (e.g., 3600)
) => {
  return jwt.sign(jwtPayload, secretToken, {
    expiresIn: expiry,
  } as SignOptions);
};

export const verifyToken = (token: string, secret: string) => {
  return jwt.verify(token, secret) as JwtPayload;
};
