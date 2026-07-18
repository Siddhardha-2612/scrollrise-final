const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importsToAdd = `import { connectDB } from "./src/db/mongoose";
import { User, Flash, ConnectionRequest, Connection, Message, Group, Sale, Shopi, Pin, Notification, Report } from "./src/db/models";
`;

code = code.replace(
  'import bcrypt from "bcryptjs";',
  'import bcrypt from "bcryptjs";\n' + importsToAdd
);

// We need to call connectDB() inside startServer or directly
// Currently, server.ts might have `const app = express();` at the top level or in a function.
code = code.replace(
  'const app = express();',
  'connectDB();\nconst app = express();'
);

// Now rewrite the auth routes to use Mongoose
code = code.replace(
  `    const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());`,
  `    const existingUser = await User.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });`
);

code = code.replace(
  `    const exactlySame = users.some(u => 
      u.username === username &&
      u.secretCode === secretCode &&
      u.mobileNumber === mobileNumber &&
      u.dob === dob
    );`,
  `    const exactlySame = await User.findOne({ username, secretCode, mobileNumber, dob });`
);

code = code.replace(
  `    const newUser = {
      id: "u" + Date.now(),
      username,
      passwordHash,
      secretCode,
      mobileNumber,
      dob,
      hideDetails: !!hideDetails
    };
    
    users.push(newUser);`,
  `    const newUser = new User({
      username,
      passwordHash,
      secretCode,
      mobileNumber,
      dob,
      hideDetails: !!hideDetails
    });
    
    await newUser.save();`
);

code = code.replace(
  `    const searchKey = username.toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === searchKey);`,
  `    const user = await User.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });`
);

code = code.replace(
  `    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });`,
  `    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });`
);

code = code.replace(
  `    const user = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() &&
      u.dob === dob &&
      u.secretCode === secretCode &&
      u.mobileNumber === mobileNumber
    );`,
  `    const user = await User.findOne({ 
      username: { $regex: new RegExp("^" + username + "$", "i") },
      dob,
      secretCode,
      mobileNumber
    });`
);

code = code.replace(
  `      user.passwordHash = await bcrypt.hash(newPassword, salt);
      return res.json({ success: true, message: "Password updated successfully." });`,
  `      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();
      return res.json({ success: true, message: "Password updated successfully." });`
);

fs.writeFileSync('server.ts', code);
console.log('Modified server.ts');
