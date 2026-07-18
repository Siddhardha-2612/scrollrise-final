const fs = require('fs');
const http = require('http');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const CRLF = '\r\n';

const postData = [
  '--' + boundary,
  'Content-Disposition: form-data; name="messageId"',
  '',
  'test1',
  '--' + boundary,
  'Content-Disposition: form-data; name="audioFile"; filename="package.json"',
  'Content-Type: application/json',
  '',
  fs.readFileSync('package.json', 'utf8'),
  '--' + boundary + '--',
  ''
].join(CRLF);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/voice/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    console.log("Response:", data);
  });
});

req.write(postData);
req.end();
