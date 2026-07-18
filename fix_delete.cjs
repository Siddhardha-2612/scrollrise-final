const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `  app.post('/api/sales', authenticateToken, async (req: any, res: any) => {`,
  `  app.delete('/api/sales/:id', authenticateToken, async (req: any, res: any) => {
    try {
      await Sale.findOneAndDelete({ _id: req.params.id, username: req.user.username });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.post('/api/sales', authenticateToken, async (req: any, res: any) => {`
);

code = code.replace(
  `  app.post('/api/shopi', authenticateToken, async (req: any, res: any) => {`,
  `  app.delete('/api/shopi/:id', authenticateToken, async (req: any, res: any) => {
    try {
      await Shopi.findOneAndDelete({ _id: req.params.id, username: req.user.username });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.post('/api/shopi', authenticateToken, async (req: any, res: any) => {`
);
fs.writeFileSync('server.ts', code);

let apiCode = fs.readFileSync('src/services/api.ts', 'utf8');
apiCode = apiCode.replace(
  `  createSale: (data: any) => fetch('/api/sales', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(res => res.json()),`,
  `  createSale: (data: any) => fetch('/api/sales', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(res => res.json()),
  deleteSale: (id: string) => fetch(\`/api/sales/\${id}\`, { method: 'DELETE', headers: headers() }).then(res => res.json()),`
);
apiCode = apiCode.replace(
  `  createShopi: (data: any) => fetch('/api/shopi', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(res => res.json()),`,
  `  createShopi: (data: any) => fetch('/api/shopi', { method: 'POST', headers: headers(), body: JSON.stringify(data) }).then(res => res.json()),
  deleteShopi: (id: string) => fetch(\`/api/shopi/\${id}\`, { method: 'DELETE', headers: headers() }).then(res => res.json()),`
);
fs.writeFileSync('src/services/api.ts', apiCode);
