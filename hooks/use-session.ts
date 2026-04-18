'use client';

import { useState, useEffect } from 'react';

const SESSION_KEY = 'flowzone_session_id';

/**
 * Hook to manage anonymous user session for favorites
 */
export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Get or create session ID
    let id = localStorage.getItem(SESSION_KEY);
    
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    
    setSessionId(id);
  }, []);

  const resetSession = () => {
    const newId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, newId);
    setSessionId(newId);
  };

  return {
    sessionId,
    isReady: sessionId !== null,
    resetSession,
  };
}
