
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateEnvironment, validatePdfSize } from './validation.ts';
import { JobManager } from './jobManager.ts';
import { PdfProcessor } from './pdfProcessor.ts';
import { ThumbnailService } from './thumbnailService.ts';
import { DatabaseManager } from './database.ts';
import { createErrorResponse, createSuccessResponse, corsHeaders } from './errorHandlers.ts';

// Validate environment variables on startup
validateEnvironment();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { projectId, pdfUrl } = await req.json();
    
    console.log(`Processing PDF classification for project ${projectId}`);
    console.log(`PDF URL: ${pdfUrl}`);
    
    // Initialize managers
    const jobManager = new JobManager();
    const pdfProcessor = new PdfProcessor();
    const thumbnailService = new ThumbnailService();
    const databaseManager = new DatabaseManager();

    // Create job for tracking
    const jobData = await jobManager.createJob(projectId);
    console.log('Created job:', jobData.id);

    try {
      // Update job progress - downloading PDF
      await jobManager.updateJobProgress(jobData.id, 25, 'Downloading PDF');

      // Download PDF with error handling
      let pdfArrayBuffer;
      try {
        pdfArrayBuffer = await pdfProcessor.downloadPdf(pdfUrl);
      } catch (error) {
        await jobManager.markJobFailed(jobData.id, `Failed to download PDF: ${error.message}`);
        return createErrorResponse(
          'pdf_download_failed',
          'Failed to download PDF from provided URL',
          'Check if the PDF URL is accessible and not expired'
        );
      }
      
      // Check PDF size limit
      if (!validatePdfSize(pdfArrayBuffer)) {
        await jobManager.markJobFailed(jobData.id, 'PDF file exceeds 50MB size limit');
        return createErrorResponse(
          'pdf_too_large',
          'File exceeds 50 MB.',
          'Please split the plan into smaller files'
        );
      }

      // Update job progress - extracting pages
      await jobManager.updateJobProgress(jobData.id, 40, 'Extracting pages from PDF');

      const extractedPages = await pdfProcessor.extractPages(pdfArrayBuffer);

      // Update job progress - cleaning up existing pages
      await jobManager.updateJobProgress(jobData.id, 50, 'Classifying pages');

      // Clean up existing pages and insert new ones
      await databaseManager.cleanupExistingPages(projectId);

      // Update job progress - saving to database
      await jobManager.updateJobProgress(jobData.id, 70, 'Saving page data to database');

      let data;
      try {
        data = await databaseManager.insertPages(projectId, extractedPages);
      } catch (error) {
        await jobManager.markJobFailed(jobData.id, `Database insert failed: ${error.message}`);
        return createErrorResponse(
          'database_insert_failed',
          'Failed to save page data to database',
          'Check database permissions and table schema'
        );
      }

      // Update job progress - generating thumbnails
      await jobManager.updateJobProgress(jobData.id, 80, 'Generating enhanced thumbnails');

      // Generate thumbnails
      const thumbnailResult = await thumbnailService.generateThumbnails(projectId, pdfUrl);
      
      let thumbnailMessage = '';
      if (thumbnailResult.success) {
        if (thumbnailResult.data.fromCache) {
          thumbnailMessage = ' Used cached high-quality thumbnails.';
        } else {
          thumbnailMessage = ` Generated ${thumbnailResult.data.results?.length || 0} high-quality thumbnails.`;
        }
      } else {
        thumbnailMessage = ' Thumbnail generation failed, using fallback images.';
        console.error('Thumbnail generation failed:', thumbnailResult.error);
      }

      // Mark job as completed
      const resultData = { 
        pages_created: data.length,
        project_id: projectId,
        total_pages: extractedPages.length,
        thumbnail_generation: thumbnailResult.success ? 'success' : 'failed',
        thumbnail_details: thumbnailResult.data
      };

      await jobManager.markJobCompleted(jobData.id, resultData);

      const responseMessage = `Successfully classified ${extractedPages.length} pages.${thumbnailMessage}`;
      console.log(`Successfully classified ${extractedPages.length} pages for project ${projectId}`);

      return createSuccessResponse({ 
        success: true, 
        pages: data,
        jobId: jobData.id,
        message: responseMessage,
        thumbnailGeneration: thumbnailResult.success,
        enhancedThumbnails: true
      });

    } catch (error) {
      await jobManager.markJobFailed(jobData.id, `Processing failed: ${error.message}`);
      throw error;
    }

  } catch (error) {
    console.error('Error in classify-pages:', error);
    return createErrorResponse(
      'internal_error',
      'An unexpected error occurred during PDF processing',
      'Check edge function logs for more details',
      500
    );
  }
});
