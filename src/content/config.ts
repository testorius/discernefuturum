import { defineCollection, z } from 'astro:content';

const homeCollection = defineCollection({
  type: 'data',
  schema: z.object({
    hero: z.object({
      uptitle: z.string(),
      title: z.string(),
      subtitle: z.string(),
      valueProps: z.array(z.string()),
      cta: z.object({
        primary: z.object({
          text: z.string(),
          link: z.string()
        }),
        secondary: z.object({
          text: z.string(),
          link: z.string()
        })
      })
    }),
    seo: z.object({
      title: z.string(),
      description: z.string(),
      siteName: z.string()
    }),
    services: z.array(z.object({
      name: z.string(),
      description: z.string(),
      category: z.string(),
      icon: z.object({
        url: z.string(),
        alt: z.string()
      }).optional()
    })),
    images: z.object({
      profile: z.object({
        filename: z.string(),
        width: z.number(),
        height: z.number(),
        alt: z.string(),
        type: z.string().default('image/webp')
      })
    }),
    jsonLd: z.object({
      founder: z.object({
        name: z.string(),
        jobTitle: z.string(),
        description: z.string(),
        knowsAbout: z.array(z.string())
      }),
      address: z.object({
        streetAddress: z.string(),
        addressLocality: z.string(),
        postalCode: z.string(),
        addressRegion: z.string(),
        addressCountry: z.string()
      }),
      contact: z.object({
        email: z.string(),
        telephone: z.string().optional()
      }),
      social: z.object({
        linkedin: z.string(),
        website: z.string().optional()
      })
    })
  })
});

export const collections = {
  'home': homeCollection,
};