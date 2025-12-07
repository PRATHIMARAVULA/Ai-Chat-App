import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        "https://ai-chat-app-xhhl.onrender.com/api/history"
      );
      setChatHistory(res.data);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      const res = await axios.post(
        "https://ai-chat-app-xhhl.onrender.com/api/chat",
        { message }
      );

      setChatHistory(res.data.chatHistory);
      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Error sending message. Check backend or API key/quota.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="App">
      <h1>AI Chat App</h1>
      <div className="chat-container">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={
              msg.sender === "user"
                ? "chat-message user"
                : "chat-message ai"
            }
          >
            <b>{msg.sender === "user" ? "You:" : "AI:"}</b> {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default App;
