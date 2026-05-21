import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { translateBulk, GlossaryItem } from './gemini';

export async function processDocxOriginal(file: File, sourceLang: string, targetLang: string, rules?: string, onProgress?: (p: number) => void, glossary?: GlossaryItem[]): Promise<Blob> {
  const zip = await JSZip.loadAsync(file);
  const wordFilesRegex = /^word\/(document|header\d+|footer\d+|footnotes|endnotes|drawings\/drawing\d+)\.xml$/;
  const wordFiles = Object.keys(zip.files).filter(name => wordFilesRegex.test(name));
  
  const stringsToTranslate: string[] = [];
  const xmlMap = new Map<string, string>();
  const placeholderMap = new Map<string, string[]>();

  const escapeXml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const cleanXml = (xml: string) => {
    return xml
      .replace(/\u3000/g, ' ')
      .replace(/<w:rsidR[^>]*="[^"]*"/g, '')
      .replace(/<w:rsidRPr[^>]*="[^"]*"/g, '')
      .replace(/<w:rsidRP[^>]*="[^"]*"/g, '')
      .replace(/<w:rsidRDefault[^>]*="[^"]*"/g, '')
      .replace(/<w:proofErr[^>]*\/>/g, '')
      .replace(/<w:noBreakHyphen\/>/g, '')
      .replace(/<w:lang[^>]*\/>/g, '')
      .replace(/<w:lastRenderedPageBreak\/>/g, '')
      .replace(/<w:bookmarkStart[^>]*\/>/g, '')
      .replace(/<w:bookmarkEnd[^>]*\/>/g, '');
  };

  for (const wordFile of wordFiles) {
    let xml = await zip.file(wordFile)?.async('string');
    if (xml) {
      if (wordFile.includes('document.xml') || wordFile.includes('header') || wordFile.includes('footer')) {
        xml = cleanXml(xml);
      }
      
      const fileParas: {id: string, original: string}[] = [];
      let textIdx = 0;
      
      // Extract texts by paragraph to fix split word issues which occur frequently in tables
      const replacedXml = xml.replace(/<(w:p|a:p)(>| [^>]*>)(.*?)<\/\1>/gs, (match, pTag, pAttrs, content) => {
        const tRegex = /<([aw]:t)(>| [^>]*>)(.*?)<\/\1>/gs;
        const tMatches = Array.from(content.matchAll(tRegex));
        if (tMatches.length === 0) return match;

        let fullText = "";
        for (const m of tMatches) {
            fullText += m[3];
        }

        const unescaped = fullText
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .normalize('NFKC');
            
        const text = unescaped.trim();
        // Skip translating if it's empty or just symbols/numbers
        if (!text || text.match(/^[\d\s\.,_]+$/)) return match;

        stringsToTranslate.push(text);
        
        const placeholderId = `___P_${wordFile.replace(/\//g, '_')}_${textIdx++}___`;
        
        // Put the placeholder into the first text run, and clear the rest
        let isFirst = true;
        const newContent = content.replace(tRegex, (tMatch: string, tTag: string, tAttrs: string, tContent: string) => {
            if (isFirst) {
                isFirst = false;
                let newAttrs = tAttrs;
                if (!newAttrs.includes('xml:space="preserve"')) {
                    if (newAttrs === '>') newAttrs = ' xml:space="preserve">';
                    else newAttrs = newAttrs.slice(0, -1) + ' xml:space="preserve">';
                }
                return `<${tTag}${newAttrs}${placeholderId}</${tTag}>`;
            } else {
                return `<${tTag}${tAttrs}</${tTag}>`;
            }
        });
        
        fileParas.push({ id: placeholderId, original: text });
        return `<${pTag}${pAttrs}${newContent}</${pTag}>`;
      });

      xmlMap.set(wordFile, replacedXml);
      placeholderMap.set(wordFile, fileParas as any);
    }
  }

  const uniqueStrings = Array.from(new Set(stringsToTranslate));
  if (uniqueStrings.length > 0) {
    const maxCharsPerChunk = 4000;
    const translatedMap = new Map<string, string>();
    const tasks: string[][] = [];
    let currentChunk: string[] = [];
    let currentChars = 0;

    for (const s of uniqueStrings) {
      if (currentChars + s.length > maxCharsPerChunk || currentChunk.length >= 100) {
        tasks.push(currentChunk);
        currentChunk = [];
        currentChars = 0;
      }
      currentChunk.push(s);
      currentChars += s.length;
    }
    if (currentChunk.length > 0) tasks.push(currentChunk);

    let completed = 0;
    const processBatch = async (chunk: string[]) => {
      const translated = await translateBulk(chunk, sourceLang, targetLang, rules, glossary);
      chunk.forEach((s, idx) => {
        let t = translated[idx] || s;
        t = t.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '');
        translatedMap.set(s, t);
      });
      completed += chunk.length;
      if (onProgress) onProgress(Math.floor((completed / uniqueStrings.length) * 100));
    };

    const concurrency = 4;
    for (let i = 0; i < tasks.length; i += concurrency) {
      await Promise.all(tasks.slice(i, i + concurrency).map(processBatch));
    }
    if (onProgress) onProgress(100);

    for (const [name, replaced] of xmlMap.entries()) {
      const paras = placeholderMap.get(name) as any as {id: string, original: string}[] || [];
      let finalXml = replaced;
      paras.forEach((p) => {
        const translated = translatedMap.get(p.original) || p.original;
        finalXml = finalXml.replace(p.id, escapeXml(translated));
      });
      zip.file(name, finalXml);
    }
  }

  return await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

export async function processPptxOriginal(file: File, sourceLang: string, targetLang: string, rules?: string, onProgress?: (p: number) => void, glossary?: GlossaryItem[]): Promise<Blob> {
  const zip = await JSZip.loadAsync(file);
  const pptFilesRegex = /^ppt\/(slides|notesSlides|slideMasters|slideLayouts)\/(slide|notesSlide|slideMaster|slideLayout)\d+\.xml$/;
  const pptFiles = Object.keys(zip.files).filter(name => pptFilesRegex.test(name));
  
  const stringsToTranslate: string[] = [];
  const xmlMap = new Map<string, string>();
  const placeholderMap = new Map<string, string[]>();

  const escapeXml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  for (const pptFile of pptFiles) {
    let xml = await zip.file(pptFile)?.async('string');
    if (xml) {
      xml = xml.replace(/\u3000/g, ' ');
      
      const fileParas: {id: string, original: string}[] = [];
      let textIdx = 0;
      
      const replacedXml = xml.replace(/<a:p(>| [^>]*>)(.*?)<\/a:p>/gs, (match, pAttrs, content) => {
        const tRegex = /<a:t(>| [^>]*>)(.*?)<\/a:t>/gs;
        const tMatches = Array.from(content.matchAll(tRegex));
        if (tMatches.length === 0) return match;

        let fullText = "";
        for (const m of tMatches) {
            fullText += m[2];
        }

        const unescaped = fullText
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .normalize('NFKC');
            
        const text = unescaped.trim();
        if (!text || text.match(/^[\d\s\.,_]+$/)) return match;

        stringsToTranslate.push(text);
        
        const placeholderId = `___P_${pptFile.replace(/\//g, '_')}_${textIdx++}___`;
        
        let isFirst = true;
        const newContent = content.replace(tRegex, (tMatch: string, tAttrs: string, tContent: string) => {
            if (isFirst) {
                isFirst = false;
                return `<a:t${tAttrs}${placeholderId}</a:t>`;
            } else {
                return `<a:t${tAttrs}</a:t>`;
            }
        });
        
        fileParas.push({ id: placeholderId, original: text });
        return `<a:p${pAttrs}${newContent}</a:p>`;
      });

      xmlMap.set(pptFile, replacedXml);
      placeholderMap.set(pptFile, fileParas as any);
    }
  }

  const uniqueStrings = Array.from(new Set(stringsToTranslate));
  if (uniqueStrings.length > 0) {
    const maxChars = 4000;
    const translatedMap = new Map<string, string>();
    const chunks: string[][] = [];
    let curChunk: string[] = [];
    let curChars = 0;

    for (const s of uniqueStrings) {
      if (curChars + s.length > maxChars || curChunk.length >= 100) {
        chunks.push(curChunk);
        curChunk = [];
        curChars = 0;
      }
      curChunk.push(s);
      curChars += s.length;
    }
    if (curChunk.length > 0) chunks.push(curChunk);

    let comp = 0;
    const batch = async (c: string[]) => {
      const trans = await translateBulk(c, sourceLang, targetLang, rules, glossary);
      c.forEach((s, i) => {
        let t = trans[i] || s;
        t = t.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '');
        translatedMap.set(s, t);
      });
      comp += c.length;
      if (onProgress) onProgress(Math.floor((comp / uniqueStrings.length) * 100));
    };

    const limit = 4;
    for (let i = 0; i < chunks.length; i += limit) {
      await Promise.all(chunks.slice(i, i + limit).map(batch));
    }
    if (onProgress) onProgress(100);

    for (const [path, replaced] of xmlMap.entries()) {
      const paras = placeholderMap.get(path) as any as {id: string, original: string}[] || [];
      let final = replaced;
      paras.forEach((p) => {
        const trans = translatedMap.get(p.original) || p.original;
        final = final.replace(p.id, escapeXml(trans));
      });
      zip.file(path, final);
    }
  }

  return await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
}

export async function processOdtOriginal(file: File, sourceLang: string, targetLang: string, rules?: string, onProgress?: (p: number) => void, glossary?: GlossaryItem[]): Promise<Blob> {
  const zip = await JSZip.loadAsync(file);
  const contentXml = await zip.file('content.xml')?.async('string');
  if(!contentXml) throw new Error("Invalid odt file structure");

  const regex = /<text:p(?:.*?)>(.*?)<\/text:p>/g;
  let match;
  const stringsToTranslate = [];
  
  while ((match = regex.exec(contentXml)) !== null) {
    let text = match[1];
    // Remove if containing other tags
    if(text && text.trim().length > 0 && !text.includes('<')) {
      text = text.normalize('NFKC');
      stringsToTranslate.push(text);
    }
  }

  const uniqueStrings = Array.from(new Set(stringsToTranslate));
  if (uniqueStrings.length > 0) {
    const maxCharsPerChunk = 5000;
    const translatedUnique: string[] = new Array(uniqueStrings.length);
    
    const concurrencyLimit = 5;
    const tasks: number[] = [];
    
    let currentChunkStart = 0;
    let currentChunkChars = 0;
    let currentChunkSize = 0;

    for (let i = 0; i < uniqueStrings.length; i++) {
      currentChunkChars += uniqueStrings[i].length;
      currentChunkSize++;
      
      if (currentChunkChars >= maxCharsPerChunk || currentChunkSize >= 300 || i === uniqueStrings.length - 1) {
        tasks.push(currentChunkStart);
        currentChunkStart = i + 1;
        currentChunkChars = 0;
        currentChunkSize = 0;
      }
    }

    let completedStrings = 0;
    const processBatch = async (startIndex: number) => {
      const taskIdx = tasks.indexOf(startIndex);
      const nextTaskStart = taskIdx < tasks.length - 1 ? tasks[taskIdx + 1] : uniqueStrings.length;
      
      const chunk = uniqueStrings.slice(startIndex, nextTaskStart);
      const translatedChunk = await translateBulk(chunk, sourceLang, targetLang, rules, glossary);
      for (let j = 0; j < translatedChunk.length; j++) {
        translatedUnique[startIndex + j] = translatedChunk[j];
      }
      completedStrings += chunk.length;
      if (onProgress) onProgress(Math.floor((completedStrings / uniqueStrings.length) * 100));
    };

    for (let i = 0; i < tasks.length; i += concurrencyLimit) {
      const currentTasks = tasks.slice(i, i + concurrencyLimit);
      await Promise.all(currentTasks.map(processBatch));
    }
    if (onProgress) onProgress(100);

    const transMap = new Map();
    uniqueStrings.forEach((s, idx) => {
      const translated = translatedUnique[idx] || s;
      const sanitized = translated.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '');
      transMap.set(s, sanitized);
    });

    const newContentXml = contentXml.replace(/<text:p([^>]*)>(.*?)<\/text:p>/gs, (fullMatch, attrs, p2) => {
      if(p2 && p2.trim().length > 0 && !p2.includes('<') && transMap.has(p2)) {
          const translatedText = transMap.get(p2);
          const escaped = translatedText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
          return `<text:p${attrs}>${escaped}</text:p>`;
      }
      return fullMatch;
    });
    zip.file('content.xml', newContentXml);
  }

  const content = await zip.generateAsync({
    type: "blob", 
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
  return content;
}

export async function processXlsxOriginal(file: File, sourceLang: string, targetLang: string, rules?: string, onProgress?: (p: number) => void, glossary?: GlossaryItem[]): Promise<Blob> {
  const zip = await JSZip.loadAsync(file);
  const sharedXml = await zip.file('xl/sharedStrings.xml')?.async('string');
  
  const stringsToTranslate: string[] = [];
  const xmlMap = new Map<string, string>();

  // 1. Collect from shared strings (Cells)
  if (sharedXml) {
    // Pre-clean shared strings: merge split runs and normalize Japanese whitespace
    const cleanSharedXml = sharedXml
      .replace(/\u3000/g, ' ')
      .replace(/<\/t><\/r><r><t[^>]*>/g, '');
    xmlMap.set('xl/sharedStrings.xml', cleanSharedXml);
    const regex = /<t([^>]*)>(.*?)<\/t>/gs;
    let match;
    while ((match = regex.exec(cleanSharedXml)) !== null) {
      let text = match[2];
      if (text && text.trim().length > 0 && !text.includes('<')) {
        text = text.normalize('NFKC');
        stringsToTranslate.push(text);
      }
    }
  }

  // 2. Collect from worksheets (Inline strings)
  const sheetRegex = /^xl\/worksheets\/sheet\d+\.xml$/;
  const sheetFiles = Object.keys(zip.files).filter(name => sheetRegex.test(name));
  for (const sheetFile of sheetFiles) {
    let xml = await zip.file(sheetFile)?.async('string');
    if (xml) {
      xml = xml.replace(/\u3000/g, ' ');
      xmlMap.set(sheetFile, xml);
      const textRegex = /<t([^>]*)>(.*?)<\/t>/gs;
      let match;
      while ((match = textRegex.exec(xml)) !== null) {
        let text = match[2];
        if (text && text.trim().length > 0 && !text.includes('<')) {
          text = text.normalize('NFKC');
          stringsToTranslate.push(text);
        }
      }
    }
  }

  // 3. Collect from drawings (Textboxes/Shapes)
  const drawingRegex = /^xl\/drawings\/drawing\d+\.xml$/;
  const drawingFiles = Object.keys(zip.files).filter(name => drawingRegex.test(name));
  for (const drawingFile of drawingFiles) {
    let xml = await zip.file(drawingFile)?.async('string');
    if (xml) {
      xml = xml.replace(/\u3000/g, ' ');
      xmlMap.set(drawingFile, xml);
      const textRegex = /<a:t([^>]*)>(.*?)<\/a:t>/gs;
      let match;
      while ((match = textRegex.exec(xml)) !== null) {
        let text = match[2];
        if (text && text.trim().length > 0 && !text.includes('<')) {
          text = text.normalize('NFKC');
          stringsToTranslate.push(text);
        }
      }
    }
  }

  const uniqueStrings = Array.from(new Set(stringsToTranslate));
  if (uniqueStrings.length > 0) {
    const maxCharsPerChunk = 5000;
    const translatedUnique: string[] = new Array(uniqueStrings.length);
    
    const concurrencyLimit = 5;
    const tasks: number[] = [];
    
    let currentChunkStart = 0;
    let currentChunkChars = 0;
    let currentChunkSize = 0;

    for (let i = 0; i < uniqueStrings.length; i++) {
      currentChunkChars += uniqueStrings[i].length;
      currentChunkSize++;
      
      if (currentChunkChars >= maxCharsPerChunk || currentChunkSize >= 300 || i === uniqueStrings.length - 1) {
        tasks.push(currentChunkStart);
        currentChunkStart = i + 1;
        currentChunkChars = 0;
        currentChunkSize = 0;
      }
    }

    let completedStrings = 0;
    const processBatch = async (startIndex: number) => {
      const taskIdx = tasks.indexOf(startIndex);
      const nextTaskStart = taskIdx < tasks.length - 1 ? tasks[taskIdx + 1] : uniqueStrings.length;
      
      const chunk = uniqueStrings.slice(startIndex, nextTaskStart);
      const translatedChunk = await translateBulk(chunk, sourceLang, targetLang, rules, glossary);
      for (let j = 0; j < translatedChunk.length; j++) {
        translatedUnique[startIndex + j] = translatedChunk[j];
      }
      completedStrings += chunk.length;
      if (onProgress) onProgress(Math.floor((completedStrings / uniqueStrings.length) * 100));
    };

    for (let i = 0; i < tasks.length; i += concurrencyLimit) {
      const currentTasks = tasks.slice(i, i + concurrencyLimit);
      await Promise.all(currentTasks.map(processBatch));
    }
    if (onProgress) onProgress(100);

    const transMap = new Map();
    uniqueStrings.forEach((s, idx) => {
      const translated = translatedUnique[idx] || s;
      const sanitized = translated.replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '');
      transMap.set(s, sanitized);
    });

    for (const [path, xml] of xmlMap.entries()) {
      // Use different regex based on file type
      const tag = path.includes('drawings') ? 'a:t' : 't';
      const regex = new RegExp(`<${tag}([^>]*)>(.*?)</${tag}>`, 'gs');
      
      const newXml = xml.replace(regex, (fullMatch, attrs, p2) => {
        if (p2 && p2.trim().length > 0 && transMap.has(p2)) {
          const translatedText = transMap.get(p2);
          const escaped = translatedText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
          return `<${tag}${attrs}>${escaped}</${tag}>`;
        }
        return fullMatch;
      });
      zip.file(path, newXml);
    }
  }

  const content = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 }
  });
  return content;
}

