import dotenv from "dotenv";
dotenv.config();
import { USERS } from "../config/users.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";

export const login = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    const USER1 = process.env.USER_1;
    const USER2 = process.env.USER_2;
    const rolePasswords = {
      [USER1]: process.env.PASSWORD_1,
      [USER2]: process.env.PASSWORD_2,
    };

    let role;

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

    const user = {
  _id: role,
  role,
  pfp: USERS[role]?.pfp || null,
};
    generateToken(res, user);

    res.status(200).json({
      message: "Login successful",
      role,
      user,
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
  const authUser = req.user; // from protect middleware
  const otherRole = Object.keys(USERS).find(r => r !== authUser.role);

  res.status(200).json({
    authenticated: true,
    user: {
      _id: authUser._id,
      role: authUser.role,
      pfp: USERS[authUser.role]?.pfp || null,
    },
    otherUser: {
      _id: otherRole,
      role: otherRole,
      pfp: USERS[otherRole]?.pfp || null,
    },
  });
};
