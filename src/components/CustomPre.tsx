import React, { useState, useRef } from 'react';
import { Check, Copy } from 'lucide-react';

interface CustomPreProps {
  children?: React.ReactNode;
}

export function CustomPre({ children }: CustomPreProps) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const handleCopy = () => {
    if (preRef.current) {
      const text = preRef.current.innerText || '';
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="relative group my-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between px-4 py-1.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-sans select-none">
        <span className="font-mono text-[10px] tracking-wider uppercase">Code Block</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 transition-all text-xs font-medium cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={13} className="text-green-500" />
              <span className="text-green-500 font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre 
        ref={preRef} 
        className="p-4 overflow-x-auto max-w-full font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-100  whitespace-pre scrollbar-thin"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </pre>
    </div>
  );
}
