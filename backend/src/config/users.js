import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

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
