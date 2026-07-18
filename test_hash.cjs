const bcrypt = require('bcryptjs');
async function test() {
  const pw = 'testpass';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(pw, salt);
  const match = await bcrypt.compare(pw, hash);
  console.log("MATCH:", match);
}
test();
