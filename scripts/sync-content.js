import { google } from 'googleapis';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import dotenv from 'dotenv';

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
    await writeFile(
      join(process.cwd(), 'src/content/homepage.json'),
      JSON.stringify(content, null, 2)
    );

    console.log('Content synced successfully');
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
    hero: {},
    seo: {},
    services: [],
    images: {
      profile: {
        url: '',
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
        if (text.startsWith('Small Title Above: ')) {
          parsedContent.hero.uptitle = text.replace('Small Title Above: ', '');
        } else if (text.startsWith('Main Heading: ')) {
          parsedContent.hero.title = text.replace('Main Heading: ', '');
        } else if (text.startsWith('Subheading: ')) {
          parsedContent.hero.subtitle = text.replace('Subheading: ', '');
        } else if (text.startsWith('• ')) {
          if (!parsedContent.hero.valueProps) {
            parsedContent.hero.valueProps = [];
          }
          parsedContent.hero.valueProps.push(text.replace('• ', ''));
        }
        break;

      case 'services':
        if (text.startsWith('## ')) {
          // New service
          const serviceName = text.replace('## ', '');
          parsedContent.services.push({
            name: serviceName,
            description: '',
            category: '',
            icon: {
              url: '',
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
        const imageMatch = text.match(/{{\'(.+?)\'}}/)
        if (imageMatch) {
          parsedContent.images.profile.alt = imageMatch[1];
          parsedContent.images.profile.url = `/images/alexanderpaul.webp`;
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

syncContent().catch(console.error);