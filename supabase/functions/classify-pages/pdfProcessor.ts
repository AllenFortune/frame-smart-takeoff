
import type { ExtractedPage } from './types.ts';

export class PdfProcessor {
  async downloadPdf(pdfUrl: string): Promise<ArrayBuffer> {
    console.log('Downloading PDF from:', pdfUrl);
    
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      console.error(`PDF download failed: HTTP ${pdfResponse.status}: ${pdfResponse.statusText}`);
      throw new Error(`HTTP ${pdfResponse.status}: ${pdfResponse.statusText}`);
    }
    
    console.log('PDF download successful, response status:', pdfResponse.status);
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    console.log('Downloaded PDF, size:', pdfArrayBuffer.byteLength, 'bytes');
    
    return pdfArrayBuffer;
  }

  async extractPages(pdfArrayBuffer: ArrayBuffer): Promise<ExtractedPage[]> {
    const { PDFDocument } = await import('https://cdn.skypack.dev/pdf-lib@^1.17.1');
    
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const numPages = pdfDoc.getPageCount();
    console.log(`PDF has ${numPages} pages`);
    
    const extractedPages: ExtractedPage[] = [];

    // Create page records with classifications (without thumbnails initially)
    for (let pageNo = 1; pageNo <= numPages; pageNo++) {
      console.log(`Classifying page ${pageNo}/${numPages}`);

      // Simulate AI classification with realistic classes and confidence scores
      const pageClasses = ['floor_plan', 'wall_section', 'roof_plan', 'foundation_plan', 'electrical_plan', 'structural_plan', 'site_plan'];
      const randomClass = pageClasses[Math.floor(Math.random() * pageClasses.length)];
      const confidence = 0.6 + Math.random() * 0.4; // 60-100% confidence

      extractedPages.push({
        page_no: pageNo,
        class: randomClass,
        confidence: confidence,
        // New multi-resolution URL fields will be populated by thumbnail service
        img_url: null, // Will be set to preview_url for backward compatibility
        thumbnail_url: null,
        preview_url: null,
        full_url: null
      });
    }

    return extractedPages;
  }
}
