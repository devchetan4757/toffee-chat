// ES module syntax
import bcrypt from 'bcryptjs';

// Example hashing
const plainPassword = 'chetan4757143';
const saltRounds = 10;

const salt = await bcrypt.genSalt(saltRounds);
const hashedPassword = await bcrypt.hash(plainPassword, salt);

console.log('Hashed password:', hashedPassword);

// Example verification
const isMatch = await bcrypt.compare('mySuperSecretPassword123', hashedPassword);
console.log(isMatch ? 'Password is correct!' : 'Password is incorrect!');
