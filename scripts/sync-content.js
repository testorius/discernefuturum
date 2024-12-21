import { google } from '@google/docs-api';
import { drive } from '@google/drive-api';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

async function processImage(driveId, auth) {
  const driveService = google.drive({ version: 'v3', auth });
  
  // Get file metadata
  const file = await driveService.files.get({
    fileId: driveId,
    fields: 'webContentLink,thumbnailLink'
  });

  // Option 1: Use Google Drive direct link
  const directLink = file.data.webContentLink;
  
  // Option 2: Download and process image (recommended for optimization)
  const response = await driveService.files.get(
    { fileId: driveId, alt: 'media' },
    { responseType: 'stream' }
  );
  
  // Process with Sharp for optimization
  const imageBuffer = await streamToBuffer(response.data);
  const processedImage = await sharp(imageBuffer)
    .resize(1200, 630, { fit: 'inside' })
    .webp({ quality: 80 })
    .toBuffer();
  
  // Save to public folder
  const publicPath = join(process.cwd(), 'public/images/profile.webp');
  await writeFile(publicPath, processedImage);
  
  // Get dimensions
  const metadata = await sharp(processedImage).metadata();
  
  return {
    url: '/images/profile.webp', // Local path after processing
    width: metadata.width,
    height: metadata.height,
    driveId,
    shareableLink: directLink
  };
}

async function syncContent() {
  const auth = await google.auth.getClient({
    scopes: [
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/drive.readonly'
    ]
  });
  
  const docs = google.docs({ version: 'v1', auth });
  const content = await docs.documents.get({
    documentId: process.env.GOOGLE_DOC_ID
  });
  
  // Parse the document content
  const parsedContent = parseDocContent(content);
  
  // Process images from Google Drive
  const imageData = await processImage(parsedContent.images.profile.driveId, auth);
  
  // Update content with processed image data
  parsedContent.images.profile = imageData;
  
  // Save as JSON in content collection
  await writeFile(
    join(process.cwd(), 'src/content/homepage.json'),
    JSON.stringify(parsedContent, null, 2)
  );
}

// Helper function to convert stream to buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

syncContent().catch(console.error);