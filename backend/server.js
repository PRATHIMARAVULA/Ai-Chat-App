import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { fileURLToPath } from "url";

// ===== Load Environment Variables =====
dotenv.config();

// ===== Setup Express App =====
const app = express();
app.use(cors());
app.use(express.json());

// ===== OpenAI Configuration =====
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===== Port Configuration =====
const PORT = process.env.PORT || 5000;

// ===== File Paths =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "chat.json");

// ===== Initialize chat.json if missing =====
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// ===== Chat History Utilities =====
const loadChatHistory = () => {
  try {
    const data = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading chat history:", err);
    return [];
  }
};

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

  const chatHistory = loadChatHistory();
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
    return res.json({ chatHistory });
  } catch (err) {
    console.error("OpenAI Error:", err);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
});

// GET: Retrieve full chat history
app.get("/api/history", (req, res) => {
  const history = loadChatHistory();
  res.json(history);
});

// ===== Serve React Frontend =====
const FRONTEND_BUILD_PATH = path.join(__dirname, "front", "build");
app.use(express.static(FRONTEND_BUILD_PATH));

app.get("*", (req, res) => {
  res.sendFile(path.join(FRONTEND_BUILD_PATH, "index.html"));
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
