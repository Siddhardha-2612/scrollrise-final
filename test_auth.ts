import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from './src/db/models';

async function run() {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    const reqBody = {
        username: 'testuser',
        password: 'password123',
        secretCode: '1234',
        mobileNumber: '1234567890',
        dob: '2000-01-01',
        hideDetails: false
    };

    // REGISTER
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(reqBody.password, salt);
    const newUser = new User({ ...reqBody, passwordHash });
    await newUser.save();
    console.log("Registered!");

    // LOGIN
    const user = await User.findOne({ username: { $regex: new RegExp("^" + reqBody.username + "$", "i") } });
    if (!user) return console.log("Not found");
    
    console.log("USER DOC:", user.toObject());
    console.log("Input pw:", reqBody.password);
    console.log("Hash:", user.passwordHash);

    const isMatch = await bcrypt.compare(reqBody.password, user.passwordHash);
    console.log("Match?", isMatch);

    process.exit(0);
}
run();
