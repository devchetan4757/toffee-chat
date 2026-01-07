import bcrypt from "bcryptjs";

// example
const password = "chetan4757143";

// hashed password (store this in .env)
const hashedPassword = await bcrypt.hash(password, 10);
console.log("HASH:", hashedPassword);

// compare
const isMatch = await bcrypt.compare(password, hashedPassword);
console.log("MATCH:", isMatch); // true
