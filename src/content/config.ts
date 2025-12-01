import { defineCollection, z } from 'astro:content';

const messaging = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    order: z.number().optional(),     // used to sort sections on /services
    summary: z.string().optional(),   // optional short blurb if we want
  }),
});

export const collections = { messaging };
