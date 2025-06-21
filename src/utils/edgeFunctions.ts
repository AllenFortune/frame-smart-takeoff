
const SUPABASE_URL = "https://erfbmgcxpmtnmkffqsac.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZmJtZ2N4cG10bm1rZmZxc2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0Njg4MDksImV4cCI6MjA2NjA0NDgwOX0.PWwKx_XIBMrELZJhVg96PwgnNRT6xnoAjOftyYR4g54";

export const classifyPages = async (projectId: string, pdfUrl: string) => {
  console.log(`Calling classify-pages function with projectId: ${projectId}, pdfUrl: ${pdfUrl}`);
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/classify-pages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ projectId, pdfUrl })
  });

  console.log(`classify-pages response status: ${response.status}`);
  
  const result = await response.json();
  console.log('classify-pages response:', result);

  if (!response.ok) {
    console.error('classify-pages failed:', result);
    // Return the error details so they can be handled properly
    return result;
  }

  return result;
};

export const generateThumbnails = async (projectId: string, pdfUrl: string, pageIds?: string[]) => {
  console.log(`Calling generate-thumbnails function with projectId: ${projectId}, pdfUrl: ${pdfUrl}`);
  
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-thumbnails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ projectId, pdfUrl, pageIds })
  });

  console.log(`generate-thumbnails response status: ${response.status}`);
  
  const result = await response.json();
  console.log('generate-thumbnails response:', result);

  if (!response.ok) {
    console.error('generate-thumbnails failed:', result);
    throw new Error(result.message || 'Failed to generate thumbnails');
  }

  return result;
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
    const errorResult = await response.json();
    throw new Error(errorResult.message || 'Failed to extract summary');
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
    const errorResult = await response.json();
    throw new Error(errorResult.message || 'Failed to generate overlay');
  }

  return response.json();
};
