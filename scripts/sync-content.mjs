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
  
  const sections = content.split(/(?=# )/);
  
  const section = sections.find(s => s.trim().startsWith(`# ${sectionTitle}`));
  
  if (!section) {
    console.log(`Section "${sectionTitle}" not found`);
    return '';
  }
  
  const sectionContent = section
    .replace(`# ${sectionTitle}`, '')
    .trim();
    
  console.log(`Found section "${sectionTitle}":`);
  console.log(sectionContent);
  
  return sectionContent;
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
  let currentService = null;

  const serviceBlocks = servicesSection.split(/(?=## Service)/);
  
  serviceBlocks.forEach(block => {
    if (!block.trim()) return;
    
    console.log('Processing service block:', block);
    
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    
    const nameMatch = lines[0].match(/## Service \d+: (.+)/);
    if (nameMatch) {
      currentService = {
        name: nameMatch[1].trim()
      };
      
      lines.slice(1).forEach(line => {
        if (line.startsWith('Category:')) {
          currentService.category = line.split(':')[1].trim();
        } else if (line.startsWith('Description:')) {
          currentService.description = line.split(':')[1].trim();
        } else if (line.startsWith('Image:')) {
          const filename = line.split(':')[1].trim();
          currentService.icon = {
            url: `/discernefuturum/images/${filename}`,
            alt: `${currentService.name} icon`
          };
        }
      });
      
      console.log('Processed service:', currentService);
      services.push(currentService);
    }
  });

  console.log('Final services array:', services);
  return services;
}

async function processDocument(doc) {
  const assetLocationMatch = doc.match(/# Asset Location: (.+)/);
  const assetFolderId = assetLocationMatch ? assetLocationMatch[1].trim() : null;

  if (assetFolderId) {
    const drive = initializeGoogleDrive();
    await downloadAssetFolder(drive, assetFolderId);
  }

  return {
    hero: processHeroSection(doc),
    seo: processSEOSection(doc),
    services: processServicesSection(doc),
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
}

async function main() {
  try {
    console.log('Checking environment variables:');
    console.log('GOOGLE_DOC_ID exists:', !!process.env.GOOGLE_DOC_ID);
    console.log('GOOGLE_CREDENTIALS exists:', !!process.env.GOOGLE_CREDENTIALS);

    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    console.log('Credentials parsed successfully');

    const drive = initializeGoogleDrive();

    const response = await drive.files.export({
      fileId: process.env.GOOGLE_DOC_ID,
      mimeType: 'text/plain',
    });

    const content = await processDocument(response.data);

    await fs.mkdir('src/content/home', { recursive: true });

    await fs.writeFile(
      'src/content/home/homepage.json',
      JSON.stringify(content, null, 2)
    );

    console.log('Content synced successfully!');
  } catch (error) {
    console.error('Error syncing content:', error);
    throw error;
  }
}

main();