import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";

export const login = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const rolePasswords = {
      Chsmish: process.env.PASSWORD1,
      Rotlu: process.env.PASSWORD2,
    };

    let role = null;

    for (const [r, hash] of Object.entries(rolePasswords)) {
      const match = await bcrypt.compare(password, hash);

      if (match) {
        role = r;
        break;
      }
    }

    if (!role) {
      return res.status(401).json({ message: "Invalid password" });
    }

    generateToken(res, { role });

    res.status(200).json({
      message: "Login successful",
      role,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("Error in logout controller", error.message);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const checkAuth = (req, res) => {
  res.status(200).json({
    authenticated: true,
    user: req.user,
  });
};
