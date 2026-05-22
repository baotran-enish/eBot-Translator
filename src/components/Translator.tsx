import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeftRight, 
  Copy, 
  Trash2, 
  Volume2, 
  Mic, 
  MicOff, 
  History as HistoryIcon,
  Languages,
  Check,
  ChevronDown,
  Info,
  Type,
  FileText,
  Settings2,
  Settings,
  BookOpen,
  Book,
  Download,
  Upload,
  Sun,
  Moon,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateText, detectLanguage, GlossaryItem } from '../services/gemini';
import { saveToHistory, getHistory, deleteFromHistory, clearHistory, getSetting, saveSetting, getGlossary, updateGlossary } from '../services/db';
import { cn } from '../lib/utils';
import CustomMarkdown from './CustomMarkdown';
import DocumentTranslator from './DocumentTranslator';
import DictionaryChat from './DictionaryChat';
import GlossaryManager from './GlossaryManager';

type Language = 'ja' | 'vi';
type Mode = 'text' | 'document' | 'dictionary';

interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}

interface TranslatorProps {
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  onOpenSettings: () => void;
}

export default function Translator({ isDark, setIsDark, onOpenSettings }: TranslatorProps) {
  const [mode, setMode] = useState<Mode>('text');
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState<Language>('ja');
  const [targetLang, setTargetLang] = useState<Language>('vi');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  
  const [rules, setRules] = useState("- Translate for Game Company Product (Japan Anime Game)\n- Write down the English translations of specialized terms.");
  const [showRules, setShowRules] = useState(false);
  const [showRulesInstructions, setShowRulesInstructions] = useState(false);
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [showGlossary, setShowGlossary] = useState(false);
  const rulesFileInputRef = useRef<HTMLInputElement>(null);

  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadHistory();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    let savedRules = await getSetting('translation_rules');
    let savedGlossary = await getGlossary();

    const isFirstRun = localStorage.getItem('ebot_initialized') !== 'true';

    if (isFirstRun) {
      try {
        const rulesRes = await fetch('/api/skill/rules');
        if (rulesRes.ok) {
          const rulesData = await rulesRes.json();
          if (rulesData.content) {
            await saveSetting('translation_rules', rulesData.content);
            savedRules = rulesData.content;
          }
        }
      } catch (e) {
        console.error('Failed to fetch predefined rules:', e);
      }

      try {
        const glossaryRes = await fetch('/api/skill/glossary');
        if (glossaryRes.ok) {
          const glossaryData = await glossaryRes.json();
          if (glossaryData.content) {
            const lines = glossaryData.content.split(/\r?\n/);
            const parsedTerms: any[] = [];
            lines.forEach((line: string) => {
              if (!line.trim()) return;
              const parts = line.split('|').map(p => p.trim());
              if (parts.length >= 2 && parts[0] && parts[1]) {
                parsedTerms.push({
                  term: parts[0],
                  translation: parts[1],
                  note: parts[2] || ''
                });
              }
            });
            if (parsedTerms.length > 0) {
              await updateGlossary(parsedTerms);
              savedGlossary = await getGlossary();
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch predefined glossary:', e);
      }

      localStorage.setItem('ebot_initialized', 'true');
    }

    if (savedRules) {
      setRules(savedRules);
    }
    if (savedGlossary && savedGlossary.length > 0) {
      setGlossary(savedGlossary.map(d => ({ term: d.term, translation: d.translation, note: d.note })));
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      saveSetting('translation_rules', rules);
    }, 1000);
    return () => clearTimeout(timer);
  }, [rules]);

  const handleDownloadRules = () => {
    const blob = new Blob([rules], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'translation_rules.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadRules = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRules(content);
      }
    };
    reader.readAsText(file);
    if (rulesFileInputRef.current) rulesFileInputRef.current.value = '';
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && mode === 'text') {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(192, textareaRef.current.scrollHeight)}px`;
    }
  }, [sourceText, mode]);

  const loadHistory = async () => {
    const data = await getHistory();
    setHistory(data.reverse());
  };

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    try {
      const result = await translateText(sourceText, sourceLang, targetLang, rules, glossary);
      setTranslatedText(result);
      await saveToHistory({
        sourceText,
        translatedText: result,
        sourceLang,
        targetLang
      });
      loadHistory();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSourceText('');
    setTranslatedText('');
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText.split('---')[0].trim());
    setTranslatedText('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speak = (text: string, lang: string) => {
    // Cancel any current speech
    window.speechSynthesis.cancel();
    
    // Clean text: remove markdown artifacts if any
    const cleanText = text.split('---')[0]
      .replace(/[*_#`~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
      .trim();
      
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLangCode = lang === 'ja' ? 'ja-JP' : 'vi-VN';
    utterance.lang = targetLangCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    const findVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      
      // Specifically for Vietnamese, search for common identifiers
      if (lang === 'vi') {
        const viVoice = voices.find(v => 
          v.lang.toLowerCase().replace('_', '-') === 'vi-vn' || 
          v.lang.toLowerCase() === 'vi' ||
          v.name.toLowerCase().includes('vietnam') ||
          v.name.toLowerCase().includes('tiếng việt') ||
          v.name.toLowerCase().includes('vi-vn')
        );
        if (viVoice) return viVoice;
      }

      // Priority 1: Exact match for country code
      let voice = voices.find(v => v.lang === targetLangCode);
      
      // Priority 2: Match by prefix (e.g., 'vi')
      if (!voice) {
        voice = voices.find(v => v.lang.startsWith(lang));
      }
      
      // Priority 3: Case-insensitive search in name or lang
      if (!voice) {
        const searchStr = lang === 'ja' ? 'japan' : 'viet';
        voice = voices.find(v => 
          v.name.toLowerCase().includes(searchStr) || 
          v.lang.toLowerCase().includes(lang.toLowerCase())
        );
      }
      
      return voice;
    };

    const voice = findVoice();
    if (voice) {
      utterance.voice = voice;
    }

    // Handle asynchronous voice loading if needed
    if (window.speechSynthesis.getVoices().length === 0) {
      const handler = () => {
        const v = findVoice();
        if (v) utterance.voice = v;
        window.speechSynthesis.speak(utterance);
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler);
    } else {
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition not supported in this browser.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = sourceLang === 'ja' ? 'ja-JP' : 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSourceText(transcript);
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 mt-[-35px]">
      {/* Header Area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Languages size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">eBot Trainslator</h1>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowGlossary(!showGlossary)}
            className={cn(
              "p-2 rounded-full transition-colors",
              showGlossary ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
            )}
            title="Glossary / Specialized Terms"
          >
            <Book size={20} />
          </button>
          <button 
            onClick={() => setShowRules(!showRules)}
            className={cn(
              "p-2 rounded-full transition-colors",
              showRules ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
            )}
            title="Translation Rules"
          >
            <Settings2 size={20} />
          </button>
          <button 
            onClick={onOpenSettings}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showRules && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-green-50 dark:bg-slate-800/80 border border-green-100 dark:border-slate-700 rounded-2xl mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-semibold text-green-800 dark:text-green-400">Translation Rules & Context</label>
                  <button 
                    onClick={() => setShowRulesInstructions(!showRulesInstructions)}
                    className="p-1 rounded-full text-green-400 hover:text-green-600 transition-colors"
                  >
                    <HelpCircle size={14} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={rulesFileInputRef} 
                    onChange={handleUploadRules} 
                    accept=".txt" 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => rulesFileInputRef.current?.click()}
                    className="p-1 rounded-lg text-green-600 hover:bg-green-100 dark:hover:bg-slate-700 transition-colors"
                    title="Upload rules (.txt)"
                  >
                    <Upload size={16} />
                  </button>
                  <button 
                    onClick={handleDownloadRules}
                    className="p-1 rounded-lg text-green-600 hover:bg-green-100 dark:hover:bg-slate-700 transition-colors"
                    title="Download rules (.txt)"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {showRulesInstructions && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-3"
                  >
                    <div className="p-3 text-xs bg-white/50 dark:bg-slate-900/50 rounded-xl border border-green-100 dark:border-slate-700 text-green-700 dark:text-green-300 space-y-3">
                      <p className="font-semibold text-green-900 dark:text-green-200">How to write effective rules:</p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li><strong>Tone:</strong> "Dùng văn phong trang trọng" or "Ngôn ngữ thân mật, gần gũi".</li>
                        <li><strong>Audience:</strong> "Dịch cho trẻ em, dùng từ ngữ đơn giản".</li>
                        <li><strong>Style:</strong> "Dịch theo phong cách kiếm hiệp" or "Sử dụng từ Hán-Việt".</li>
                        <li><strong>Constraints:</strong> "Không dịch các tên riêng" or "Giữ nguyên định dạng mã code".</li>
                      </ul>
                      
                      <div className="pt-2 border-t border-green-200 dark:border-green-800">
                        <p className="font-semibold text-green-900 dark:text-green-200 mb-1">AI Prompt Guide:</p>
                        <p className="opacity-70 italic">
                          Create a set of Translation Rules and Context for a "Japan Anime Game Product Company".
                          <br />
                          Languages: JP | VN
                          <br />
                          Target audience: Developer, Engineer, 2D & 3D Artist, Game Designer, QA, CS, Effect, Animation, etc.
                          <br />
                          The writing style is polite, friendly, concise, not overly formal, and not overly serious.
                          <br />
                          Prioritize the Glossary of specialized terms.
                          <br />
                          If it's a technical term, use the English equivalent (including abbreviations if applicable).
                          <br />
                          Include specific instructions on tone, style, and vocabulary constraints to ensure consistent localization.
                          <br />
                          Format Data: .txt

                        </p>
                      </div>

                      <p className="opacity-70 italic font-mono bg-green-100/50 dark:bg-green-900/20 p-2 rounded">
                        Ví dụ: <br/>
                        - Dịch cho sản phẩm Game Anime Nhật Bản <br/>
                        - Đối tượng: Developer, Engineer, 3D Artist, Game Designer,... <br/>
                        - Sử dụng đại từ nhân xưng phù hợp ngữ cảnh <br/>
                        - Ưu tiên dịch thoát ý nhưng vẫn giữ đúng tinh thần gốc
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="Enter rules, persona, or context here..."
                className="w-full h-[200px] p-2 text-sm rounded-lg border border-green-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGlossary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <GlossaryManager onUpdate={setGlossary} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Switcher */}
      <div className="flex p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setMode('text')}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all",
            mode === 'text' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          )}
        >
          <Type size={18} />
          Text
        </button>
        <button
          onClick={() => setMode('document')}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all",
            mode === 'document' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          )}
        >
          <FileText size={18} />
          Documents
        </button>
        <button
          onClick={() => setMode('dictionary')}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all",
            mode === 'dictionary' ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          )}
        >
          <BookOpen size={18} />
          Chat
        </button>
      </div>

      <div className={cn(mode !== 'text' && "hidden")}>
        {/* Main Translator Card */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          {/* Source Language Side */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1 h-8">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                {sourceLang === 'ja' ? 'Japanese' : 'Vietnamese'}
              </span>
              <div className="flex gap-1 text-slate-400 text-xs items-center">
                <span className="md:block hidden">Input language</span>
              </div>
            </div>
            <div className="relative group">
              <textarea
                ref={textareaRef}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Type or paste text..."
                className="w-full min-h-[12rem] h-auto p-4 pb-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none resize-none overflow-hidden shadow-sm text-lg text-slate-800 dark:text-slate-100"
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button 
                  onClick={() => speak(sourceText, sourceLang)}
                  disabled={!sourceText}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-30"
                >
                  <Volume2 size={18} />
                </button>
                <button 
                  onClick={toggleRecording}
                  className={cn(
                    "p-2 rounded-lg transition-colors shadow-sm",
                    isRecording ? "bg-red-500 text-white animate-pulse" : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                  )}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex h-8 md:h-8 items-center justify-center my-2 md:my-0 z-20">
            <button 
              onClick={swapLanguages}
              className="p-1.5 md:p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-300 shadow-sm transition-all active:scale-90"
            >
              <ArrowLeftRight size={18} className="md:rotate-0 rotate-90" />
            </button>
          </div>

          {/* Target Language Side */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1 h-8">
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                {targetLang === 'ja' ? 'Japanese' : 'Vietnamese'}
              </span>
              <button
                onClick={handleClear}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Clear Input and Output"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <div className="relative">
              <div className={cn(
                "w-full min-h-[12rem] h-auto p-4 pb-14 rounded-2xl border text-lg shadow-sm whitespace-pre-wrap dark:text-slate-100",
                isLoading ? "bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700 animate-pulse" : "bg-blue-50/30 dark:bg-indigo-900/20 border-blue-100 dark:border-indigo-800/60"
              )}>
                {isLoading ? (
                  <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-300 italic text-sm">
                    Translating...
                  </div>
                ) : translatedText ? (
                  <div className="markdown-body prose prose-slate dark:prose-invert max-w-none dark:text-slate-100">
                    <CustomMarkdown>{translatedText}</CustomMarkdown>
                  </div>
                ) : (
                  <span className="text-slate-400 dark:text-slate-400 italic text-sm">Translation will appear here</span>
                )}
              </div>
              {translatedText && (
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button 
                    onClick={() => speak(translatedText, targetLang)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Volume2 size={18} />
                  </button>
                  <button 
                    onClick={() => copyToClipboard(translatedText, 'output')}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors relative"
                  >
                    {copiedId === 'output' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center items-center gap-3 mt-6">
          <button
            onClick={handleTranslate}
            disabled={!sourceText.trim() || isLoading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition-all active:scale-95 disabled:scale-100"
          >
            Translate
          </button>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "p-3 rounded-2xl transition-all shadow-md",
              showHistory 
                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" 
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
            title="History"
          >
            <HistoryIcon size={20} />
          </button>
        </div>

        {/* History Drawer */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Local History</h2>
                <button 
                  onClick={() => {
                    clearHistory();
                    setHistory([]);
                  }}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={12} /> Clear all
                </button>
              </div>
              
              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 italic text-sm">No recent translations found locally.</div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                          <span>{item.sourceLang === 'ja' ? 'JA' : 'VI'}</span>
                          <ArrowLeftRight size={10} />
                          <span>{item.targetLang === 'ja' ? 'JA' : 'VI'}</span>
                          <span className="ml-2 font-normal lowercase">{new Date(item.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFromHistory(item.id);
                            setHistory(h => h.filter(x => x.id !== item.id));
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="space-y-2" onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}>
                        <p className={cn("text-sm text-slate-600 dark:text-slate-300", expandedHistoryId !== item.id && "line-clamp-2")}>{item.sourceText}</p>
                        {expandedHistoryId === item.id && (
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 pt-2 border-t border-slate-100 dark:border-slate-700">
                             <CustomMarkdown>{item.translatedText}</CustomMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={cn(mode !== 'document' && "hidden")}>
        <DocumentTranslator sourceLang={sourceLang} targetLang={targetLang} rules={rules} glossary={glossary} />
      </div>

      <div className={cn(mode !== 'dictionary' && "hidden")}>
        <DictionaryChat rules={rules} glossary={glossary} />
      </div>


      {/* Offline capability note */}
      <div className="text-center pb-8">
        <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
          Translations require an internet connection via Gemini AI. 
          Your history is stored locally in your browser for offline viewing.
        </p>
      </div>
    </div>
  );
}
