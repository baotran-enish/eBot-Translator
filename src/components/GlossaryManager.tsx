import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, Plus, Trash2, HelpCircle, X, Save, AlertCircle, Book } from 'lucide-react';
import { getGlossary, saveTerm, deleteTerm, updateGlossary } from '../services/db';
import { GlossaryItem } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface GlossaryManagerProps {
  onUpdate: (glossary: GlossaryItem[]) => void;
}

export default function GlossaryManager({ onUpdate }: GlossaryManagerProps) {
  const [terms, setTerms] = useState<(GlossaryItem & { id: string })[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTerm, setNewTerm] = useState({ term: '', translation: '', note: '' });
  const [showInstructions, setShowInstructions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGlossary();
  }, []);

  const loadGlossary = async () => {
    const data = await getGlossary();
    setTerms(data as any);
    onUpdate(data.map(d => ({ term: d.term, translation: d.translation, note: d.note })));
  };

  const handleAdd = async () => {
    if (!newTerm.term || !newTerm.translation) return;
    await saveTerm(newTerm.term, newTerm.translation, newTerm.note);
    setNewTerm({ term: '', translation: '', note: '' });
    setIsAdding(false);
    loadGlossary();
  };

  const handleDelete = async (id: string) => {
    await deleteTerm(id);
    loadGlossary();
  };

  const handleDownload = () => {
    const content = terms
      .map(t => `${t.term} | ${t.translation}${t.note ? ` | ${t.note}` : ''}`)
      .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'specialized_terms.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => setStatus(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        // Split by any newline character (Windows or Unix)
        const lines = content.split(/\r?\n/);
        const newTerms: any[] = [];

        lines.forEach(line => {
          if (!line.trim()) return;
          // Split by | or Tab or comma if needed, but stick to | as primary
          const parts = line.split('|').map(p => p.trim());
          if (parts.length >= 2 && parts[0] && parts[1]) {
            newTerms.push({
              term: parts[0],
              translation: parts[1],
              note: parts[2] || ''
            });
          }
        });

        if (newTerms.length > 0) {
          await updateGlossary(newTerms);
          await loadGlossary();
          setStatus({ type: 'success', message: `Imported ${newTerms.length} terms successfully!` });
        } else {
          setStatus({ type: 'error', message: 'No valid terms found in file.' });
        }
      } catch (err) {
        console.error('Upload error:', err);
        setStatus({ type: 'error', message: 'Failed to parse file.' });
      }
    };
    reader.onerror = () => setStatus({ type: 'error', message: 'Error reading file.' });
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const [searchQuery, setSearchQuery] = useState('');

  const filteredTerms = terms.filter(t => 
    t.term.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.note?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
      <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Book size={18} className="text-blue-500" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 hidden sm:block">Glossary</h3>
          <button 
            onClick={() => setShowInstructions(!showInstructions)}
            className="p-1 rounded-full text-slate-400 hover:text-blue-500 transition-colors"
          >
            <HelpCircle size={14} />
          </button>
        </div>

        <div className="flex-1 max-w-xs relative">
          <input 
            type="text"
            placeholder="Search terms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none"
          />
        </div>

        <div className="flex gap-1">
          {status && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "hidden md:flex px-2 py-1 rounded text-[10px] font-medium items-center gap-1",
                status.type === 'success' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              {status.message}
            </motion.div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            accept=".txt" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Upload .txt"
          >
            <Upload size={16} />
          </button>
          <button 
            onClick={handleDownload}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Download .txt"
          >
            <Download size={16} />
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title="Add New Term"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="shrink-0 overflow-hidden bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30"
          >
            <div className="p-3 text-[11px] text-blue-800 dark:text-blue-300 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-200">
                <AlertCircle size={12} />
                <span>Format for Upload (.txt)</span>
              </div>
              <p>One term per line: <code>Term | Translation | Note (optional)</code></p>
              <div className="opacity-70 bg-white/50 dark:bg-slate-900/50 p-1.5 rounded border border-blue-100 dark:border-blue-800 font-mono">
                召喚 | Summon | Triệu hồi
                <br />
                勇者 | Hero | Anh hùng
              </div>
              
              <div className="pt-2 border-t border-blue-100 dark:border-blue-800 mt-2">
                <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">AI Prompt Guide:</p>
                <p className="opacity-70 italic">
                  Create a Glossary of 100-200 words for a "Japan Anime Game Product Company" 
                  <br />
                  Target audience: Developer, Engineer, 2D & 3D Artist, Game Designer, QA, CS, Effect, Animation, etc.
                  <br />
                  Output format (Note: One Term Per Line): Term (JP) | Translation (ENG) | Vietnamese (ENG Abbreviation).
                  <br />
                  No Additional Words & Transcription
                  <br />
                  Limit to the most important terms.
                  <br />
                  Format Data: .txt
                  <br />
                  Example: <br />
                  勇者 | Hero | Anh hùng <br />
                  召喚 | Summon | Triệu hồi <br />
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto min-h-[100px]">
        {isAdding && (
          <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/5">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2">
              <input 
                type="text" 
                placeholder="Term"
                value={newTerm.term}
                onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })}
                className="px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                autoFocus
              />
              <input 
                type="text" 
                placeholder="Translation"
                value={newTerm.translation}
                onChange={(e) => setNewTerm({ ...newTerm, translation: e.target.value })}
                className="px-2 py-1.5 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <div className="flex gap-1">
                <button onClick={handleAdd} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                  <Save size={16} />
                </button>
                <button onClick={() => setIsAdding(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                  <X size={16} />
                </button>
              </div>
            </div>
            <input 
              type="text" 
              placeholder="Context / Note (Optional)"
              value={newTerm.note}
              onChange={(e) => setNewTerm({ ...newTerm, note: e.target.value })}
              className="w-full px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
        )}

        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {filteredTerms.length === 0 ? (
            <div className="text-center py-8 text-slate-400 italic text-xs">
              {searchQuery ? "No matches found." : "No terms added yet."}
            </div>
          ) : (
            filteredTerms.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                <div className="w-1/3 min-w-0">
                  <div className="font-medium text-xs text-slate-700 dark:text-slate-200 truncate" title={item.term}>
                    {item.term}
                  </div>
                </div>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-blue-600 dark:text-blue-400 truncate" title={item.translation}>
                    {item.translation}
                  </div>
                  {item.note && (
                    <div className="text-[10px] text-slate-400 truncate mt-0.5 leading-tight" title={item.note}>
                      {item.note}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 transition-all rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {filteredTerms.length > 0 && (
        <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 text-[10px] text-slate-400 text-center">
          Showing {filteredTerms.length} of {terms.length} terms
        </div>
      )}
    </div>
  );
}
