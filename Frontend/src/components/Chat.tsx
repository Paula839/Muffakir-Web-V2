'use client';

import ThemeToggle from "./ThemeToggle";
import ButtonHandler from "./ButtonHandler";
import LanguageToggle from "./LanguageToggle";
import translations from "../translations/translations";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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

// Updated document types to handle resources
type DocumentItem = {
  type: string;
  title: string;
  content?: string;
  links?: ResourceLink[];
  expanded: boolean;

  url?: string;
  description?: string;
  thumbnail?: string;
};

type ResourceLink = {
  title: string;
  url: string;
};

type Session = {
  id: string;
  title: string;
  created_at: Date;
  last_updated: Date;
  message_count: number;
};

function ChatPage() {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [documents, setDocuments] = useState(false);
  const [search, setSearch] = useState(false);
  const [documentsData, setDocumentsData] = useState<DocumentItem[]>([]);
  const [panelHovered, setPanelHovered] = useState(false);
  const [youtubeSearch, setYoutubeSearch] = useState(false);
  const [summary, setSummary] = useState(false);
  const [upload, setUpload] = useState(false);


  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);


  

  const [sessionsVisible, setSessionsVisible] = useState(true);

  const { user, setUser } = useUser();

  const [activeButton, setActiveButton] = useState<'search' | 'documents' | 'quiz' | 'youtube' | 'summary' | 'upload' | 'none'>('none');
  const handleButtonToggle = (button: 'search' | 'documents' | 'quiz' | 'youtube' | 'summary' | 'upload' | 'none') => {
    setActiveButton(button);
    
    setDocuments(false);
    setSearch(false);
    setYoutubeSearch(false);
    setSummary(false);
    setUpload(false);

    switch (button) {
        case 'search':
          setDocuments(true);
          setSearch(true);
          break;
        case 'documents':
          setDocuments(true);
          break;
        case 'quiz':
          // Quiz doesn't need panel
          break;
        case 'youtube':
          setDocuments(true); // Show panel for YouTube results
          setYoutubeSearch(true);
          break;
        // case 'summary':
        //   // setDocuments(true); // Show panel for summary
        //   setSummary(true);
        //   break;
        case 'upload':
          setDocuments(true); // Show panel for upload results
          setUpload(true);
          break;
        default:
          // All states already reset
          break;
      }
  };

  const [quiz, setQuiz] = useState(false);


   useEffect(() => {
          const fetchUser = async () => {
            try {
              const response = await fetch("http://localhost:8000/api/user/me", {
                credentials: "include",
              });
              if (response.ok) {
                const data = await response.json();
                setUser(data);
              }
            } catch (error: any) {
              if (error.message && error.message !== "Failed to fetch") {
                console.error("Error fetching user data:", error);
              }
            }
          };
          fetchUser();
        }, [setUser]);
  
      useEffect(() => {
          if (user) {
              localStorage.setItem("user", JSON.stringify(user));
          } else {
              localStorage.removeItem("user");
          }
      }, [user]);
  
      

  // Set initial visibility based on authentication status
  useEffect(() => {
    setSessionsVisible(!!user);
  }, []); // Empty dependency array = only run on mount
  
  // Update visibility when authentication status changes
  useEffect(() => {
    if (user) {
      setSessionsVisible(true); // Open sidebar when user logs in
    } else {
      setSessionsVisible(false); // Close sidebar when user logs out
    }
  }, [user]); // Runs when user changes

  // For logged in users, fetch sessions from the API.
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/chat/sessions", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        });
        if (!response.ok) throw new Error("Failed to fetch sessions");
        const data = await response.json();
        setSessions(
          data.map((session: any) => ({
            id: session.session_id,
            title: session.title,
            created_at: new Date(session.created_at),
            last_updated: new Date(session.last_updated),
            message_count: session.message_count
          }))
        );
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };

    if (user) fetchSessions();
  }, [user]);

  // For logged in users, fetch messages for a selected session.
  useEffect(() => {
    if (!selectedSession || !user) return;
    
    const fetchSessionMessages = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/chat/sessions/${selectedSession}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        });
        if (!response.ok) throw new Error("Failed to fetch messages");
        const data = await response.json();

        const loadedMessages: Message[] = [];
        data.messages.forEach((msg: any) => {
          loadedMessages.push({
            id: msg.timestamp + "_user",
            text: msg.user_message,
            isUser: true,
            timestamp: new Date(msg.timestamp),
            isTyping: false,
            isThinking: false,
          });
          loadedMessages.push({
            id: msg.timestamp + "_bot",
            text: msg.bot_message,
            isUser: false,
            timestamp: new Date(msg.timestamp),
            isTyping: false,
            isThinking: false,
          });
        });

        setMessages(loadedMessages);
      } catch (error) {
        console.error("Error fetching session messages:", error);
      }
    };

    fetchSessionMessages();
  }, [selectedSession, user]);

  // Create a new session.
  // If the user is logged in, a session is created in the database.
  // For guests, a temporary session is stored locally.
  const createNewSession = async () => {
    if (user) {
      try {
        const response = await fetch("http://localhost:8000/api/chat/sessions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        });
        if (!response.ok) throw new Error("Failed to create session");
        const data = await response.json();
        setSessions(prev => [
          {
            id: data.session_id,
            title: data.title,
            created_at: new Date(),
            last_updated: new Date(),
            message_count: 0
          },
          ...prev
        ]);
        setSelectedSession(data.session_id);
        setMessages([]);
      } catch (error) {
        console.error("Error creating session:", error);
      }
    } else {
      // Guest mode: create a temporary session locally.
      const newSessionId = Date.now().toString();
      const newSession: Session = {
        id: newSessionId,
        title: "Guest Chat",
        created_at: new Date(),
        last_updated: new Date(),
        message_count: 0,
      };
      setSessions(prev => [newSession, ...prev]);
      setSelectedSession(newSessionId);
      setMessages([]);
    }
  };

  // Delete a session.
  // For logged in users, the session is removed from the database.
  // For guests, the session is simply removed from local state.
  const deleteSession = async (sessionId: string) => {
    if (user) {
      try {
        const response = await fetch(`http://localhost:8000/api/chat/sessions/${sessionId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to delete session");
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (selectedSession === sessionId) {
          setSelectedSession(null);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error deleting session:", error);
      }
    } else {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (selectedSession === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
    }
  };

// Inside ChatPage function
const handleSubmit = async (e: React.FormEvent) => {
  if(isSending) {
    return;
  }
  e.preventDefault();
  const text = inputText.trim();
  if (!text) return;
  setIsSending(true);

  let currentSessionId = selectedSession;

  if (user) {
    // Logged in user
    if (!currentSessionId) {
      try {
        const response = await fetch("http://localhost:8000/api/chat/sessions", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Failed to create session");
        const data = await response.json();
        currentSessionId = data.session_id;
        setSelectedSession(currentSessionId);
        setSessions(prev => [
          {
            id: data.session_id,
            title: data.title,
            created_at: new Date(),
            last_updated: new Date(),
            message_count: 0,
          },
          ...prev,
        ]);
      } catch (error) {
        console.error("Error creating session:", error);
        setIsSending(false);
        return;
      }
    }

    // Add user message optimistically
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

    // Add thinking indicator
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
      const response = await fetch("http://localhost:8000/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: text,
          documents: documents,
          search: search,
          quiz: activeButton === 'quiz',
          youtubeSearch: activeButton === 'youtube',
          summary: activeButton === 'summary',
          upload: activeButton === 'upload',
          session_id: currentSessionId,
        }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();

      // Process documents data
      const processedDocs: DocumentItem[] = [];
      if (data.documents && Array.isArray(data.documents)) {
        data.documents.forEach((doc: any) => {
          if (doc.type === "resources" && doc.links) {
            processedDocs.push({
              type: "resources",
              title: doc.title || "Resources",
              links: doc.links,
              expanded: false,
            });
          } else if (doc.type === "document") {
            processedDocs.push({
              type: "document",
              title: doc.title || "Document",
              content: doc.content || "",
              expanded: false,
            });
          } else if (doc.type === "quiz") {
            processedDocs.push({
              type: "quiz",
              title: doc.title || "Quiz",
              content: doc.content || "",
              expanded: false,
            });
          } else if (doc.url && doc.thumbnail && doc.description) {
            processedDocs.push({
              type: "youtube",
              title: doc.title || "YouTube Video",
              url: doc.url,
              thumbnail: doc.thumbnail,
              description: doc.description,
              expanded: false,
            });
          }
        });
      }
      setDocumentsData(processedDocs);


      // Handle quiz redirection
      if (activeButton === 'quiz') {
        if (data.quiz_data && data.quiz_data.questions?.length > 0) {
          localStorage.setItem('quizData', JSON.stringify(data.quiz_data));
          window.location.href = '/test';
        } else {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now(),
              text: translations[lang].quizGenerationFailed,
              isUser: false,
              timestamp: new Date(),
              isTyping: false,
              isThinking: false,
            },
          ]);
        }
        setIsSending(false);
        return;
      }

      // Update messages with bot response
      setMessages(prev =>
        prev.map(msg =>
          msg.id === thinkingMessageId
            ? {
                ...msg,
                isThinking: false,
                isTyping: true,
                text: '',
              }
            : msg
        )
      );

      // Typewriter effect
      let index = 0;
      const fullText = data.response;
      const baseSpeed = 150;
      const speedFactor = Math.max(1, Math.log(fullText.length));
      const typingSpeed = baseSpeed / speedFactor;

      typingIntervalRef.current = setInterval(() => {
        setMessages(prev =>
          prev.map(msg => {
            if (msg.id === thinkingMessageId) {
              const newText = fullText.substring(0, index + 1);
              return {
                ...msg,
                text: newText,
                isTyping: index + 1 < fullText.length,
              };
            }
            return msg;
          })
        );
        index++;
        if (index >= fullText.length) {
          clearInterval(typingIntervalRef.current!);
          typingIntervalRef.current = null;
          setIsSending(false);
        }
      }, typingSpeed);

      // Refresh sessions list
      const sessionsResponse = await fetch("http://localhost:8000/api/chat/sessions", {
        method: "GET",
        credentials: "include",
      });
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(
          sessionsData.map((session: any) => ({
            id: session.session_id,
            title: session.title,
            created_at: new Date(session.created_at),
            last_updated: new Date(session.last_updated),
            message_count: session.message_count,
          }))
        );
      }
    } catch (error) {
      console.error("Error", error);
      setMessages(prev =>
        prev.filter(msg => msg.id !== userMessage.id && msg.id !== thinkingMessageId)
      );
      const fullText = "يوجد مشكلة في السرفر";
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          text: fullText,
          isUser: false,
          timestamp: new Date(),
          isTyping: false,
          isThinking: false,
        },
      ]);
      setIsSending(false);
    }
  } else {
    // Guest mode
    if (!currentSessionId) {
      const newSessionId = Date.now().toString();
      currentSessionId = newSessionId;
      setSelectedSession(newSessionId);
      setSessions(prev => [
        {
          id: newSessionId,
          title: "Guest Chat",
          created_at: new Date(),
          last_updated: new Date(),
          message_count: 0,
        },
        ...prev,
      ]);
    }

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

    setSessions(prevSessions =>
      prevSessions.map(session => {
        if (session.id === currentSessionId && session.title === "Guest Chat") {
          const newTitle = text.length > 20 ? text.substring(0, 20) + "..." : text;
          return { ...session, title: newTitle, message_count: session.message_count + 1 };
        } else if (session.id === currentSessionId) {
          return { ...session, message_count: session.message_count + 1 };
        }
        return session;
      })
    );

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
      const response = await fetch("http://localhost:8000/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify({
          message: text,
          documents: documents,
          search: search,
          quiz: activeButton === 'quiz',
          youtubeSearch: activeButton === 'youtube',
          summary: activeButton === 'summary',
          upload: activeButton === 'upload',
          session_id: currentSessionId,
        }),
      });
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();

      const processedDocs: DocumentItem[] = [];
      if (data.documents && Array.isArray(data.documents)) {
        data.documents.forEach((doc: any) => {
          if (doc.type === "resources" && doc.links) {
            processedDocs.push({
              type: "resources",
              title: doc.title || "Resources",
              links: doc.links,
              expanded: false,
            });
          } else if (doc.type === "document") {
            processedDocs.push({
              type: "document",
              title: doc.title || "Document",
              content: doc.content || "",
              expanded: false,
            });
          } else if (doc.type === "quiz") {
            processedDocs.push({
              type: "quiz",
              title: doc.title || "Quiz",
              content: doc.content || "",
              expanded: false,
            });
          } else if (doc.url && doc.thumbnail && doc.description) {
            processedDocs.push({
              type: "youtube",
              title: doc.title || "YouTube Video",
              url: doc.url,
              thumbnail: doc.thumbnail,
              description: doc.description,
              expanded: false,
            });
          }
        });
      }
      setDocumentsData(processedDocs);


      // Handle quiz redirection
      if (activeButton === 'quiz' && data.quiz_data) {
        localStorage.setItem('quizData', JSON.stringify(data.quiz_data));
        window.location.href = '/test';
        setIsSending(false);
        return;
      }

      // Update messages with bot response
      setMessages(prev =>
        prev.map(msg =>
          msg.id === thinkingMessageId
            ? {
                ...msg,
                isThinking: false,
                isTyping: true,
                text: '',
              }
            : msg
        )
      );

      // Typewriter effect
      let index = 0;
      const fullText = data.response;
      const baseSpeed = 150;
      const speedFactor = Math.max(1, Math.log(fullText.length));
      const typingSpeed = baseSpeed / speedFactor;

      typingIntervalRef.current = setInterval(() => {
        setMessages(prev =>
          prev.map(msg => {
            if (msg.id === thinkingMessageId) {
              const newText = fullText.substring(0, index + 1);
              return {
                ...msg,
                text: newText,
                isTyping: index + 1 < fullText.length,
              };
            }
            return msg;
          })
        );
        index++;
        if (index >= fullText.length) {
          clearInterval(typingIntervalRef.current!);
          typingIntervalRef.current = null;
          setIsSending(false);
        }
      }, typingSpeed);
    } catch (error) {
      console.error("Error", error);
      setMessages(prev =>
        prev.filter(msg => msg.id !== userMessage.id && msg.id !== thinkingMessageId)
      );
      const fullText = "يوجد مشكلة في السرفر";
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          text: fullText,
          isUser: false,
          timestamp: new Date(),
          isTyping: false,
          isThinking: false,
        },
      ]);
      setIsSending(false);
    }
  }
};

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
    setDocumentsData(prev =>
      prev.map((doc, i) =>
        i === index ? { ...doc, expanded: !doc.expanded } : doc
      )
    );
  };

  // Function to handle external link clicks
  const handleResourceLinkClick = (url: string) => {
    // You can add additional validation or tracking here if needed
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        300 // Maximum height in pixels
      )}px`;
    }
  };

  useEffect(() => {
    autoResizeTextarea();
  }, [inputText]);

  return (
    <main className="container">
      <ThemeToggle />
      <LanguageToggle lang={lang} onToggle={handleLanguageChange} />
      <ProfileDropdown lang={lang}/>

      <button 
        className="sidebar-toggle-button"
        onClick={() => user && setSessionsVisible(!sessionsVisible)}
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
            onClick={createNewSession}
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
                  {new Date(session.last_updated).toLocaleDateString()}
                </div>
              </div>
              <button 
                className="delete-session-button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
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
              ref={textareaRef}
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
              search={search}
              quiz={quiz}
              youtubeSearch={youtubeSearch}
              summary={summary}
              upload={upload}
              activeButton={activeButton}
              onButtonToggle={handleButtonToggle}
            />
          </form>
        </div>
      </div>

      <div
  className={`documents-panel ${documents ? 'visible' : ''}`}
  style={{ opacity: panelHovered ? 1 : 0.3 }}
  data-mode={activeButton}
>
  <h3>
    {activeButton === 'search'
      ? translations[lang].searchResults
      : activeButton === 'quiz'
      ? translations[lang].quiz
      : activeButton === 'youtube'
      ? translations[lang].youtubeResults
      : activeButton === 'summary'
      ? translations[lang].summaryResults
      : activeButton === 'upload'
      ? translations[lang].uploadResults
      : translations[lang].documents}
  </h3>
  <div className="documents-list">
    {documentsData.map((doc, index) => (
      <div
        key={index}
        className={`document-item ${doc.expanded ? 'expanded' : ''}`}
        onClick={() => toggleDocument(index)}
        data-type={doc.type}
      >
        <div className="document-header">
          <h4>{doc.title}</h4>
          <span className="toggle-icon">{doc.expanded ? '▲' : '▼'}</span>
        </div>
{doc.expanded && (
  <div className="document-content">
    {doc.type === "resources" && doc.links ? (
      <ul className="resource-links-list">
        {doc.links.map((link, linkIndex) => (
          <li key={linkIndex} className="resource-link-item">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="resource-link"
              onClick={(e) => {
                e.stopPropagation();
                handleResourceLinkClick(link.url);
              }}
            >
              {link.title}
            </a>
          </li>
        ))}
      </ul>
    ) : doc.type === "youtube" && doc.url ? (
      <div className="youtube-video">
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          <img src={doc.thumbnail} alt={doc.title} className="youtube-thumbnail" />
          <p className="youtube-description">{doc.description}</p>
        </a>
      </div>
    ) : (
      doc.content
    )}
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