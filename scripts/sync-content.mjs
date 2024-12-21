import { google } from 'googleapis';
import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function syncContent() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/documents.readonly']
    });

    const docs = google.docs({ version: 'v1', auth });
    
    // Fetch document content
    const document = await docs.documents.get({
      documentId: process.env.GOOGLE_DOC_ID
    });

    // Parse the document content
    const content = parseDocument(document);

    // Save to content collection
    const contentPath = join(dirname(__dirname), 'src/content/home/homepage.json');
    await writeFile(contentPath, JSON.stringify(content, null, 2));

    console.log('Content synced successfully to:', contentPath);
  } catch (error) {
    console.error('Error syncing content:', error);
    process.exit(1);
  }
}

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
        url: '/images/alexanderpaul.webp',
        width: 1200,
        height: 630,
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