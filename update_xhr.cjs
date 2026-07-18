const fs = require('fs');

let code = fs.readFileSync('src/services/voiceUploadService.ts', 'utf8');

code = code.replace(
  "xhr.open('POST', '/api/voice/upload');",
  `xhr.open('POST', '/api/voice/upload');
      
      // Inject auth token from localStorage
      const token = localStorage.getItem('booran_token') || sessionStorage.getItem('booran_token');
      if (token) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      }`
);

fs.writeFileSync('src/services/voiceUploadService.ts', code);
