const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { User } = require('./src/db/models');

const app = express();
app.use(bodyParser.json());

app.post("/api/auth/register", async (req, res) => {
    const { username, password, secretCode, mobileNumber, dob, hideDetails } = req.body;
    const existingUser = await User.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
    if (existingUser) return res.status(400).json({ error: "Username already exists" });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const newUser = new User({ username, passwordHash, secretCode, mobileNumber, dob, hideDetails: !!hideDetails });
    await newUser.save();
    res.status(201).json({ success: true, username: newUser.username });
});

app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
    if (!user) return res.status(404).json({ error: "Account not found." });
    
    // Debug output to see what user object has
    console.log("USER DOC:", user.toObject());
    console.log("Input pw:", password);
    console.log("Hash:", user.passwordHash);

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Incorrect password credential. Access denied." });
    res.json({ success: true });
});

async function run() {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    
    console.log("Registering user...");
    const regRes = await request(app).post('/api/auth/register').send({
        username: 'testuser',
        password: 'password123',
        secretCode: '1234',
        mobileNumber: '1234567890',
        dob: '2000-01-01'
    });
    console.log("Register response:", regRes.status, regRes.body);

    console.log("Logging in user...");
    const loginRes = await request(app).post('/api/auth/login').send({
        username: 'testuser',
        password: 'password123'
    });
    console.log("Login response:", loginRes.status, loginRes.body);
    
    process.exit(0);
}
run();
