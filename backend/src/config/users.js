import dotenv from "dotenv";
dotenv.config();

export const USERS = {
  [process.env.USER_1]: {
    role: process.env.USER_1,
    pfp: process.env.USER1_PFP,
  },
  [process.env.USER_2]: {
    role: process.env.USER_2,
    pfp: process.env.USER2_PFP,
  },
};
