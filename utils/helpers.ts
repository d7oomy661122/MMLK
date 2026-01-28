
export const getErrorMessage = (error: any, fallback: string) => {
  if (!error) return fallback;
  const message = String(error instanceof Error ? error.message : (typeof error === 'string' ? error : ''));
  if (message.includes('Failed to fetch')) {
      return "تعذر الاتصال بالخادم. يرجى التحقق من الإنترنت.";
  }
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object') {
     const msg = error.message || error.error_description || error.details || error.hint;
     if (typeof msg === 'string') return msg;
     try { return JSON.stringify(error); } catch (e) { return "Unknown Error Object"; }
  }
  return String(error) || fallback;
};

// Strict Helper: level is number
export const getVipLabel = (level: number | undefined | null) => {
    if (level === undefined || level === null) return "Intern";
    
    // Level 0 is Intern
    if (level === 0) return "Intern";
    
    // Any other number is VIP X
    return `VIP ${level}`;
};
