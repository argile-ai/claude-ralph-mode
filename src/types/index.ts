import { z } from 'zod';

// Repository configuration schema
export const RepositoryConfigSchema = z.object({
  path: z.string(),
  defaultBranch: z.string().default('main'),
  checks: z.array(z.string()).default([]),
});

export type RepositoryConfig = z.infer<typeof RepositoryConfigSchema>;

// Agent configuration schema
export const AgentConfigSchema = z.object({
  maxIterations: z.number().default(50),
  timeout: z.number().default(600),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// Ralph configuration schema
export const RalphConfigSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().optional(),
  project: z.string(),
  description: z.string().optional(),
  repositories: z.record(z.string(), RepositoryConfigSchema),
  agent: AgentConfigSchema.optional().default({}),
});

export type RalphConfig = z.infer<typeof RalphConfigSchema>;

// PRD Repository branch info
export const PrdRepositorySchema = z.object({
  branchName: z.string(),
  activeBranch: z.string().optional(),
});

export type PrdRepository = z.infer<typeof PrdRepositorySchema>;

// User Story schema
export const UserStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  repo: z.string(),
  description: z.string(),
  acceptanceCriteria: z.array(z.string()),
  priority: z.number(),
  passes: z.boolean().default(false),
  fork: z.boolean().default(false),
  notes: z.string().default(''),
});

export type UserStory = z.infer<typeof UserStorySchema>;

// PRD schema
export const PrdSchema = z.object({
  project: z.string(),
  description: z.string().optional(),
  repositories: z.record(z.string(), PrdRepositorySchema),
  userStories: z.array(UserStorySchema),
});

export type Prd = z.infer<typeof PrdSchema>;

// Command options
export interface InitOptions {
  force?: boolean;
}

export interface PlanOptions {
  output?: string;
}

export interface PrdOptions {
  input?: string;
  output?: string;
}

export interface RunOptions {
  maxIterations?: number;
}

export interface StatusOptions {
  verbose?: boolean;
}
