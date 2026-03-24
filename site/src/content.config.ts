import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const actionRefSchema = z.object({
  uses: z.string(),
  name: z.string().nullable(),
});

const jobSchema = z.object({
  job_id: z.string(),
  name: z.string().nullable(),
  runs_on: z.union([z.string(), z.array(z.string())]),
  steps_count: z.number(),
  actions_used: z.array(actionRefSchema),
});

const workflows = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/workflows' }),
  schema: z.object({
    id: z.string(),
    org: z.string(),
    repo_name: z.string(),
    repo_url: z.string().url(),
    workflow_file: z.string(),
    workflow_path: z.string(),
    workflow_name: z.string(),
    on_triggers: z.array(z.string()),
    jobs: z.array(jobSchema),
    status_badge_url: z.string().url(),
    last_fetched: z.coerce.date(),
    raw_yaml: z.string(),
  }),
});

export const collections = { workflows };
