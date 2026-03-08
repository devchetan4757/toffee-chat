import jwt from "jsonwebtoken";

export const generateToken = (res, payload) => {

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "90m",
  });

  res.cookie("jwt", token, {
    maxAge: 90 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
};
