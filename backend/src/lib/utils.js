import jwt from "jsonwebtoken";

export const generateToken = (res) => {
  const token = jwt.sign(
    { sub: "shared-access", 
      scope : "authorized",
    }, process.env.JWT_SECRET, {
    expiresIn: "90min",
  });

  res.cookie("jwt", token, {
    maxAge: 90 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: "strict", // CSRF attacks cross-site request forgery attacks
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
};
