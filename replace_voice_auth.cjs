const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace('app.post("/voice/start", voiceStartHandler);', 'app.post("/voice/start", authenticateToken, voiceStartHandler);');
code = code.replace('app.post("/api/voice/start", voiceStartHandler);', 'app.post("/api/voice/start", authenticateToken, voiceStartHandler);');
code = code.replace('app.post("/voice/stop", voiceStopHandler);', 'app.post("/voice/stop", authenticateToken, voiceStopHandler);');
code = code.replace('app.post("/api/voice/stop", voiceStopHandler);', 'app.post("/api/voice/stop", authenticateToken, voiceStopHandler);');
code = code.replace('app.post("/voice/upload", upload.single(\'audioFile\'), voiceUploadHandler);', 'app.post("/voice/upload", authenticateToken, upload.single(\'audioFile\'), voiceUploadHandler);');
code = code.replace('app.post("/api/voice/upload", upload.single(\'audioFile\'), voiceUploadHandler);', 'app.post("/api/voice/upload", authenticateToken, upload.single(\'audioFile\'), voiceUploadHandler);');
// Get handlers can be public or authenticated. Let's make them authenticated.
code = code.replace('app.get("/voice/:messageId", voiceGetHandler);', 'app.get("/voice/:messageId", authenticateToken, voiceGetHandler);');
code = code.replace('app.get("/api/voice/:messageId", voiceGetHandler);', 'app.get("/api/voice/:messageId", authenticateToken, voiceGetHandler);');
code = code.replace('app.delete("/voice/:messageId", voiceDeleteHandler);', 'app.delete("/voice/:messageId", authenticateToken, voiceDeleteHandler);');
code = code.replace('app.delete("/api/voice/:messageId", voiceDeleteHandler);', 'app.delete("/api/voice/:messageId", authenticateToken, voiceDeleteHandler);');

fs.writeFileSync('server.ts', code);
