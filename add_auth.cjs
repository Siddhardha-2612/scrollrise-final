const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// Add imports
code = code.replace(
  'import multer from "multer";',
  'import multer from "multer";\nimport jwt from "jsonwebtoken";\nimport bcrypt from "bcryptjs";'
);

// Modify User schema
code = code.replace(
  `// 1. Users Schema
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // In real app, securely hashed
  type: "Customer" | "Vendor";
}

// 2. Pins Schema`,
  `// 1. Users Schema
export interface User {
  id: string;
  username: string; // Used as name
  passwordHash: string; // securely hashed
  secretCode: string; // 8 digit
  mobileNumber: string;
  dob: string;
  hideDetails: boolean;
}

// 2. Pins Schema`
);

// Replace initial users array
code = code.replace(
  `const users: User[] = [
  { id: "u1", name: "John Doe", email: "vendor@test.com", passwordHash: "123", type: "Vendor" },
  { id: "u2", name: "Jane Smith", email: "customer@test.com", passwordHash: "123", type: "Customer" }
];`,
  `const users: User[] = [];
const JWT_SECRET = process.env.JWT_SECRET;`
);

// Add auth routes
const authRoutes = `
  // --- AUTHENTICATION ROUTES ---
  app.post("/api/auth/register", async (req, res) => {
    const { username, password, secretCode, mobileNumber, dob, hideDetails } = req.body;
    
    // Check if user exists
    const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }
    
    // Exact match check
    const exactlySame = users.some(u => 
      u.username === username &&
      u.secretCode === secretCode &&
      u.mobileNumber === mobileNumber &&
      u.dob === dob
    );
    if (exactlySame) {
      return res.status(400).json({ error: "This account already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const newUser = {
      id: "u" + Date.now(),
      username,
      passwordHash,
      secretCode,
      mobileNumber,
      dob,
      hideDetails: !!hideDetails
    };
    
    users.push(newUser);
    
    res.status(201).json({ success: true, username: newUser.username });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    
    const searchKey = username.toLowerCase();
    const user = users.find(u => u.username.toLowerCase() === searchKey);
    
    if (!user) {
      return res.status(404).json({ error: "Account not found. Please create an account from the front page first." });
    }
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password credential. Access denied." });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      success: true, 
      token, 
      user: {
        username: user.username,
        mobileNumber: user.mobileNumber,
        dob: user.dob,
        hideDetails: user.hideDetails
      }
    });
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { username, dob, secretCode, mobileNumber, newPassword } = req.body;
    
    const user = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() &&
      u.dob === dob &&
      u.secretCode === secretCode &&
      u.mobileNumber === mobileNumber
    );
    
    if (!user) {
      return res.status(400).json({ error: "Verification failed. No matching account with those recovery details was found." });
    }
    
    if (newPassword) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      return res.json({ success: true, message: "Password updated successfully." });
    }
    
    res.json({ success: true, message: "Account verified" });
  });

  // JWT Middleware for protected routes
  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // -----------------------------
`;

code = code.replace('// API ROUTES', '// API ROUTES\n' + authRoutes);

// Protect API routes
code = code.replace('app.get("/api/pins", (req, res) => {', 'app.get("/api/pins", authenticateToken, (req, res) => {');
code = code.replace('app.post("/api/pins", (req, res) => {', 'app.post("/api/pins", authenticateToken, (req, res) => {');
code = code.replace('app.put("/api/pins/:id/location", (req, res) => {', 'app.put("/api/pins/:id/location", authenticateToken, (req, res) => {');
code = code.replace('app.post("/api/pins/:id/report", (req, res) => {', 'app.post("/api/pins/:id/report", authenticateToken, (req, res) => {');
code = code.replace('app.post("/api/pins/:id/deactivate", (req, res) => {', 'app.post("/api/pins/:id/deactivate", authenticateToken, (req, res) => {');

// Handle req.user typing since we're using Express and TS, but the server is compiled via tsx so any works, but let's be safe.
// It's mostly untyped in server.ts so it should be fine. We don't have noImplicitAny enabled or if we do it might complain. 
// Let's add an explicit typing for express request if needed. Or just use req: any.
code = code.replace('const authenticateToken = (req, res, next) => {', 'const authenticateToken = (req: any, res: any, next: any) => {');
code = code.replace('app.get("/api/pins", authenticateToken, (req, res) => {', 'app.get("/api/pins", authenticateToken, (req: any, res: any) => {');
code = code.replace('app.post("/api/pins", authenticateToken, (req, res) => {', 'app.post("/api/pins", authenticateToken, (req: any, res: any) => {');
code = code.replace('app.put("/api/pins/:id/location", authenticateToken, (req, res) => {', 'app.put("/api/pins/:id/location", authenticateToken, (req: any, res: any) => {');
code = code.replace('app.post("/api/pins/:id/report", authenticateToken, (req, res) => {', 'app.post("/api/pins/:id/report", authenticateToken, (req: any, res: any) => {');
code = code.replace('app.post("/api/pins/:id/deactivate", authenticateToken, (req, res) => {', 'app.post("/api/pins/:id/deactivate", authenticateToken, (req: any, res: any) => {');


fs.writeFileSync('server.ts', code);
console.log('Done!');
