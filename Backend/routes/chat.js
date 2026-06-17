import express from "express";
import Thread from "../models/Thread.js";
import getOpenAIAPIResponse from "../utils/openai.js";
import Groq from "groq-sdk";
import "dotenv/config";
import authMiddleware from "../middleware/auth.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const router = express.Router();

// all routes protected
router.use(authMiddleware);

router.get("/thread", async (req, res) => {
    try {
        const threads = await Thread.find({ userId: req.userId }).sort({ updatedAt: -1 });
        res.json(threads);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch threads" });
    }
});

router.get("/thread/:threadId", async (req, res) => {
    try {
        const thread = await Thread.findOne({ threadId: req.params.threadId, userId: req.userId });
        if (!thread) return res.status(404).json({ error: "Thread not found" });
        res.json(thread.messages);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch chat" });
    }
});

router.patch("/thread/:threadId/rename", async (req, res) => {
    try {
        await Thread.findOneAndUpdate({ threadId: req.params.threadId, userId: req.userId }, { title: req.body.title });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to rename" });
    }
});

router.delete("/thread/:threadId", async (req, res) => {
    try {
        const deleted = await Thread.findOneAndDelete({ threadId: req.params.threadId, userId: req.userId });
        if (!deleted) return res.status(404).json({ error: "Thread not found" });
        res.json({ success: "Thread deleted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete thread" });
    }
});

router.post("/chat/stream", async (req, res) => {
    const { threadId, message, model } = req.body;
    if (!threadId || !message) return res.status(400).json({ error: "Missing required fields" });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
        let thread = await Thread.findOne({ threadId, userId: req.userId });
        if (!thread) {
            thread = new Thread({
                threadId, userId: req.userId,
                title: message.slice(0, 50),
                messages: [{ role: "user", content: message }]
            });
        } else {
            thread.messages.push({ role: "user", content: message });
        }

        const stream = await groq.chat.completions.create({
            model: model || "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: message }],
            stream: true,
        });

        let fullReply = "";
        for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || "";
            fullReply += token;
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
        }

        thread.messages.push({ role: "assistant", content: fullReply });
        thread.updatedAt = new Date();
        await thread.save();

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
    } catch (err) {
        console.log(err);
        res.write(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`);
        res.end();
    }
});

export default router;
