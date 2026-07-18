const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git') {
        walkDir(dirPath, callback);
      }
    } else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
      callback(dirPath);
    }
  });
}

walkDir('src', (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace ConnectionsHubView fallbacks
  if (filePath.endsWith('ConnectionsHubView.tsx')) {
    content = content.replace(/return \[\s*{\s*id: 'con_1', name: 'Alpha Echo'[^\]]*\];/, 'return [];');
    content = content.replace(/const displayConnectsList = isCurrentUserProfile\s*\?\s*connectsList\s*:\s*\[\s*{\s*id: 'con_o1', name: 'Alpha Echo', requested: true\s*},\s*\];/, 'const displayConnectsList = isCurrentUserProfile ? connectsList : [];');
  }

  // Replace ChannelFeedDashboard fallbacks
  if (filePath.endsWith('ChannelFeedDashboard.tsx')) {
    content = content.replace(/return \[\s*{\s*id: "con_1",\s*name: "Alpha Echo"[^\]]*\];/g, 'return [];');
    content = content.replace(/setChannelsList\(\[\s*{\s*id: "con_1",\s*name: "Alpha Echo"[\s\S]*?\}\s*\]\);/, 'setChannelsList([]);');
    content = content.replace(/setConnectionsList\(\[\s*{\s*id: "conn_1",\s*name: "Zack Holmes"[\s\S]*?\}\s*\]\);/, 'setConnectionsList([]);');
  }

  // Replace NotificationsView fallbacks
  if (filePath.endsWith('NotificationsView.tsx')) {
    content = content.replace(/return \[\s*{\s*id: 'con_1', name: 'Alpha Echo'[\s\S]*?\];/, 'return [];');
  }
  
  // Replace ReelsView fallbacks
  if (filePath.endsWith('ReelsView.tsx')) {
    content = content.replace(/const connectsNames = \['Alpha Echo', 'Booran Prime', 'Shopi Patron'\];/, 'const connectsNames: string[] = [];');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Modified', filePath);
  }
});
