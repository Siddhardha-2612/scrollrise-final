import http from "http";
import fs from "fs";
import FormData from "form-data";

const form = new FormData();
form.append("messageId", "test1");
form.append("audioFile", fs.createReadStream("package.json"));

const req = http.request({
  hostname: "localhost",
  port: 3000,
  path: "/api/voice/upload",
  method: "POST",
  headers: form.getHeaders()
}, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    console.log("Response:", data);
  });
});

form.pipe(req);
