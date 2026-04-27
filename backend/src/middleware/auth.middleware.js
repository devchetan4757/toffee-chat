import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
  _id: decoded._id,
  role: decoded.role,
};
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
