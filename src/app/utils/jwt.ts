import jwt, {
  JsonWebTokenError,
  JwtPayload,
  NotBeforeError,
  SignOptions,
  TokenExpiredError,
} from "jsonwebtoken";

export const createToken = (
  jwtPayload: JwtPayload,
  secretToken: string,
  expiry: string, // Allow both string (e.g., "1h") or number (e.g., 3600)
) => {
  return jwt.sign(jwtPayload, secretToken, {
    expiresIn: expiry,
  } as SignOptions);
};

export const verifyToken = (
  token: string,
  secret: string,
): JwtPayload | null => {
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    // Check for specific JWT error types
    if (error instanceof TokenExpiredError) {
      console.error("JWT Error: Token has expired");
    } else if (error instanceof JsonWebTokenError) {
      console.error("JWT Error: Invalid or malformed token");
    } else if (error instanceof NotBeforeError) {
      console.error("JWT Error: Token not active yet (nbf)");
    } else {
      console.error("JWT Unknown Error:", error);
    }

    return null;
  }
};
