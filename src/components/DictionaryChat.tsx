import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, User, Bot, Trash2, Plus, History, MessageSquare, X, Copy, Check } from 'lucide-react';
import { createDictionaryChat } from '../services/gemini';
import { cn } from '../lib/utils';
import CustomMarkdown from './CustomMarkdown';
import remarkBreaks from 'remark-breaks';
import { motion, AnimatePresence } from 'motion/react';
import { saveChatSession, getChatSessions, getChatSession, deleteChatSession } from '../services/db';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface DictionaryChatProps {
  rules?: string;
  glossary?: any[];
}

interface ChatSessionItem {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export default function DictionaryChat({ rules, glossary }: DictionaryChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Chat Sessions States
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const saved = localStorage.getItem('active_chat_session_id');
    return saved || crypto.randomUUID();
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 1500);
  };

  // Handle initialization and page refreshes / session resume
  useEffect(() => {
    const initDatabaseSessions = async () => {
      try {
        const list = await getChatSessions();
        const sorted = [...list].sort((a, b) => b.timestamp - a.timestamp);
        setSessions(sorted);

        const lastActiveId = localStorage.getItem('active_chat_session_id');
        if (lastActiveId) {
          const found = sorted.find(s => s.id === lastActiveId);
          if (found) {
            setCurrentSessionId(found.id);
            setMessages(found.messages);
            chatRef.current = createDictionaryChat(rules, glossary, found.messages);
            return;
          }
        }

        // Default: If history contains sessions, load the most recent one (automatic page refresh resume!)
        if (sorted.length > 0) {
          const mostRecent = sorted[0];
          setCurrentSessionId(mostRecent.id);
          setMessages(mostRecent.messages);
          chatRef.current = createDictionaryChat(rules, glossary, mostRecent.messages);
          localStorage.setItem('active_chat_session_id', mostRecent.id);
        } else {
          // Empty state
          const newId = crypto.randomUUID();
          setCurrentSessionId(newId);
          setMessages([]);
          chatRef.current = createDictionaryChat(rules, glossary, []);
          localStorage.setItem('active_chat_session_id', newId);
        }
      } catch (err) {
        console.error("Failed to load local chat sessions:", err);
      }
    };
    initDatabaseSessions();
  }, []);

  // Update Gemini interface when context/rules or glossary glossary changes
  useEffect(() => {
    chatRef.current = createDictionaryChat(rules, glossary, messages);
  }, [rules, glossary]);

  // Handle messages scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleNewChat = () => {
    const newId = crypto.randomUUID();
    setCurrentSessionId(newId);
    setMessages([]);
    chatRef.current = createDictionaryChat(rules, glossary, []);
    localStorage.setItem('active_chat_session_id', newId);
    
    // Auto collapse sidebar on smaller touchscreens (< 768px)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleSelectSession = async (id: string) => {
    try {
      const session = await getChatSession(id);
      if (session) {
        setCurrentSessionId(session.id);
        setMessages(session.messages);
        chatRef.current = createDictionaryChat(rules, glossary, session.messages);
        localStorage.setItem('active_chat_session_id', session.id);

        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          setIsSidebarOpen(false);
        }
      }
    } catch (err) {
      console.error("Error activating chat session:", err);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteChatSession(id);
      const list = await getChatSessions();
      const sorted = [...list].sort((a, b) => b.timestamp - a.timestamp);
      setSessions(sorted);

      if (id === currentSessionId) {
        if (sorted.length > 0) {
          handleSelectSession(sorted[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const newMessages: Message[] = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    // Save active chat instantly (auto-saving on user input)
    let sessionTitle = sessions.find(s => s.id === currentSessionId)?.title;
    if (!sessionTitle || sessionTitle === "Game Localization Chat") {
      sessionTitle = userMessage.slice(0, 25) + (userMessage.length > 25 ? '...' : '');
    }

    const currentSession = {
      id: currentSessionId,
      title: sessionTitle,
      messages: newMessages,
      timestamp: Date.now()
    };

    try {
      await saveChatSession(currentSession);
      const list = await getChatSessions();
      setSessions([...list].sort((a, b) => b.timestamp - a.timestamp));

      if (!chatRef.current) {
        chatRef.current = createDictionaryChat(rules, glossary, messages);
      }

      const response = await chatRef.current.sendMessage({ message: userMessage });
      const aiResponse = response.text || '';

      const finalMessages: Message[] = [...newMessages, { role: 'model', text: aiResponse }];
      setMessages(finalMessages);

      const finalSession = {
        id: currentSessionId,
        title: sessionTitle,
        messages: finalMessages,
        timestamp: Date.now()
      };
      await saveChatSession(finalSession);

      const updatedList = await getChatSessions();
      setSessions([...updatedList].sort((a, b) => b.timestamp - a.timestamp));
    } catch (error: any) {
      console.error("Chat error:", error);

      let errorMessage = "Sorry, I encountered an error. Please try again.";
      if (error && error.code === 429) {
        errorMessage = "I have reached my daily limit for requests. Please try again later.";
      }

      const finalMessages: Message[] = [...newMessages, { role: 'model', text: errorMessage }];
      setMessages(finalMessages);

      const finalSession = {
        id: currentSessionId,
        title: sessionTitle,
        messages: finalMessages,
        timestamp: Date.now()
      };
      await saveChatSession(finalSession);

      const updatedList = await getChatSessions();
      setSessions([...updatedList].sort((a, b) => b.timestamp - a.timestamp));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await deleteChatSession(currentSessionId);
      const list = await getChatSessions();
      setSessions([...list].sort((a, b) => b.timestamp - a.timestamp));
      handleNewChat();
    } catch (err) {
      console.error("Failed to clear current chat:", err);
      // Fallback local clear
      setMessages([]);
      chatRef.current = createDictionaryChat(rules, glossary, []);
    }
  };

  const applySuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="flex bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm overflow-hidden h-[650px] md:h-[calc(100vh-180px)] min-h-[500px] max-h-[850px] relative md:flex-row flex-row-reverse">
      
      {/* 1. Main chat layout (DOM FIRST CHILD - for focused CSS selectors stability) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Chat Header (DOM FIRST CHILD of Main Chat - matches selector div:nth-of-type(1) > div:nth-of-type(1) precisely) */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 relative z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle button (History Icon) */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                title="Hiện lịch sử trò chuyện (Show history)"
              >
                <History size={18} />
              </button>
            )}
            
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 italic flex items-center gap-1.5 leading-none text-[20px]">
                eBot
              </h3>
              <p className="text-[9px] text-slate-400 mt-1">Hỏi về văn cảnh hội thoại, dịch thuật & từ vựng JP&lt;&gt;VN</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick New Chat button in main header */}
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all font-medium font-sans cursor-pointer"
              title="New Chat"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        {/* Chat Messages Panel */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-white dark:bg-slate-800"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-5 text-slate-400 py-4 max-w-lg mx-auto">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-full">
                <Bot size={40} className="opacity-25 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nhập từ vựng, hội thoại game Nhật Bản hoặc kịch bản thiết kế để hỗ trợ dịch thuật</h4>
                <p className="text-[11px] text-slate-400">Ask about meanings, tone of voice, character hierarchy, or specific terminology rules.</p>
              </div>

              {/* Suggested JP/VN Localization starters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-4 text-left">
                <button
                  onClick={() => applySuggestedPrompt("Dịch giúp kịch bản hội thoại nhân vật kiêu ngạo (Arrogant character dialogue) sang tiếng Việt")}
                  className="p-3 text-xs border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-900 bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all text-slate-600 dark:text-slate-300 font-medium"
                >
                  <p className="font-semibold text-blue-600 dark:text-blue-400 mb-0.5">Lời thoại nhân vật (Dialogue)</p>
                  Dịch lời thoại nhân vật kiêu ngạo tự phụ (Arrogant character).
                </button>
                <button
                  onClick={() => applySuggestedPrompt("Phân tích cách dịch từ chuyên ngành 'Buff / Debuff / RNG / Gacha' trong Anime Game sao cho tự nhiên")}
                  className="p-3 text-xs border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-900 bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all text-slate-600 dark:text-slate-300 font-medium"
                >
                  <p className="font-semibold text-blue-600 dark:text-blue-400 mb-0.5">Thuật ngữ Game (Game Jargon)</p>
                  Cách dịch thuật ngữ 'Gacha', 'RNG', 'Buff' tự nhiên.
                </button>
                <button
                  onClick={() => applySuggestedPrompt("Viết một mô tả kỹ năng tối thượng (Ultimate Skill Description) cực phong cách anime học đường")}
                  className="p-3 text-xs border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-900 bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all text-slate-600 dark:text-slate-300 font-medium"
                >
                  <p className="font-semibold text-blue-600 dark:text-blue-400 mb-0.5">Kỹ năng nhân vật (Ultimate Skill)</p>
                  Viết mô tả kỹ năng tối thượng cực ngầu.
                </button>
                <button
                  onClick={() => applySuggestedPrompt("Giúp dịch chính xác thông số UI 'ATK / DEF / HP' và các hiệu ứng đi kèm trong Game")}
                  className="p-3 text-xs border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-900 bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all text-slate-600 dark:text-slate-300 font-medium"
                >
                  <p className="font-semibold text-blue-600 dark:text-blue-400 mb-0.5">Thông số UI (UI/UX Stats)</p>
                  Dịch các chỉ số ATK, DEF, HP và hiệu ứng game.
                </button>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isCopied = copiedIndex === idx;
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={idx}
                className={cn(
                  "flex gap-3 group relative",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === 'user' ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                )}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="relative max-w-[80%] flex items-start gap-1">
                  <div className={cn(
                    "rounded-2xl px-5 py-3 text-sm shadow-sm w-full",
                    msg.role === 'user' 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none"
                  )}>
                    <div className="w-full break-words">
                      <CustomMarkdown isUser={msg.role === 'user'} remarkPlugins={[remarkBreaks]}>{msg.text}</CustomMarkdown>
                    </div>
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopyMessage(msg.text, idx)}
                    className={cn(
                      "absolute bottom-2 p-1.5 rounded-lg border backdrop-blur-sm transition-all duration-200 cursor-pointer shadow-sm md:opacity-0 md:group-hover:opacity-100 opacity-100 z-10",
                      msg.role === 'user'
                        ? "right-full mr-2 bg-blue-700/80 hover:bg-blue-800 border-blue-500/30 text-white"
                        : "left-full ml-2 bg-white/85 hover:bg-slate-50 border-slate-205 text-slate-500 dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-400"
                    )}
                    title="Copy message"
                  >
                    {isCopied ? <Check size={13} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </motion.div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                <Loader2 size={16} className="animate-spin text-blue-600" />
              </div>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-end gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <textarea 
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Hỏi về dịch thuật, viết kịch bản, thuật ngữ nhân vật... (Ask the assistant...)"
              className="flex-1 bg-transparent px-2 py-1 text-sm leading-tight outline-none text-slate-800 dark:text-slate-100 resize-none max-h-32 overflow-y-auto"
              style={{ height: 'auto', minHeight: '1.5rem' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-all shadow-md shadow-blue-200 dark:shadow-none shrink-0 cursor-pointer"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 px-1">
            Nhấn <span className="font-semibold">Enter</span> để gửi thông điệp, <span className="font-semibold">Shift + Enter</span> hoặc <span className="font-semibold">Ctrl + Enter</span> để xuống dòng mới.
          </p>
        </div>
      </div>

      {/* 2. Chat history sidebar (DOM SECOND CHILD - order-first visual representation) */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="md:relative absolute left-0 top-0 h-full w-[280px] bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col z-20 shadow-xl md:shadow-none order-first"
          >
            {/* Sidebar Header */}
            <div className="h-[70px] px-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-100/50 dark:bg-slate-950/20 shrink-0">
              <span className="font-semibold text-sm uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-sans">
                <History size={14} className="text-slate-500" />
                History
              </span>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-400 cursor-pointer"
                title="Đóng thanh lịch sử"
              >
                <X size={16} />
              </button>
            </div>

            {/* "+ New Chat" Action container inside history */}
            <div className="p-3 shrink-0">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={16} />
                New Chat
              </button>
            </div>

            {/* List of saved conversations */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 scrollbar-thin">
              {sessions.length === 0 ? (
                <div className="text-center py-12 px-4 text-slate-400 dark:text-slate-500 text-xs italic">
                  Chưa có cuộc hội thoại nào trước đó. Các cuộc gọi bị ngắt hoặc nhấp Trò chuyện mới sẽ hiển thị tại đây.
                </div>
              ) : (
                sessions.map((session) => {
                  const isActive = session.id === currentSessionId;
                  return (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border text-left",
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400"
                          : "hover:bg-slate-200/50 dark:hover:bg-slate-800/40 border-transparent text-slate-600 dark:text-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                        <MessageSquare size={14} className={isActive ? "text-blue-500 shrink-0" : "text-slate-400 shrink-0"} />
                        <span className="text-xs font-medium truncate leading-tight flex-1">
                          {session.title || "Game Localization Chat"}
                        </span>
                      </div>
                      
                      <button
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 rounded-lg transition-all ml-1 shrink-0 cursor-pointer"
                        title="Xóa phiên trò chuyện này (Delete)"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
