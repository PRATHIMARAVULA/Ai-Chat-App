import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { fileURLToPath } from "url";

// Load .env
dotenv.config();

// Setup Express
const app = express();
app.use(cors());
app.use(express.json());

// OpenAI Config
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Port
const PORT = process.env.PORT || 5000;

// File Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "chat.json");

// Create chat.json if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Load/Save Utilities
const loadChatHistory = () => {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (err) {
    console.error("Chat load error:", err);
    return [];
  }
};

const saveChatHistory = (history) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error("Chat save error:", err);
  }
};

// ===== API ROUTES =====

// POST: CHAT MESSAGE
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message?.trim();
  if (!userMessage) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  const chatHistory = loadChatHistory();
  chatHistory.push({ sender: "user", text: userMessage });

  try {
    const aiReply = await openai.chat.completions.create({
      model: "gpt-4o-mini",   // ⭐ IMPORTANT LINE
      messages: chatHistory.map((m) => ({
        role: m.sender === "ai" ? "assistant" : "user",
        content: m.text,
      })),
    });

    const aiText = aiReply.choices[0].message.content;
    chatHistory.push({ sender: "ai", text: aiText });
    saveChatHistory(chatHistory);

    return res.json({ chatHistory });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return res.status(500).json({ error: "AI response failed" });
  }
});

// GET: HISTORY
app.get("/api/history", (req, res) => {
  res.json(loadChatHistory());
});

// ===== SERVE REACT FRONTEND =====
const FRONTEND_BUILD_PATH = path.join(__dirname, "../frontend/build");

app.use(express.static(FRONTEND_BUILD_PATH));

app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_BUILD_PATH, "index.html"));
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
