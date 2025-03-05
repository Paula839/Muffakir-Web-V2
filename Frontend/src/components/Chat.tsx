'use client';

import ThemeToggle from "./ThemeToggle";
import ButtonHandler from "./ButtonHandler";
import LanguageToggle from "./LanguageToggle";
import translations from "../translations/translations";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import UserProfile from "./UserProfile";
import { PiStudentBold } from "react-icons/pi";
import React from "react";

type Message = {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping: boolean;
  isThinking: boolean;
};

function ChatPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') === 'ar' ? 'ar' : 'en';
    setLang(savedLang);
    document.documentElement.setAttribute('lang', savedLang);
  }, []);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    setIsSending(true);
  
    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: text,
      isUser: true,
      timestamp: new Date(),
      isTyping: false,
      isThinking: false,
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
  
    // Add thinking message
    const thinkingMessageId = Date.now() + 1;
    const thinkingMessage: Message = {
      id: thinkingMessageId,
      text: '',
      isUser: false,
      timestamp: new Date(),
      isTyping: false,
      isThinking: true,
    };
    setMessages(prev => [...prev, thinkingMessage]);
  
    try {
      const response = await fetch("http://localhost:8000/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
  
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const fullText = data.response;
  
      // Convert thinking message to typing message
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMessageId ? {
          ...msg,
          isThinking: false,
          isTyping: true,
          text: ''
        } : msg
      ));
  
      // Start typing effect
      let index = 0;
      const baseSpeed = 150;
      const speedFactor = Math.max(1, Math.log(fullText.length));
      const typingSpeed = baseSpeed / speedFactor;
  
      typingIntervalRef.current = setInterval(() => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === thinkingMessageId) {
            const newText = fullText.substring(0, index + 1);
            return {
              ...msg,
              text: newText,
              isTyping: index + 1 < fullText.length,
            };
          }
          return msg;
        }));
        index++;
        if (index >= fullText.length) {
          clearInterval(typingIntervalRef.current!);
          typingIntervalRef.current = null;
          setIsSending(false);
        }
      }, typingSpeed);
  
    } catch (error) {
      console.error("Error", error);
      const fullText = "يوجد مشكلة في السرفر"
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMessageId ? {
          ...msg,
          isThinking: false,
          isTyping: true,
          text: ''
        } : msg
      ));
  
      // Start typing effect
      let index = 0;
      const baseSpeed = 150;
      const speedFactor = Math.max(1, Math.log(fullText.length));
      const typingSpeed = baseSpeed / speedFactor;
  
      typingIntervalRef.current = setInterval(() => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === thinkingMessageId) {
            const newText = fullText.substring(0, index + 1);
            return {
              ...msg,
              text: newText,
              isTyping: index + 1 < fullText.length,
            };
          }
          return msg;
        }));
        index++;
        if (index >= fullText.length) {
          clearInterval(typingIntervalRef.current!);
          typingIntervalRef.current = null;
          setIsSending(false);
        }
      }, typingSpeed);

      // setMessages(prev => prev.filter(msg => msg.id !== thinkingMessageId));
      // setIsSending(false);
    }
  };
  // Cancel the AI response typing without deleting the message
  const handleCancelSending = () => {
    const lastMessage = messages[messages.length - 1];
    const isThinking = lastMessage?.isThinking;
  
    if (typingIntervalRef.current || isThinking) {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      if (isThinking) {
        setMessages(prev => prev.filter(msg => msg.id !== lastMessage.id));
      }
      setIsSending(false);
    }
  };

  const handleLanguageChange = () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    document.documentElement.setAttribute('lang', newLang);
  };




  return (
    <main className="container">
      <ThemeToggle />
      <LanguageToggle lang={lang} onToggle={handleLanguageChange} />
      <UserProfile guest={translations[lang].guest} />

      <div className="chat-container">
        <Link href="/" className="title-link">
          <h1 className="title">{translations[lang].welcome}</h1>
        </Link>
        <div className="chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.isUser ? 'user-message' : 'assistant-message'}`}
            >
              {!message.isUser && (
                <div className="bot-icon-container">
                  <PiStudentBold size={32} />
                </div>
              )}
            <div className="message-content">
              {message.isThinking ? (
                <div className="spinner"></div>
              ) : (
                <>
                  {message.text}
                  {message.isTyping && (
                    <span className="typing-indicator">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  )}
                </>
              )}
            </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-container">
          <form className="chat-form" onSubmit={handleSubmit}>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleSubmit(e);
                }
              }}
              placeholder={translations[lang].typeMessage}
              className="chat-input"
            />
            {/* Pass the isSending state and cancel handler */}
            <ButtonHandler lang={lang} isSending={isSending} onCancel={handleCancelSending} />
          </form>
        </div>
      </div>
    </main>
  );
}

export default ChatPage;