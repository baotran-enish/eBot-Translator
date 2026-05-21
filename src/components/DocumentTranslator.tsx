import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, 
  Upload, 
  Cloud, 
  Download, 
  Eye, 
  FileCheck, 
  AlertCircle,
  Files,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateDocument } from '../services/gemini';
import { processDocxOriginal, processXlsxOriginal, processPptxOriginal, processOdtOriginal } from '../services/documentService';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result?.toString().split(',')[1];
      resolve(base64String || '');
    };
    reader.onerror = (error) => reject(error);
  });
};

interface DocumentTranslatorProps {
  sourceLang: string;
  targetLang: string;
  rules?: string;
  glossary?: any[];
}

export default function DocumentTranslator({ sourceLang, targetLang, rules, glossary }: DocumentTranslatorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [translatedBlob, setTranslatedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setTranslatedContent(null);
      setTranslatedBlob(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.oasis.opendocument.text': ['.odt'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxFiles: 1
  });

  const generateSimplePDF = async (text: string) => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    
    // Very naive text wrapping for PDF preview
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = font.widthOfTextAtSize(currentLine + " " + word, 12);
      if (width < page.getWidth() - 2 * margin) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);

    page.drawText(lines.join('\n'), {
      x: margin,
      y: height - margin,
      size: 12,
      font,
      color: rgb(0, 0, 0),
      lineHeight: 14,
    });
    
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  };

  const handleTranslate = async () => {
    if (!file) return;
    setIsTranslating(true);
    setTranslationProgress(0);
    setError(null);
    setTranslatedBlob(null);

    const onProgress = (p: number) => setTranslationProgress(p);

    try {
      let outBlob = null;
      let previewMarkdown = "";

      if (file.name.endsWith('.docx') || file.name.endsWith('.xlsx') || file.name.endsWith('.pptx') || file.name.endsWith('.odt')) {
        if (file.name.endsWith('.docx')) {
          outBlob = await processDocxOriginal(file, sourceLang, targetLang, rules, onProgress, glossary);
          previewMarkdown = "> **Preview not available for Word Documents.**\n>\n> Please download the *Original Format* file to view the translated document.";
        } else if (file.name.endsWith('.xlsx')) {
          outBlob = await processXlsxOriginal(file, sourceLang, targetLang, rules, onProgress, glossary);
          previewMarkdown = "> **Preview not available for Excel Spreadsheets.**\n>\n> Please download the *Original Format* file to view the translated spreadsheet.";
        } else if (file.name.endsWith('.pptx')) {
          outBlob = await processPptxOriginal(file, sourceLang, targetLang, rules, onProgress, glossary);
          previewMarkdown = "> **Preview not available for PowerPoint Presentations.**\n>\n> Please download the *Original Format* file to view the translated presentation.";
        } else if (file.name.endsWith('.odt')) {
          outBlob = await processOdtOriginal(file, sourceLang, targetLang, rules, onProgress, glossary);
          previewMarkdown = "> **Preview not available for OpenDocument Text.**\n>\n> Please download the *Original Format* file to view the translated document.";
        }
      } else {
        const base64 = await fileToBase64(file);
        // For standard translation, we don't have chunking yet, but we can set it to a fixed high number
        setTranslationProgress(10);
        previewMarkdown = await translateDocument(base64, file.type, sourceLang, targetLang, rules, glossary);
        setTranslationProgress(100);
        
        if (file.name.endsWith('.pdf')) {
          outBlob = await generateSimplePDF(previewMarkdown);
        } else {
          outBlob = new Blob([previewMarkdown], { type: 'text/plain' });
        }
      }

      setTranslatedContent(previewMarkdown);
      if (outBlob) {
        setTranslatedBlob(outBlob);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during translation.");
    } finally {
      setIsTranslating(false);
      // Wait a bit before clearing progress to let user see 100%
      setTimeout(() => setTranslationProgress(0), 1000);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!translatedContent) return;
    const blob = new Blob([translatedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated_${file?.name.split('.')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadOriginal = () => {
    if (!translatedBlob || !file) return;
    
    // Fallback to standard docx mime type if file.type is missing
    const mimeType = file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const blobToDownload = new Blob([translatedBlob], { type: mimeType });
    const url = URL.createObjectURL(blobToDownload);
    const a = document.createElement('a');
    a.href = url;
    // Use the original file name with 'translated_' prefix
    const safeName = file.name;
    a.download = `translated_${safeName}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Files size={20} className="text-blue-600 dark:text-blue-400" />
          Document Translation
        </h2>
        {file && !isTranslating && (
          <button 
            onClick={() => { setFile(null); setTranslatedContent(null); }}
            className="text-xs text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {!file ? (
        <div className="max-w-2xl mx-auto">
          <div 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group",
              isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
          >
            <input {...getInputProps()} />
            <div className="p-4 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-700 dark:text-slate-100">Upload a document</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PDF, Word, Excel, PowerPoint, Text</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl shadow-inner">
              <FileCheck size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate text-lg">{file.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-300 uppercase tracking-widest font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}</p>
            </div>
            {!translatedContent && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  {isTranslating ? <Loader2 className="animate-spin" size={18} /> : <FileCheck size={18} />}
                  {isTranslating ? 'Translating...' : 'Translate'}
                </button>
                {isTranslating && translationProgress > 0 && (
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-blue-600 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${translationProgress}%` }}
                      transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400 mb-6">
              <AlertCircle size={20} className="mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {translatedContent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-4">
                <button
                  onClick={() => setPreviewMode(true)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all",
                    previewMode ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/20" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  <Eye size={18} /> Preview
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium transition-all"
                >
                  <Download size={18} /> .MD
                </button>
                {translatedBlob && (
                  <button
                    onClick={handleDownloadOriginal}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/70 text-sm font-medium transition-all"
                  >
                    <Download size={18} /> Original Format
                  </button>
                )}
              </div>

              {previewMode && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 max-h-[500px] overflow-auto border border-slate-100 dark:border-slate-800 relative">
                  <button 
                    onClick={() => setPreviewMode(false)}
                    className="absolute top-4 right-4 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-500 dark:text-slate-400"
                  >
                    <X size={16} />
                  </button>
                  <div className="markdown-body prose prose-blue prose-slate dark:prose-invert max-w-none dark:text-slate-100">
                    <ReactMarkdown>{translatedContent}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
        <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 leading-relaxed italic">
          * Document translation utilizes Gemini AI. Complex formatting may be simplified to Markdown. 
          Exporting attempts to preserve the core structure of your tables and text.
        </p>
      </div>
    </div>
  );
}
