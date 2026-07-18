const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
  `  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
    
    if (!user) {
      return res.status(404).json({ error: "Account not found. Please create an account from the front page first." });
    }
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password credential. Access denied." });
    }`,
  `  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
    
    if (!user) {
      return res.status(404).json({ error: "Account not found. Please create an account from the front page first." });
    }
    
    let isMatch = false;
    // Check if the stored hash is actually a bcrypt hash or an old plaintext password
    if (user.passwordHash && (user.passwordHash.startsWith("$2a$") || user.passwordHash.startsWith("$2b$"))) {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } else {
      isMatch = (password === user.passwordHash);
      if (isMatch) {
        // Auto-upgrade the password to bcrypt
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);
        await user.save();
      }
    }
    
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password credential. Access denied." });
    }`
);
fs.writeFileSync('server.ts', code);
console.log('Fixed server.ts');
