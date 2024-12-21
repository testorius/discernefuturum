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
      valueProps: z.array(z.string())
    }),
    services: z.array(z.object({
      name: z.string(),
      description: z.string(),
      category: z.string()
    })),
    images: z.object({
      profile: z.object({
        url: z.string(),
        width: z.number(),
        height: z.number(),
        driveId: z.string().optional(),
        shareableLink: z.string().optional()
      })
    })
  })
});

// Export the collections object
export const collections = {
  homepage
};