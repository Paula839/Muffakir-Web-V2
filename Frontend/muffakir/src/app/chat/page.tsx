'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaRobot } from 'react-icons/fa';
import Link from 'next/link';

interface Message {
  id: number;
  content: string;
  isUser: boolean;
}

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, content: 'Hello! How can I help you today?', isUser: false }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message
    const newMessage: Message = {
      id: messages.length + 1,
      content: inputMessage,
      isUser: true
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        content: 'This is a simulated response. In a real app, you would integrate an API here!',
        isUser: false
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
      className="chat-container"
    >
      <div className="chat-header">
        <Link href="/" className="back-button">
          ← Back
        </Link>
        <h1>Muffakir AI</h1>
        <FaRobot className="bot-icon" />
      </div>

      <div className="messages-container">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`message ${message.isUser ? 'user' : 'bot'}`}
          >
            <div className="message-content">
              {message.content}
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-container">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your message..."
          className="chat-input"
        />
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          type="submit"
          className="send-button"
        >
          <FaPaperPlane />
        </motion.button>
      </form>
    </motion.div>
  );
}

export default ChatPage;