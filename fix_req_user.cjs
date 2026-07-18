const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/app\.get\('\/api\/flashes', authenticateToken, async \(req, res\) => {/g, "app.get('/api/flashes', authenticateToken, async (req: any, res: any) => {");
code = code.replace(/app\.post\('\/api\/flashes', authenticateToken, async \(req, res\) => {/g, "app.post('/api/flashes', authenticateToken, async (req: any, res: any) => {");
code = code.replace(/app\.delete\('\/api\/flashes\/:id', authenticateToken, async \(req, res\) => {/g, "app.delete('/api/flashes/:id', authenticateToken, async (req: any, res: any) => {");
code = code.replace(/app\.get\('\/api\/connections', authenticateToken, async \(req, res\) => {/g, "app.get('/api/connections', authenticateToken, async (req: any, res: any) => {");
code = code.replace(/app\.post\('\/api\/connections\/request', authenticateToken, async \(req, res\) => {/g, "app.post('/api/connections/request', authenticateToken, async (req: any, res: any) => {");
code = code.replace(/app\.get\('\/api\/messages\/:otherUser', authenticateToken, async \(req, res\) => {/g, "app.get('/api/messages/:otherUser', authenticateToken, async (req: any, res: any) => {");
code = code.replace(/app\.post\('\/api\/messages', authenticateToken, async \(req, res\) => {/g, "app.post('/api/messages', authenticateToken, async (req: any, res: any) => {");
code = code.replace(/app\.get\('\/api\/groups', authenticateToken, async \(req, res\) => {/g, "app.get('/api/groups', authenticateToken, async (req: any, res: any) => {");
code = code.replace(/app\.post\('\/api\/groups', authenticateToken, async \(req, res\) => {/g, "app.post('/api/groups', authenticateToken, async (req: any, res: any) => {");
code = code.replace(/app\.get\('\/api\/sales', authenticateToken, async \(req, res\) => {/g, "app.get('/api/sales', authenticateToken, async (req: any, res: any) => {");
code = code.replace(/app\.post\('\/api\/sales', authenticateToken, async \(req, res\) => {/g, "app.post('/api/sales', authenticateToken, async (req: any, res: any) => {");
code = code.replace(/app\.get\('\/api\/shopi', authenticateToken, async \(req, res\) => {/g, "app.get('/api/shopi', authenticateToken, async (req: any, res: any) => {");
code = code.replace(/app\.post\('\/api\/shopi', authenticateToken, async \(req, res\) => {/g, "app.post('/api/shopi', authenticateToken, async (req: any, res: any) => {");
code = code.replace(/app\.get\('\/api\/notifications', authenticateToken, async \(req, res\) => {/g, "app.get('/api/notifications', authenticateToken, async (req: any, res: any) => {");
code = code.replace(/app\.post\('\/api\/reports', authenticateToken, async \(req, res\) => {/g, "app.post('/api/reports', authenticateToken, async (req: any, res: any) => {");

// Also add a basic type extension just in case
code = code.replace(
  `import express from "express";`,
  `import express from "express";\n\ndeclare global {\n  namespace Express {\n    interface Request {\n      user?: any;\n    }\n  }\n}\n`
);

fs.writeFileSync('server.ts', code);
