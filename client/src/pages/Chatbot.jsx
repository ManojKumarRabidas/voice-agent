import React, { useState } from "react";
import Layout from "../components/Layout";
import VoiceButton from "../components/VoiceButton";
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const sessionId = (Date.now().toString(36) + Math.random().toString(36).substring(2, 12)).toUpperCase().substring(0, 10);

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hello! How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (msg) => {
    if (!msg.trim()) return;
    setMessages((prev) => [...prev, { type: "user", text: msg }]);
    setInput("");
    setLoading(true); 

    try {
      const res = await fetch(`${VITE_API_BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg,  sessionId: sessionId  }),
      });

      const data = await res.json();
      console.log("Response from server:", data);
      setMessages((prev) => [...prev, { type: "bot", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "⚠️ Sorry, something went wrong." },
      ]);
    }

    setLoading(false);
  };

  const handleSend = () => {
    if (input.trim()) sendMessage(input.trim())
    else alert("Please enter a message.");
  };

return (
  <Layout>
    <div className="flex flex-col h-[80vh] bg-white shadow rounded-lg p-4">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`max-w-[70%] px-4 py-2 rounded-lg ${ msg.type === "bot" ? "bg-blue-100 self-start text-gray-800" : "bg-green-100 self-end text-gray-800 ml-auto"}`}>
            {msg.text}
          </div>
        ))}
        {loading && (<div className="text-gray-500 italic">🤖 Thinking...</div>)}
      </div>

      <div className="flex items-center">
        <input name="input" type="text" value={input} onChange={(e) => setInput(e.target.value)} className="input-field py-2" placeholder="Type your message..."/>
        <button type="submit" onClick={handleSend} className="bg-blue-500 text-white ms-2 px-4 py-2 rounded-r-md hover:bg-blue-600">Send</button>
        <VoiceButton onResult={(text) => sendMessage(text)} />
      </div>
    </div>
  </Layout>
);
};

export default Chatbot;
