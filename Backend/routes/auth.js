import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
        return res.status(400).json({ error: "All fields are required" });

    try {
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: "Email already registered" });

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashed });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: "Registration failed" });
    }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "All fields are required" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid email or password" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: "Invalid email or password" });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

export default router;
