import { defineCollection, z } from 'astro:content';

const homepage = defineCollection({
  type: 'data',
  schema: z.object({
    seo: z.object({
      title: z.string(),
      description: z.string(),
      siteName: z.string()
    }),
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
    images: z.object({
      profile: z.object({
        url: z.string(),
        alt: z.string(),
        width: z.number(),
        height: z.number()
      }),
      heroBackground: z.object({
        url: z.string(),
        alt: z.string()
      })
    }),
    services: z.array(z.object({
      name: z.string(),
      icon: z.object({
        url: z.string(),
        alt: z.string()
      }),
      description: z.string(),
      category: z.string(),
      link: z.string()
    })),
    contact: z.object({
      email: z.string(),
      address: z.object({
        street: z.string(),
        city: z.string(),
        postalCode: z.string(),
        region: z.string(),
        country: z.string()
      })
    }),
    social: z.object({
      linkedin: z.string(),
      twitter: z.string(),
      github: z.string().optional()
    }),
    variables: z.record(z.string(), z.string())
  })
});

export const collections = {
  homepage
};