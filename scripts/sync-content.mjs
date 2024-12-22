import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';

// Initialize the Google Drive API client
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
    // Create assets directory if it doesn't exist
    const assetsDir = 'src/content/home/assets';
    await fs.mkdir(assetsDir, { recursive: true });

    // List all files in the Drive folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents`,
      fields: 'files(id, name, mimeType)',
    });

    // Download each file
    for (const file of response.data.files) {
      const destPath = path.join(assetsDir, file.name);
      console.log(`Downloading ${file.name}...`);
      
      const res = await drive.files.get(
        { fileId: file.id, alt: 'media' },
        { responseType: 'stream' }
      );

      await new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(destPath);
        res.data
          .pipe(writeStream)
          .on('finish', resolve)
          .on('error', reject);
      });
    }
  } catch (error) {
    console.error('Error downloading assets:', error);
    throw error;
  }
}

function extractSection(content, sectionTitle) {
  const regex = new RegExp(`# ${sectionTitle}\\s*([^#]*)`);
  const match = content.match(regex);
  return match ? match[1].trim() : '';
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
  
  return {
    profile: {
      filename: lines.find(l => l.startsWith('Profile Image:'))?.split(':')[1]?.trim() || '',
      alt: lines.find(l => l.startsWith('Alt Text:'))?.split(':')[1]?.trim() || '',
      width: 1200,  // Default values or extract from doc if specified
      height: 630,
      type: 'image/webp'
    }
  };
}

function processServicesSection(content) {
  const servicesSection = extractSection(content, 'Services');
  const services = [];
  let currentService = null;

  servicesSection.split('\n').forEach(line => {
    if (line.startsWith('## Service')) {
      if (currentService) services.push(currentService);
      currentService = {};
    } else if (currentService) {
      if (line.startsWith('Category:')) {
        currentService.category = line.split(':')[1].trim();
      } else if (line.startsWith('Description:')) {
        currentService.description = line.split(':')[1].trim();
      } else if (line.startsWith('Icon:')) {
        currentService.icon = {
          url: line.split(':')[1].trim(),
          alt: `${currentService.category} icon`
        };
      } else if (line.match(/^[^:]+:/)) {
        currentService.name = line.split(':')[0].trim();
      }
    }
  });
  
  if (currentService) services.push(currentService);
  return services;
}

async function processDocument(doc) {
  // Extract asset location
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
    // Verify environment variables
    console.log('Checking environment variables:');
    console.log('GOOGLE_DOC_ID exists:', !!process.env.GOOGLE_DOC_ID);
    console.log('GOOGLE_CREDENTIALS exists:', !!process.env.GOOGLE_CREDENTIALS);

    // Parse credentials
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    console.log('Credentials parsed successfully');

    // Initialize Google Drive client
    const drive = initializeGoogleDrive();

    // Fetch document content
    const response = await drive.files.export({
      fileId: process.env.GOOGLE_DOC_ID,
      mimeType: 'text/plain',
    });

    // Process document
    const content = await processDocument(response.data);

    // Ensure directory exists
    await fs.mkdir('src/content/home', { recursive: true });

    // Write processed content to file
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
function parseDocument(document) {
  const content = document.data;
  const elements = content.body.content;
  
  let currentSection = '';
  const parsedContent = {
    hero: {
      uptitle: '',
      title: '',
      subtitle: '',
      valueProps: [],
      cta: {
        primary: {
          text: '',
          link: ''
        },
        secondary: {
          text: '',
          link: ''
        }
      }
    },
    seo: {
      title: '',
      description: '',
      siteName: ''
    },
    services: [],
    images: {
      profile: {
        filename: '',
        width: 800,
        height: 600,
        alt: '',
        type: 'image/webp'
      }
    },
    jsonLd: {
      founder: {
        name: '',
        jobTitle: '',
        description: '',
        knowsAbout: []
      },
      address: {
        streetAddress: '',
        addressLocality: '',
        postalCode: '',
        addressRegion: '',
        addressCountry: ''
      },
      contact: {
        email: '',
        telephone: ''
      },
      social: {
        linkedin: '',
        website: ''
      }
    }
  };

  // Helper function to get text content
  function getTextContent(element) {
    return element.paragraph?.elements?.[0]?.textRun?.content?.trim() || '';
  }

  // Process each element
  for (const element of elements) {
    const text = getTextContent(element);

    // Skip empty lines
    if (!text) continue;

    // Check for section headers
    if (text.startsWith('# ')) {
      currentSection = text.replace('# ', '').toLowerCase();
      continue;
    }

    // Parse content based on current section
    switch (currentSection) {
      case 'seo information':
        if (text.startsWith('Page Title: ')) {
          parsedContent.seo.title = text.replace('Page Title: ', '');
        } else if (text.startsWith('Meta Description: ')) {
          parsedContent.seo.description = text.replace('Meta Description: ', '');
        } else if (text.startsWith('Website Name: ')) {
          parsedContent.seo.siteName = text.replace('Website Name: ', '');
        }
        break;

      case 'hero section':
        if (text.startsWith('Key Points:')) {
          currentSection = 'key_points';
        } else if (text.startsWith('Small Title Above: ')) {
          parsedContent.hero.uptitle = text.replace('Small Title Above: ', '');
        } else if (text.startsWith('Main Heading: ')) {
          parsedContent.hero.title = text.replace('Main Heading: ', '');
        } else if (text.startsWith('Subheading: ')) {
          parsedContent.hero.subtitle = text.replace('Subheading: ', '');
        }
        break;

      case 'key_points':
        if (text.startsWith('• ')) {
          parsedContent.hero.valueProps.push(text.replace('• ', ''));
        }
        break;

      case 'services':
        if (text.startsWith('## Service')) {
          const serviceName = text.replace('## Service ', '')
                                 .replace(':', ' -');  // Format cleanup
          parsedContent.services.push({
            name: serviceName,
            description: '',
            category: '',
            icon: {
              url: `/images/icons/${serviceName.toLowerCase().replace(/\s+/g, '-')}.svg`,
              alt: serviceName
            }
          });
        } else if (text.startsWith('Category: ') && parsedContent.services.length > 0) {
          parsedContent.services[parsedContent.services.length - 1].category = 
            text.replace('Category: ', '');
        } else if (text.startsWith('Description: ') && parsedContent.services.length > 0) {
          parsedContent.services[parsedContent.services.length - 1].description = 
            text.replace('Description: ', '');
        }
        break;

      case 'profile image':
        if (text.startsWith('Alt Text: ')) {
          parsedContent.images.profile.alt = text.replace('Alt Text: ', '');
        }
        break;

      case 'contact information':
        if (text.startsWith('Email: ')) {
          parsedContent.jsonLd.contact.email = text.replace('Email: ', '');
        } else if (text.startsWith('Address: ')) {
          parsedContent.jsonLd.address.streetAddress = text.replace('Address: ', '');
        } else if (text.startsWith('City: ')) {
          parsedContent.jsonLd.address.addressLocality = text.replace('City: ', '');
        } else if (text.startsWith('Postal Code: ')) {
          parsedContent.jsonLd.address.postalCode = text.replace('Postal Code: ', '');
        } else if (text.startsWith('Region: ')) {
          parsedContent.jsonLd.address.addressRegion = text.replace('Region: ', '');
        } else if (text.startsWith('Country: ')) {
          parsedContent.jsonLd.address.addressCountry = text.replace('Country: ', '');
        }
        break;

      case 'social links':
        if (text.startsWith('LinkedIn: ')) {
          parsedContent.jsonLd.social.linkedin = text.replace('LinkedIn: ', '');
        } else if (text.startsWith('Website: ')) {
          parsedContent.jsonLd.social.website = text.replace('Website: ', '');
        }
        break;
    }
  }

  return parsedContent;
}

// Run the sync
syncContent().catch(console.error);

// Add this debug logging
console.log('Checking environment variables:');
console.log('GOOGLE_DOC_ID exists:', !!process.env.GOOGLE_DOC_ID);
console.log('GOOGLE_CREDENTIALS exists:', !!process.env.GOOGLE_CREDENTIALS);

try {
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  console.log('Credentials parsed successfully');
} catch (error) {
  console.error('Failed to parse credentials:', error);
  process.exit(1);
}

function processImageReference(text) {
  // Instead of extracting Drive IDs, extract filenames
  // Example: If doc contains "image: profile.webp", it will use that filename
  const filename = // extract filename from text
  return {
    filename,    // Just store the filename
    width: 800,  // You might want to get these from the actual image
    height: 600, // You might want to get these from the actual image
    alt: "...",
    type: "image/webp"
  };
}