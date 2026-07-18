const fs = require('fs');
let code = fs.readFileSync('src/components/ConnectionsHubView.tsx', 'utf8');
code = code.replace(/type=\{hideDetails \? "password" : "tel"\}/g, 'type={isCurrentUserProfile && hideDetails ? "password" : "text"}');
code = code.replace(/type=\{hideDetails \? "password" : "text"\}/g, 'type={isCurrentUserProfile && hideDetails ? "password" : "text"}');
fs.writeFileSync('src/components/ConnectionsHubView.tsx', code);
