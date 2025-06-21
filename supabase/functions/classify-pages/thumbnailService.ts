
import type { ThumbnailGenerationResult } from './types.ts';

export class ThumbnailService {
  private supabaseUrl: string;

  constructor() {
    this.supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  }

  async generateThumbnails(projectId: string, pdfUrl: string): Promise<ThumbnailGenerationResult> {
    try {
      console.log('Calling thumbnail generation service...');
      
      const response = await fetch(`${this.supabaseUrl}/functions/v1/generate-thumbnails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({ 
          projectId: projectId, 
          pdfUrl: pdfUrl 
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Thumbnail generation failed:', result);
        return { success: false, error: result };
      }

      console.log('Thumbnail generation completed:', result.message);
      return { success: true, data: result };
    } catch (error) {
      console.error('Error calling thumbnail service:', error);
      return { success: false, error: error.message };
    }
  }
}
