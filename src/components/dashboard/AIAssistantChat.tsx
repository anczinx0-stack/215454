import React, { useState, useEffect, useRef } from "react";
import { IoMdSend } from "react-icons/io";
import { RiRobot2Line } from "react-icons/ri";
import { MdFiberManualRecord } from "react-icons/md";
import chatbotLogo from "./chatbotLogo.png";
import userAvatar from "./userAvatar.jpeg";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  // Scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start initial message when chat opens
  const handleChatToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages([
          {
            sender: "bot",
            text: "Hello! How can I assist you today?",
          },
        ]);
        setIsTyping(false);
      }, 800);
    }
  };

  // *** YOUR Q&A DATA — DO NOT CHANGE ***
  const questionnaire = [
    {
      question: "How do I apply for temporary employee screening?",
      answer: "To apply for temporary employee screening, please follow the steps listed on your MyDashboard portal."
    },
    {
      question: "What documents are needed for temporary employee screening?",
      answer: "You will need a valid ID, address proof, and employment request letter."
    },
    {
      question: "How long does the temporary employee screening process take?",
      answer: "The screening process usually takes 3 to 5 working days."
    },
    {
      question: "What is the main contract screen?",
      answer: "The main contract screen displays your submitted contract details and verification status."
    },
    {
      question: "What is the ODF 365 website?",
      answer: "ODF 365 is an online portal used for document verification and employee management."
    }
  ];

  // --- Simple Fuzzy Similarity ---
  function similarity(a, b) {
    a = a.toLowerCase().trim();
    b = b.toLowerCase().trim();

    const aWords = a.split(" ");
    const bWords = b.split(" ");

    let matches = 0;
    aWords.forEach((w) => {
      if (bWords.includes(w)) matches++;
    });

    return matches / Math.max(aWords.length, bWords.length);
  }

  // --- The NEW Smart Logic ---
  function getAIResponse(userText) {
    const cleaned = userText.toLowerCase().trim();

    let bestMatch = null;
    let bestScore = 0;

    for (let item of questionnaire) {
      const score = similarity(cleaned, item.question);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    if (bestScore >= 0.2) {
      return bestMatch.answer;
    }

    return "I'm not completely sure what you mean. Could you please rephrase?";
  }

  // Handle user message
  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg = {
      sender: "user",
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    const reply = getAIResponse(userMsg.text);

    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
      setIsTyping(false);
    }, 900);
  };

  // Trigger send on Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="fixed bottom-5 right-5">
      {/* Floating Chatbot Button */}
      {!isOpen && (
        <button
          onClick={handleChatToggle}
          className="bg-blue-600 text-white p-3 rounded-full shadow-xl hover:bg-blue-700 transition"
        >
          <RiRobot2Line size={28} />
        </button>
      )}

      {/* Chatbox */}
      {isOpen && (
        <div className="w-80 h-96 bg-white rounded-xl shadow-lg flex flex-col overflow-hidden">

          {/* Header */}
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <img src={chatbotLogo} alt="bot" className="w-7 h-7 rounded-full" />
              Support Bot
            </h3>
            <button onClick={handleChatToggle}>✖</button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] p-2 rounded-lg ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing animation */}
            {isTyping && (
              <div className="flex items-center gap-1 text-gray-500">
                <MdFiberManualRecord className="animate-bounce" />
                <MdFiberManualRecord className="animate-bounce delay-200" />
                <MdFiberManualRecord className="animate-bounce delay-400" />
              </div>
            )}

            <div ref={messagesEndRef}></div>
          </div>

          {/* Input */}
          <div className="p-3 border-t flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask something..."
              className="flex-1 px-3 py-2 border rounded-lg"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={handleSend} className="bg-blue-600 text-white p-2 rounded-lg">
              <IoMdSend size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
