import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, User, Bot, Trash2 } from 'lucide-react';
import { createDictionaryChat } from '../services/gemini';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface DictionaryChatProps {
  rules?: string;
  glossary?: any[];
}

export default function DictionaryChat({ rules, glossary }: DictionaryChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current = createDictionaryChat(rules, glossary);
  }, [rules, glossary]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    // Reset height of textarea
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.style.height = 'auto';
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', text: response.text || '' }]);
    } catch (error: any) {
      console.error("Chat error:", error);
      
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      if (error && error.code === 429) {
        errorMessage = "I have reached my daily limit for requests. Please try again later.";
      }
      
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    chatRef.current = createDictionaryChat(rules);
  };

  return (
    <div className={cn(
      "flex flex-col bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm overflow-hidden transition-all duration-500 ease-in-out",
      messages.length === 0 ? "h-auto" : "h-[600px]"
    )}>
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 italic">eBot</h3>
            <p className="text-[10px] text-slate-400">Ask about meanings, grammar, or context</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={clearChat}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
            title="Clear chat"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Chat Messages */}
      <div 
        ref={scrollRef}
        className={cn(
          "overflow-y-auto p-6 space-y-6 scroll-smooth transition-all duration-500",
          messages.length === 0 ? "min-h-[200px]" : "flex-1"
        )}
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-slate-400 py-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-full">
              <Bot size={40} className="opacity-20" />
            </div>
            <div className="max-w-xs">
              <p className="text-sm italic font-medium text-slate-500 dark:text-slate-400">Chào! Mình có thể giúp bạn dịch thuật, viết câu hoặc giải đáp thắc mắc.</p>
              <p className="text-[10px] mt-2">Ví dụ: "Dịch giúp mình câu chào mừng người chơi" hoặc "Viết một câu thoại tự phụ cho nhân vật phản diện".</p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx}
            className={cn(
              "flex gap-3",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" : "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
            )}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
              msg.role === 'user' 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none"
            )}>
            <div className={cn(
              "markdown-body prose prose-sm dark:prose-invert max-w-none prose-p:leading-tight prose-p:my-0 break-words",
              msg.role === 'user' ? "prose-p:text-white" : ""
            )}>
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>{msg.text}</ReactMarkdown>
            </div>
            </div>
          </motion.div>
        ))}

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

      {/* Chat Input */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-end gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
          <textarea 
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask a question..."
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
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-all shadow-md shadow-blue-200 dark:shadow-none shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 px-1">
          Press <span className="font-medium">Enter</span> to send, <span className="font-medium">Shift + Enter</span> or <span className="font-medium">Ctrl + Enter</span> for new line.
        </p>
      </div>
    </div>
  );
}
