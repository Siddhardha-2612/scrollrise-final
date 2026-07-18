const { connectDB } = require('./src/db/mongoose');
const { User } = require('./src/db/models');
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/booran').catch(() => console.log('no local'));
  const users = await User.find();
  console.log("USERS:", users);
  process.exit(0);
}
test();
