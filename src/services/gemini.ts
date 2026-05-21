import { GoogleGenAI } from "@google/genai";

function getGeminiClient() {
  const apiKey = localStorage.getItem('gemini_api_key') || process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
}

export interface GlossaryItem {
  term: string;
  translation: string;
  note?: string;
}

export async function translateText(text: string, sourceLang: string, targetLang: string, rules?: string, glossary?: GlossaryItem[]) {
  if (!text.trim()) return "";

  const sourceLangName = sourceLang === 'ja' ? 'Japanese' : 'Vietnamese';
  const targetLangName = targetLang === 'ja' ? 'Japanese' : 'Vietnamese';
  
  const glossaryString = glossary?.length 
    ? `\n\nUse the following specialized terms (Glossary):\n${glossary.map(g => `- ${g.term}: ${g.translation}${g.note ? ` (${g.note})` : ''}`).join('\n')}`
    : '';
    
  const ruleContext = rules && rules.trim() ? `\n\nAdhere to the following rules and context:\n${rules}\n` : '';

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Translate the following text from ${sourceLangName} to ${targetLangName}. 
CRITICAL: Preserve the original structure, line breaks, and paragraph organization.

TEXT TO TRANSLATE:
"${text}"
${glossaryString}
${ruleContext}
Return ONLY the translated text. Do NOT include any explanations or notes.`,
      config: {
        temperature: 0.3,
      }
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate. Please check your connection or API key.");
  }
}

export async function translateBulk(texts: string[], sourceLang: string, targetLang: string, rules?: string, glossary?: GlossaryItem[]) {
  if (texts.length === 0) return [];
  
  const sourceLangName = sourceLang === 'ja' ? 'Japanese' : 'Vietnamese';
  const targetLangName = targetLang === 'ja' ? 'Japanese' : 'Vietnamese';
  const DELIMITER = "||||---TRANSLATION-DELIMITER---||||";
  
  const decode = (str: string) => str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  const joined = texts.map(t => decode(t)).join(DELIMITER);
  
  const glossaryString = glossary?.length 
    ? `\n\nUse the following specialized terms (Glossary):\n${glossary.map(g => `- ${g.term}: ${g.translation}${g.note ? ` (${g.note})` : ''}`).join('\n')}`
    : '';
    
  const ruleContext = rules && rules.trim() ? `\n\nAdhere to the following rules and context:\n${rules}\n` : '';

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Translate the following list of Japanese text segments to Vietnamese.
The segments are separated by the delimiter "${DELIMITER}".

CRITICAL TRANSLATION GUIDELINES: 
1. These are fragments from a Japanese Resume/CV. 
2. BEWARE OF SPLIT WORDS: Characters like "ベ", "ト", "ナ", "ム" result from Word document splitting. You MUST recognize them as "ベトナム" and translate as "Việt Nam".
3. TRUNCATED LABELS: Single characters like "中" (Withdrawal), "入" (Enrollment), "卒" (Graduation), "退" (Resignation) MUST be translated fully to their Vietnamese Resume equivalent.
4. ABSOLUTELY NO JAPANESE: Do not leave any Kanji, Hiragana, or Katakana in the output. Translate EVERYTHING.
5. NO DUPLICATION: Do not repeat the translation or include the original text in the output.
6. EXACT COUNT: You MUST return exactly ${texts.length} translated segments, separated by "${DELIMITER}".

${glossaryString}
${ruleContext}
LIST TO TRANSLATE:
${joined}`,
      config: {
        temperature: 0,
      }
    });

    const translated = response.text?.trim() || "";
    let parts = translated.split(DELIMITER);
    
    // Cleanup 
    parts = parts.map(p => p.trim());

    // Check for remaining Japanese characters in the output
    const japaneseRegex = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/;
    
    let hasJapanese = parts.some(p => japaneseRegex.test(p));
    let attempts = 0;

    // Iterative repair for untranslated segments
    while (hasJapanese && attempts < 2) {
      attempts++;
      console.warn(`Repair attempt ${attempts}: Japanese characters found in bulk translation.`);
      
      const repairIndices = parts.reduce((acc, p, i) => {
        if (japaneseRegex.test(p)) acc.push(i);
        return acc;
      }, [] as number[]);

      if (repairIndices.length > 0) {
        // Repair individual items that still have Japanese
        const repaired = await Promise.all(repairIndices.map(async (idx) => {
            const original = texts[idx];
            const ai = getGeminiClient();
            const result = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: `Translate this Japanese fragment to Vietnamese. 
Context: Japanese Resume. 
Segment: "${original}"
Output ONLY the Vietnamese translation. NO Japanese allowed.`,
              config: { temperature: 0.1 }
            });
            return result.text?.trim() || original;
        }));

        repairIndices.forEach((idx, i) => {
          parts[idx] = repaired[i];
        });
      }
      
      hasJapanese = parts.some(p => japaneseRegex.test(p));
    }
    
    // Final normalization
    parts = parts.map(p => p.normalize('NFKC'));

    if (parts.length !== texts.length) {
      console.error(`Mismatch: expected ${texts.length}, got ${parts.length}. Retrying individually for this batch.`);
      // If bulk fails length-wise, process individually as last resort
      return await Promise.all(texts.map(t => translateText(t, sourceLang, targetLang, rules)));
    }
    return parts;
  } catch (error) {
    console.error("Bulk Translation error:", error);
    return texts;
  }
}
export async function detectLanguage(text: string) {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Detect if the following text is Japanese or Vietnamese. Return only the language code 'ja' or 'vi'. If unsure, pick the most likely one.
      
"${text}"`,
    });

    const lang = response.text?.trim().toLowerCase();
    return lang === 'ja' || lang === 'vi' ? lang : 'ja';
  } catch (error) {
    return 'ja';
  }
}

export async function translateDocument(fileBase64: string, mimeType: string, sourceLang: string, targetLang: string, rules?: string, glossary?: GlossaryItem[]) {
  const sourceLangName = sourceLang === 'ja' ? 'Japanese' : 'Vietnamese';
  const targetLangName = targetLang === 'ja' ? 'Japanese' : 'Vietnamese';
  
  const glossaryString = glossary?.length 
    ? `\n\nUse the following specialized terms (Glossary):\n${glossary.map(g => `- ${g.term}: ${g.translation}${g.note ? ` (${g.note})` : ''}`).join('\n')}`
    : '';

  const ruleContext = rules && rules.trim() ? `\n\nAdhere to the following rules and context:\n${rules}\n` : '';

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: fileBase64,
          },
        },
        {
          text: `Translate the content of this document from ${sourceLangName} to ${targetLangName}. 
          Return ONLY the translated content in a clean Markdown format. 
          Do NOT include any external notes, explanations, or meta-commentary about the translation.
          Preserve the structure, headings, and formatting as much as possible.
          If it's a spreadsheet or table, use Markdown tables.
          ${glossaryString}
          ${ruleContext}`,
        },
      ],
      config: {
        temperature: 0.2,
      }
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Document translation error:", error);
    throw new Error("Failed to translate document. It might be too large or complex.");
  }
}

export function createDictionaryChat(rules?: string, glossary?: GlossaryItem[]) {
  const glossaryString = glossary?.length 
    ? `\n\nUse the following specialized terms (Glossary):\n${glossary.map(g => `- ${g.term}: ${g.translation}${g.note ? ` (${g.note})` : ''}`).join('\n')}`
    : '';

  const ruleContext = rules && rules.trim() ? `\n\nAdditional rules and context:\n${rules}` : '';
  
  const ai = getGeminiClient();
  return ai.chats.create({
    model: "gemini-3.5-flash",
    config: {
      systemInstruction: `You are a professional dictionary and language assistant specializing in Japanese and Vietnamese.
Your primary role is to assist with sentence writing, translation, and general language Q&A.
When analyzing sample sentences, you MUST analyze the context and social hierarchy (formality level, honorifics, "vai vế") and provide responses that are consistent with that context.
When translating or rephrasing multi-line text, you MUST preserve the original structure and line breaks of the input.
BY DEFAULT, keep your responses concise and focused on the translation or sentence requested.
ONLY provide detailed grammatical analysis, word definitions, or parts of speech (nouns, verbs, adjectives, adverbs) when the user specifically asks for an explanation or linguistic breakdown.
Help the user express themselves naturally in the target language.
You should also consider the user's specific project rules and context if provided.
Current project context: Japan Anime Game localization.${glossaryString}${ruleContext}
Always provide the English specialized terms if requested or relevant to the Japan Anime Game context.`,
    },
  });
}
