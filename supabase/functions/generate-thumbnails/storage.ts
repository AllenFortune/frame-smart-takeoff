
import { ThumbnailResult } from './types.ts';

export const ensureBucketExists = async (supabaseClient: any): Promise<void> => {
  try {
    console.log('Ensuring plan-images bucket exists...');
    
    const { data: buckets, error: listError } = await supabaseClient.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw new Error(`Failed to list storage buckets: ${listError.message}`);
    }
    
    const bucketExists = buckets?.some((bucket: any) => bucket.name === 'plan-images');
    
    if (!bucketExists) {
      console.log('Creating plan-images bucket...');
      const { error: createError } = await supabaseClient.storage.createBucket('plan-images', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        throw new Error(`Failed to create storage bucket: ${createError.message}`);
      } else {
        console.log('Successfully created plan-images bucket');
      }
    } else {
      console.log('plan-images bucket already exists');
    }
  } catch (error) {
    console.error('Critical error managing storage bucket:', error);
    throw error;
  }
};

export const uploadMultiResolutionImages = async (
  supabaseClient: any,
  projectId: string,
  pageNo: number,
  thumbnails: { [key: string]: ThumbnailResult }
): Promise<{ [key: string]: string }> => {
  const urls: { [key: string]: string } = {};
  
  console.log(`Starting upload for page ${pageNo} with ${Object.keys(thumbnails).length} resolutions`);
  
  // Ensure bucket exists before uploading
  await ensureBucketExists(supabaseClient);
  
  for (const [resolution, thumbnail] of Object.entries(thumbnails)) {
    try {
      console.log(`Uploading ${resolution} for page ${pageNo}: ${thumbnail.data.length} bytes, ${thumbnail.dimensions.w}x${thumbnail.dimensions.h}`);
      
      // Validate image data
      if (!thumbnail.data || thumbnail.data.length === 0) {
        throw new Error(`Empty image data for ${resolution}`);
      }
      
      if (thumbnail.dimensions.w <= 0 || thumbnail.dimensions.h <= 0) {
        throw new Error(`Invalid dimensions for ${resolution}: ${thumbnail.dimensions.w}x${thumbnail.dimensions.h}`);
      }
      
      const imagePath = `${projectId}/${resolution}/page_${pageNo}.png`;
      console.log(`Upload path: ${imagePath}`);
      
      const { error: uploadError } = await supabaseClient.storage
        .from('plan-images')
        .upload(imagePath, thumbnail.data, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (uploadError) {
        console.error(`Upload error for ${resolution}:`, uploadError);
        throw new Error(`Upload failed for ${resolution}: ${uploadError.message}`);
      }
      
      // Get public URL
      const { data: publicUrlData } = supabaseClient.storage
        .from('plan-images')
        .getPublicUrl(imagePath);
      
      if (publicUrlData?.publicUrl) {
        urls[resolution] = publicUrlData.publicUrl;
        console.log(`Successfully uploaded ${resolution}: ${publicUrlData.publicUrl}`);
      } else {
        throw new Error(`Failed to get public URL for ${resolution}`);
      }
    } catch (error) {
      console.error(`Error uploading ${resolution} for page ${pageNo}:`, error);
      // Don't fail the entire process for one resolution
    }
  }
  
  console.log(`Upload completed for page ${pageNo}. Generated ${Object.keys(urls).length} URLs`);
  return urls;
};
