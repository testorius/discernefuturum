import { defineCollection, z } from 'astro:content';

const home = defineCollection({
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
          link: z.string(),
        }),
        secondary: z.object({
          text: z.string(),
          link: z.string(),
        }),
      }),
    }),
    seo: z.object({
      title: z.string(),
      description: z.string(),
      siteName: z.string(),
    }),
    services: z.array(z.object({
      name: z.string(),
      category: z.string(),
      description: z.string(),
      content: z.string(),
      icon: z.object({
        url: z.string(),
        alt: z.string()
      }),
      link: z.string()
    })),
    images: z.object({
      profile: z.object({
        url: z.string(),
        filename: z.string(),
        alt: z.string(),
        width: z.number(),
        height: z.number(),
        type: z.string()
      })
    })
  })
});

export const collections = { home };