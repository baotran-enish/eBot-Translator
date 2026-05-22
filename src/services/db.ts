import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TranslatorDB extends DBSchema {
  history: {
    key: string;
    value: {
      id: string;
      sourceText: string;
      translatedText: string;
      sourceLang: string;
      targetLang: string;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
  glossary: {
    key: string;
    value: {
      id: string;
      term: string;
      translation: string;
      note?: string;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
  settings: {
    key: string;
    value: {
      id: string;
      value: any;
    };
  };
  chat_sessions: {
    key: string;
    value: {
      id: string;
      title: string;
      messages: Array<{
        role: 'user' | 'model';
        text: string;
      }>;
      timestamp: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<TranslatorDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TranslatorDB>('translator-db', 3, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const historyStore = db.createObjectStore('history', {
            keyPath: 'id',
          });
          historyStore.createIndex('by-timestamp', 'timestamp');
        }
        if (oldVersion < 2) {
          const glossaryStore = db.createObjectStore('glossary', {
            keyPath: 'id',
          });
          glossaryStore.createIndex('by-timestamp', 'timestamp');
          db.createObjectStore('settings', {
            keyPath: 'id',
          });
        }
        if (oldVersion < 3) {
          const chatSessionStore = db.createObjectStore('chat_sessions', {
            keyPath: 'id',
          });
          chatSessionStore.createIndex('by-timestamp', 'timestamp');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveToHistory(item: Omit<TranslatorDB['history']['value'], 'id' | 'timestamp'>) {
  const db = await getDB();
  const id = crypto.randomUUID();
  const timestamp = Date.now();
  await db.put('history', { ...item, id, timestamp });
  return id;
}

export async function getHistory() {
  const db = await getDB();
  return db.getAllFromIndex('history', 'by-timestamp');
}

export async function deleteFromHistory(id: string) {
  const db = await getDB();
  await db.delete('history', id);
}

export async function clearHistory() {
  const db = await getDB();
  await db.clear('history');
}

// Glossary
export async function saveTerm(term: string, translation: string, note?: string) {
  const db = await getDB();
  const id = crypto.randomUUID();
  const timestamp = Date.now();
  await db.put('glossary', { id, term, translation, note, timestamp });
  return id;
}

export async function getGlossary() {
  const db = await getDB();
  return db.getAllFromIndex('glossary', 'by-timestamp');
}

export async function deleteTerm(id: string) {
  const db = await getDB();
  await db.delete('glossary', id);
}

export async function updateGlossary(terms: Omit<TranslatorDB['glossary']['value'], 'id' | 'timestamp'>[]) {
  const db = await getDB();
  const tx = db.transaction('glossary', 'readwrite');
  await tx.store.clear();
  for (const item of terms) {
    await tx.store.put({
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    });
  }
  await tx.done;
}

// Settings
export async function saveSetting(id: string, value: any) {
  const db = await getDB();
  await db.put('settings', { id, value });
}

export async function getSetting(id: string) {
  const db = await getDB();
  const item = await db.get('settings', id);
  return item?.value;
}

// Chat Sessions
export async function saveChatSession(session: {
  id: string;
  title: string;
  messages: Array<{ role: 'user' | 'model'; text: string }>;
  timestamp: number;
}) {
  const db = await getDB();
  await db.put('chat_sessions', session);
}

export async function getChatSessions() {
  const db = await getDB();
  return db.getAllFromIndex('chat_sessions', 'by-timestamp');
}

export async function getChatSession(id: string) {
  const db = await getDB();
  return db.get('chat_sessions', id);
}

export async function deleteChatSession(id: string) {
  const db = await getDB();
  await db.delete('chat_sessions', id);
}

