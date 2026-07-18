const fs = require('fs');

async function test() {
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const CRLF = '\r\n';
  
  const postData = [
    '--' + boundary,
    'Content-Disposition: form-data; name="audioFile"; filename="test.webm"',
    'Content-Type: audio/webm',
    '',
    fs.readFileSync('package.json', 'utf8'),
    '--' + boundary,
    'Content-Disposition: form-data; name="messageId"',
    '',
    'vm_1782747526742_56',
    '--' + boundary + '--',
    ''
  ].join(CRLF);

  const res = await fetch("http://localhost:3000/api/voice/upload", {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`
    },
    body: postData
  });

  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("TEXT:", text);
}

test();
