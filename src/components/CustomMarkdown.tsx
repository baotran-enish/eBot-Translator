import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { CustomPre } from './CustomPre';

interface CustomMarkdownProps {
  children: string;
  remarkPlugins?: any[];
  isUser?: boolean;
}

export default function CustomMarkdown({ children, remarkPlugins, isUser = false }: CustomMarkdownProps) {
  const textColor = isUser 
    ? "text-white/95" 
    : "text-slate-705 dark:text-slate-300 text-slate-700 dark:text-slate-300";

  const headingColor = isUser
    ? "text-white"
    : "text-slate-900 dark:text-slate-50";

  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      components={{
        pre: ({ children }) => <CustomPre>{children}</CustomPre>,
        code: ({ children, className, ...props }: any) => {
          const isInline = !className && typeof children === 'string' && !children.includes('\n');
          return isInline ? (
            <code 
              className={cn(
                isUser 
                  ? "px-1.5 py-0.5 bg-blue-700/50 rounded font-mono text-xs text-white break-words" 
                  : "px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs text-pink-600 dark:text-pink-400 font-semibold break-words", 
                className
              )} 
              {...props}
            >
              {children}
            </code>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        h1: ({ children }) => (
          <h1 className={cn("text-base md:text-lg font-extrabold mt-4 mb-2 pb-1 border-b font-sans tracking-tight", 
            headingColor, 
            isUser ? "border-white/20" : "border-slate-200 dark:border-slate-800"
          )}>
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className={cn("text-sm md:text-base font-bold mt-3.5 mb-1.5 pb-0.5 font-sans tracking-tight", headingColor)}>
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className={cn("text-xs md:text-sm font-semibold mt-2.5 mb-1 font-sans", headingColor)}>
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className={cn("leading-relaxed text-xs md:text-sm my-2 last:mb-0", textColor)}>
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className={cn("list-disc pl-5 my-2.5 space-y-1.5", isUser ? "marker:text-white" : "marker:text-blue-500")}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className={cn("list-decimal pl-5 my-2.5 space-y-1.5", isUser ? "marker:text-white" : "marker:text-blue-500")}>
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className={cn("leading-relaxed pl-1 text-xs md:text-sm", textColor)}>
            {children}
          </li>
        ),
        blockquote: ({ children }) => (
          <blockquote className={cn("border-l-4 pl-3.5 py-2 pr-2 my-3 rounded-r-xl italic text-xs leading-relaxed", 
            isUser 
              ? "border-white/40 bg-white/10 text-white/90" 
              : "border-blue-500 bg-slate-100/50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400"
          )}>
            {children}
          </blockquote>
        ),
        strong: ({ children }) => (
          <strong className={cn("font-bold font-semibold", isUser ? "text-white" : "text-slate-900 dark:text-white")}>
            {children}
          </strong>
        ),
        hr: () => (
          <hr className={cn("my-4", isUser ? "border-white/20" : "border-slate-200 dark:border-slate-800")} />
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className={isUser ? "bg-white/12" : "bg-slate-50 dark:bg-slate-900"}>
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className={cn("divide-y divide-slate-205 dark:divide-slate-800", isUser ? "bg-white/5 divide-white/10" : "bg-white dark:bg-slate-950 divide-slate-200")}>
            {children}
          </tbody>
        ),
        tr: ({ children }) => (
          <tr>{children}</tr>
        ),
        th: ({ children }) => (
          <th className={cn("px-3.5 py-2 text-left font-semibold", isUser ? "text-white" : "text-slate-700 dark:text-slate-300")}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className={cn("px-3.5 py-2 whitespace-normal", isUser ? "text-white/90" : "text-slate-600 dark:text-slate-400")}>
            {children}
          </td>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
