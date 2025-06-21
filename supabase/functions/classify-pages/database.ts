
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ExtractedPage } from './types.ts';

export class DatabaseManager {
  private supabase;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async cleanupExistingPages(projectId: string): Promise<void> {
    console.log('Cleaning up existing pages for project:', projectId);
    const { error: deleteError } = await this.supabase
      .from('plan_pages')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) {
      console.error('Error cleaning up existing pages:', deleteError);
      // Continue anyway - this is not critical
    }
  }

  async insertPages(projectId: string, extractedPages: ExtractedPage[]): Promise<any[]> {
    console.log(`Inserting ${extractedPages.length} pages into database`);

    const { data, error } = await this.supabase
      .from('plan_pages')
      .insert(extractedPages.map(page => ({
        project_id: projectId,
        ...page
      })))
      .select();

    if (error) {
      console.error('Error inserting pages:', error);
      throw new Error(`Database insert failed: ${error.message}`);
    }

    console.log(`Successfully inserted ${data.length} pages`);
    return data;
  }
}
