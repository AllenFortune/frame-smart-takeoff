
const SUPABASE_URL = "https://erfbmgcxpmtnmkffqsac.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZmJtZ2N4cG10bm1rZmZxc2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0Njg4MDksImV4cCI6MjA2NjA0NDgwOX0.PWwKx_XIBMrELZJhVg96PwgnNRT6xnoAjOftyYR4g54";

export const classifyPages = async (projectId: string, pdfUrl: string) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/classify-pages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ projectId, pdfUrl })
  });

  if (!response.ok) {
    throw new Error('Failed to classify pages');
  }

  return response.json();
};

export const extractSummary = async (projectId: string, pageIds: string[]) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ projectId, pageIds })
  });

  if (!response.ok) {
    throw new Error('Failed to extract summary');
  }

  return response.json();
};

export const generateOverlay = async (pageId: string, step: string) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-overlay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ pageId, step })
  });

  if (!response.ok) {
    throw new Error('Failed to generate overlay');
  }

  return response.json();
};
