import express from "express";
import cors from "cors";
import fs from "fs";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===== PORT =====
const PORT = process.env.PORT || 5000;

// ===== Chat History Setup =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "chat.json");

// Initialize chat.json if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Load chat history
const loadChatHistory = () => {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading chat history:", err);
    return [];
  }
};

// Save chat history
const saveChatHistory = (history) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error("Error saving chat history:", err);
  }
};

// ===== API Routes =====

// POST: User sends message
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message?.trim();
  if (!userMessage) {
    return res.status(400).json({ error: "Message cannot be empty" });
  }

  let chatHistory = loadChatHistory();
  chatHistory.push({ sender: "user", text: userMessage });
  console.log("User:", userMessage);

  try {
    const aiReply = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatHistory.map((m) => ({
        role: m.sender === "ai" ? "assistant" : "user",
        content: m.text,
      })),
    });

    const aiText = aiReply.choices[0].message.content;
    chatHistory.push({ sender: "ai", text: aiText });
    saveChatHistory(chatHistory);

    console.log("AI:", aiText);

    // Return full chat history (assessment-friendly)
    return res.json({ chatHistory });
  } catch (error) {
    console.error("OpenAI Error:", error);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
});

// GET: Full chat history
app.get("/api/history", (req, res) => {
  const history = loadChatHistory();
  res.json(history);
});

// ===== Serve React Frontend =====
app.use(express.static(path.join(__dirname, "front", "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "front", "build", "index.html"));
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
