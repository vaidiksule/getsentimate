import { z } from 'zod';

export const urlSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .url('Enter a valid URL')
    .refine(
      (value) => {
        try {
          const u = new URL(value);
          const host = u.hostname.toLowerCase();
          return host.includes('youtube.com') || host.includes('youtu.be');
        } catch {
          return false;
        }
      },
      {
        message: 'Only YouTube URLs are recommended (youtube.com or youtu.be)',
      },
    ),
});

export type UrlFormValues = z.infer<typeof urlSchema>;
