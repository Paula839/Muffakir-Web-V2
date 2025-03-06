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
import { useUser } from "../context/UserContext";
import ProfileDropdown from "./ProfileDropdown";

type Message = {
  id: string | number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping: boolean;
  isThinking: boolean;
};

type DocumentItem = {
  title: string;
  content: string;
  expanded: boolean;
};

function ChatPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [documents, setDocuments] = useState(false);
  const [documentsData, setDocumentsData] = useState<DocumentItem[]>([]);
  const [panelHovered, setPanelHovered] = useState(false);
  
  const [sessionsVisible, setSessionsVisible] = useState(false);
  const [sessions, setSessions] = useState<Array<{id: string, title: string, timestamp: Date}>>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const { user, setUser } = useUser();

  useEffect(() => {
    const fetchStoredMessages = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/chat/messages", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        });
        if (!response.ok) throw new Error("Failed to fetch messages");
        const data = await response.json();
        const loadedMessages: Message[] = [];
        data.forEach((msg: any) => {
          if (msg.user_message) {
            loadedMessages.push({
              id: msg._id, 
              text: msg.user_message,
              isUser: true,
              timestamp: new Date(msg.timestamp),
              isTyping: false,
              isThinking: false,
            });
          }
          if (msg.bot_message) {
            loadedMessages.push({
              id: msg._id + "_bot",
              text: msg.bot_message,
              isUser: false,
              timestamp: new Date(msg.timestamp),
              isTyping: false,
              isThinking: false,
            });
          }
        });
        setMessages(loadedMessages);
      } catch (error) {
        console.error("Error fetching stored messages:", error);
      }
    };

    if (user) fetchStoredMessages();
  }, [user]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const isNearRightEdge = window.innerWidth - e.clientX < 50;
      const isNearLeftEdge = e.clientX < 50;
      setPanelHovered(
        (isNearRightEdge && documents) || 
        (isNearLeftEdge && sessionsVisible)
      );
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [documents, sessionsVisible]);

  useEffect(() => {
    const savedLang = localStorage.getItem('lang') === 'ar' ? 'ar' : 'en';
    setLang(savedLang);
    document.documentElement.setAttribute('lang', savedLang);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    setIsSending(true);
  
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
        body: JSON.stringify({ message: text, documents: documents }),
      });
  
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const fullText = data.response;
      setDocumentsData(
        data.documents.map((doc: string[]) => ({
          title: doc[0],
          content: doc[1],
          expanded: false
        }))
      );
      
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMessageId ? {
          ...msg,
          isThinking: false,
          isTyping: true,
          text: ''
        } : msg
      ));
  
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
      const fullText = "يوجد مشكلة في السرفر";
      setMessages(prev => prev.map(msg => 
        msg.id === thinkingMessageId ? {
          ...msg,
          isThinking: false,
          isTyping: true,
          text: ''
        } : msg
      ));
  
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
    }
  };

  const handleCancelSending = () => {
    const lastMessage = messages[messages.length - 1];
    const isThinking = lastMessage?.isThinking;
  
    if (typingIntervalRef.current || isThinking) {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      if (isThinking) setMessages(prev => prev.filter(msg => msg.id !== lastMessage.id));
      setIsSending(false);
    }
  };

  const handleLanguageChange = () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
    document.documentElement.setAttribute('lang', newLang);
  };

  const toggleDocument = (index: number) => {
    setDocumentsData(prev => prev.map((doc, i) => 
      i === index ? { ...doc, expanded: !doc.expanded } : doc
    ));
  };

  return (
    <main className="container">
      <ThemeToggle />
      <LanguageToggle lang={lang} onToggle={handleLanguageChange} />
      <ProfileDropdown />

      <button 
        className="sidebar-toggle-button"
        onClick={() => setSessionsVisible(!sessionsVisible)}
        aria-label={sessionsVisible ? translations[lang].closeSidebar : translations[lang].openSidebar}
        style={{
          left: sessionsVisible ? `calc(300px + 1.5rem)` : '1.5rem',
          transform: sessionsVisible ? 'rotate(180deg)' : 'none'
        }}
      >
        {sessionsVisible ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        )}
      </button>

      <div 
        className={`chat-session-sidebar ${sessionsVisible ? 'visible' : ''}`}
        style={{ opacity: panelHovered ? 1 : 0.3 }}
      >
        <div className="session-sidebar-header">
          <h3>{translations[lang].chatSessions}</h3>
          <button 
            className="new-session-button"
            onClick={() => {
              const newSession = {
                id: Date.now().toString(),
                title: translations[lang].newSession,
                timestamp: new Date()
              };
              setSessions(prev => [newSession, ...prev]);
              setSelectedSession(newSession.id);
            }}
            aria-label={translations[lang].newChat}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>
        <ul className="session-list">
          {sessions.map(session => (
            <li 
              key={session.id}
              className={`session-item ${selectedSession === session.id ? 'active' : ''}`}
              onClick={() => setSelectedSession(session.id)}
            >
              <div className="session-info">
                <div className="session-title">{session.title}</div>
                <div className="session-time">
                  {session.timestamp.toLocaleDateString()}
                </div>
              </div>
              <button 
                className="delete-session-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSessions(prev => prev.filter(s => s.id !== session.id));
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

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
            <ButtonHandler 
              lang={lang} 
              isSending={isSending} 
              onCancel={handleCancelSending} 
              documents={documents}
              onDocumentsToggle={() => setDocuments(!documents)}
            />
          </form>
        </div>
      </div>

      <div 
        className={`documents-panel ${documents ? 'visible' : ''}`}
        style={{ opacity: panelHovered ? 1 : 0.3 }}
      >
        <h3>{translations[lang].documents}</h3>
        <div className="documents-list">
          {documentsData.map((doc, index) => (
            <div 
              key={index} 
              className={`document-item ${doc.expanded ? 'expanded' : ''}`}
              onClick={() => toggleDocument(index)}
            >
              <div className="document-header">
                <h4>{doc.title}</h4>
                <span className="toggle-icon">
                  {doc.expanded ? '▲' : '▼'}
                </span>
              </div>
              {doc.expanded && (
                <div className="document-content">
                  {doc.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default ChatPage;