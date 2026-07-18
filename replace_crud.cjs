const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const crudRoutes = `
  // --- CRUD APIs ---
  
  // Flashes
  app.get('/api/flashes', authenticateToken, async (req, res) => {
    try {
      const flashes = await Flash.find().sort({ createdAt: -1 });
      res.json(flashes);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.post('/api/flashes', authenticateToken, async (req, res) => {
    try {
      const flash = new Flash({ ...req.body, userId: req.user.id, username: req.user.username });
      await flash.save();
      res.json(flash);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.delete('/api/flashes/:id', authenticateToken, async (req, res) => {
    try {
      await Flash.findOneAndDelete({ _id: req.params.id, username: req.user.username });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Connections
  app.get('/api/connections', authenticateToken, async (req, res) => {
    try {
      const connections = await Connection.find({ $or: [{ user1: req.user.username }, { user2: req.user.username }] });
      res.json(connections);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  
  app.post('/api/connections/request', authenticateToken, async (req, res) => {
    try {
      const { toUser } = req.body;
      const request = new ConnectionRequest({ fromUser: req.user.username, toUser });
      await request.save();
      res.json(request);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Messages
  app.get('/api/messages/:otherUser', authenticateToken, async (req, res) => {
    try {
      const messages = await Message.find({
        $or: [
          { senderUsername: req.user.username, receiverUsername: req.params.otherUser },
          { senderUsername: req.params.otherUser, receiverUsername: req.user.username }
        ]
      }).sort({ createdAt: 1 });
      res.json(messages);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
      const msg = new Message({ ...req.body, senderUsername: req.user.username });
      await msg.save();
      res.json(msg);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Groups
  app.get('/api/groups', authenticateToken, async (req, res) => {
    try {
      const groups = await Group.find({ members: req.user.username });
      res.json(groups);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.post('/api/groups', authenticateToken, async (req, res) => {
    try {
      const group = new Group({ ...req.body, createdBy: req.user.username, members: [...req.body.members, req.user.username] });
      await group.save();
      res.json(group);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Sales
  app.get('/api/sales', authenticateToken, async (req, res) => {
    try {
      const sales = await Sale.find().sort({ createdAt: -1 });
      res.json(sales);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.post('/api/sales', authenticateToken, async (req, res) => {
    try {
      // Limit 3 per day logic would go here
      const today = new Date();
      today.setHours(0,0,0,0);
      const count = await Sale.countDocuments({ username: req.user.username, createdAt: { $gte: today } });
      if (count >= 3) return res.status(400).json({ error: "Daily limit reached" });
      
      const sale = new Sale({ ...req.body, username: req.user.username });
      await sale.save();
      res.json(sale);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // Shopi
  app.get('/api/shopi', authenticateToken, async (req, res) => {
    try {
      const items = await Shopi.find().sort({ createdAt: -1 });
      res.json(items);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  app.post('/api/shopi', authenticateToken, async (req, res) => {
    try {
      // Limit 10 items total
      const count = await Shopi.countDocuments({ username: req.user.username });
      if (count >= 10) return res.status(400).json({ error: "Limit of 10 items reached" });
      
      const item = new Shopi({ ...req.body, username: req.user.username });
      await item.save();
      res.json(item);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  
  // Notifications
  app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
      const notifs = await Notification.find({ username: req.user.username }).sort({ createdAt: -1 });
      res.json(notifs);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
  
  // Reports
  app.post('/api/reports', authenticateToken, async (req, res) => {
    try {
      const report = new Report({ ...req.body, reportedBy: req.user.username });
      await report.save();
      res.json(report);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // -----------------------------
`;

code = code.replace('  // -----------------------------', crudRoutes);

fs.writeFileSync('server.ts', code);
console.log('Modified server.ts with CRUD routes');
