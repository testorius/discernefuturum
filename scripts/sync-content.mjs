import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';

function initializeGoogleDrive() {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}

async function downloadAssetFolder(drive, folderId) {
  try {
    const assetsDir = 'dist/discernefuturum/images';
    console.log(`Creating directory: ${assetsDir}`);
    await fs.mkdir(assetsDir, { recursive: true });

    const response = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name, mimeType)',
    });

    console.log(`Found ${response.data.files.length} files in Drive folder`);

    for (const file of response.data.files) {
      const destPath = path.join(assetsDir, file.name);
      console.log(`Downloading ${file.name}...`);
      
      const res = await drive.files.get(
        { fileId: file.id, alt: 'media' },
        { responseType: 'stream' }
      );

      await new Promise((resolve, reject) => {
        const writeStream = createWriteStream(destPath);
        res.data
          .pipe(writeStream)
          .on('finish', () => {
            console.log(`Successfully downloaded ${file.name}`);
            resolve();
          })
          .on('error', (error) => {
            console.error(`Error downloading ${file.name}:`, error);
            reject(error);
          });
      });
    }
  } catch (error) {
    console.error('Error downloading assets:', error);
    throw error;
  }
}

function extractSection(content, sectionTitle) {
  console.log(`Looking for section: ${sectionTitle}`);
  
  if (sectionTitle === 'Services') {
    const startMatch = content.match(/\n## Service 1:/);
    if (!startMatch) {
      console.log('No services section found');
      return '';
    }
    
    const startIndex = startMatch.index;
    const sectionContent = content.slice(startIndex).split('\n\n\n')[0];
    
    console.log(`Found section "${sectionTitle}":`);
    console.log(sectionContent);
    return sectionContent;
  }
  
  const sectionRegex = new RegExp(`# ${sectionTitle}([^#]*?)(?=# |$)`, 's');
  const match = content.match(sectionRegex);
  
  if (!match) {
    console.log(`Section "${sectionTitle}" not found`);
    return '';
  }
  
  return match[1].trim();
}

function extractListItems(content) {
  return content
    .split('\n')
    .filter(line => line.startsWith('•'))
    .map(line => line.replace('•', '').trim());
}

function processHeroSection(content) {
  const heroSection = extractSection(content, 'Hero Section');
  const lines = heroSection.split('\n');
  
  return {
    uptitle: lines.find(l => l.startsWith('Small Title Above:'))?.split(':')[1]?.trim() || '',
    title: lines.find(l => l.startsWith('Main Heading:'))?.split(':')[1]?.trim() || '',
    subtitle: lines.find(l => l.startsWith('Subheading:'))?.split(':')[1]?.trim() || '',
    valueProps: extractListItems(heroSection),
    cta: {
      primary: {
        text: "Let's Talk",
        link: "#contact"
      },
      secondary: {
        text: "Learn More",
        link: "#services"
      }
    }
  };
}

function processSEOSection(content) {
  const seoSection = extractSection(content, 'SEO Information');
  const lines = seoSection.split('\n');
  
  return {
    title: lines.find(l => l.startsWith('Page Title:'))?.split(':')[1]?.trim() || '',
    description: lines.find(l => l.startsWith('Meta Description:'))?.split(':')[1]?.trim() || '',
    siteName: lines.find(l => l.startsWith('Website Name:'))?.split(':')[1]?.trim() || ''
  };
}

function processImagesSection(content) {
  const imagesSection = extractSection(content, 'Images');
  const lines = imagesSection.split('\n');
  
  const filename = lines.find(l => l.startsWith('Profile Image:'))?.split(':')[1]?.trim() || '';
  const alt = lines.find(l => l.startsWith('Alt Text:'))?.split(':')[1]?.trim() || '';
  
  return {
    profile: {
      url: `/discernefuturum/images/${filename}`,
      filename,
      alt,
      width: 1200,
      height: 630,
      type: 'image/webp'
    }
  };
}

function processServicesSection(content) {
  const servicesSection = extractSection(content, 'Services');
  const services = [];
  
  // Split into individual service blocks
  const serviceBlocks = servicesSection.split(/(?=\n## Service \d+:)/).filter(block => block.trim());
  
  console.log(`Found ${serviceBlocks.length} service blocks`);
  
  serviceBlocks.forEach((block, index) => {
    console.log(`\nProcessing service block ${index + 1}:`, block);
    
    // Extract service information using specific patterns
    const nameMatch = block.match(/## Service \d+: (.+?)(?:\n|$)/);
    const categoryMatch = block.match(/Category: (.+?)(?:\n|$)/);
    const descriptionMatch = block.match(/Description: (.+?)(?:\n|$)/);
    const imageMatch = block.match(/Image: (.+?)(?:\n|$)/);
    
    if (nameMatch) {
      const service = {
        name: nameMatch[1].trim(),
        category: categoryMatch ? categoryMatch[1].trim() : '',
        description: descriptionMatch ? descriptionMatch[1].trim() : '',
        icon: imageMatch ? {
          url: `/discernefuturum/images/${imageMatch[1].trim()}`,
          alt: `${nameMatch[1].trim()} icon`
        } : null
      };
      
      if (service.name && service.category && service.description && service.icon) {
        console.log('Processed service:', service);
        services.push(service);
      } else {
        console.log('Skipping incomplete service:', service);
      }
    }
  });

  console.log(`Processed ${services.length} services:`, services);
  return services;
}

async function processDocument(doc) {
  console.log("Processing document content...");
  
  const assetLocationMatch = doc.match(/# Asset Location: (.+)/);
  const assetFolderId = assetLocationMatch ? assetLocationMatch[1].trim() : null;

  // Process services first and store the result
  const processedServices = processServicesSection(doc);
  console.log("Processed services:", processedServices);

  if (assetFolderId) {
    const drive = initializeGoogleDrive();
    await downloadAssetFolder(drive, assetFolderId);
  }

  const content = {
    hero: processHeroSection(doc),
    seo: processSEOSection(doc),
    services: processedServices, // Use the processed services
    images: processImagesSection(doc),
    jsonLd: {
      founder: {
        name: "Alexander Paul",
        jobTitle: "SEO Freelancer & Growth Consultant",
        description: "Digital Marketing Expert with focus on SEO, Analytics and Growth",
        knowsAbout: [
          "SEO",
          "Digital Analytics",
          "Growth Marketing",
          "Paid Advertising"
        ]
      },
      address: {
        streetAddress: "Hardturmstrasse 161",
        addressLocality: "Zürich",
        postalCode: "8005",
        addressRegion: "ZH",
        addressCountry: "CH"
      },
      contact: {
        email: "alex@discernefuturum.com"
      },
      social: {
        linkedin: "https://www.linkedin.com/in/alexander-paul/"
      }
    }
  };

  // Verify the content before writing
  console.log("Final content to be written:", JSON.stringify(content, null, 2));

  return content;
}

async function main() {
  try {
    console.log('Starting content sync process...');
    
    const drive = initializeGoogleDrive();
    console.log('Google Drive initialized');

    const response = await drive.files.export({
      fileId: process.env.GOOGLE_DOC_ID,
      mimeType: 'text/plain',
    });
    console.log('Document exported from Google Drive');

    const content = await processDocument(response.data);
    console.log('Document processed, services count:', content.services.length);

    await fs.mkdir('src/content/home', { recursive: true });
    
    const jsonContent = JSON.stringify(content, null, 2);
    await fs.writeFile('src/content/home/homepage.json', jsonContent);

    // Verify the file was written correctly
    const writtenContent = await fs.readFile('src/content/home/homepage.json', 'utf-8');
    const parsedContent = JSON.parse(writtenContent);
    console.log('Verification - Services in homepage.json:', {
      servicesCount: parsedContent.services?.length || 0,
      firstService: parsedContent.services?.[0]
    });

    console.log('Content written to homepage.json');
    console.log('Content sync completed successfully!');
  } catch (error) {
    console.error('Error syncing content:', error);
    throw error;
  }
}

main();