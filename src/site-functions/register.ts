/**
 * Site Functions Registration
 *
 * Registers all site functions on window.__siteFunctions so the voice agent
 * can invoke them via the callSiteFunction RPC.
 *
 * Convention:
 * - Each .ts file in src/site-functions/ (except register.ts, index.ts, types.ts)
 *   exports a default function
 * - The filename (camelCase) becomes the function name on window.__siteFunctions
 * - Functions receive (args: Record<string, any>) and return any
 *
 * Manifest:
 * - Each entry in `siteFunctionManifest` provides metadata alongside the function
 * - `description` is MANDATORY — used as the agent tool description
 * - `schema` is optional — JSON Schema for the function's parameters
 * - `defaults` is optional — default argument values when not provided by agent
 * - The discovery service extracts this manifest on deployment for validation
 */

import setTheme from './setTheme';
import navigateToSection from './navigateToSection';
import welcomeJourneyTool from './welcomeJourneyTool';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SiteFunctionEntry = {
  /** The function implementation */
  fn: (args: any) => any;
  /** MANDATORY: Agent-facing description of what this function does */
  description: string;
  /** Optional: JSON Schema describing the function's input parameters */
  schema?: Record<string, any>;
  /** Optional: Default values for parameters when not provided by the agent */
  defaults?: Record<string, any>;
};

// ─── Manifest ───────────────────────────────────────────────────────────────

/**
 * Site function manifest — the single source of truth for all registered functions.
 *
 * Each key is the camelCase function name that the agent will use to call it.
 * The discovery service reads this manifest on deployment to extract metadata
 * and validate schemas.
 *
 * Mobeus expects `site-functions/register.ts` at the **repo root** — that file
 * re-exports this module so the dashboard can discover `setTheme` + `navigateToSection`.
 */
export const siteFunctionManifest: Record<string, SiteFunctionEntry> = {
  setTheme: {
    fn: setTheme,
    description:
      'Switch the website theme between light, dark, or system preference',
    schema: {
      type: 'object',
      properties: {
        theme: {
          type: 'string',
          enum: ['light', 'dark', 'system'],
          description: 'The theme to apply',
        },
      },
      required: ['theme'],
    },
    defaults: { theme: 'system' },
  },

  navigateToSection: {
    fn: navigateToSection,
    description:
      'navigateToSection (glass contract v2, English only). One root object: badge, title, subtitle, generativeSubsections — each subsection { id?, templateId, props, _update? }. ' +
      'Each call replaces the screen except Dashboard stacks with ProfileSheet, job sheets, learning sheets, etc.; welcome greeting uses GlassmorphicOptions alone (no Dashboard). ' +
      'On UI-transition turns: speak + this tool in the same response — never tool-only. TeleSpeechBubble is persistent; questions are spoken, not passed as props. ' +
      'Wait for user signals after: GlassmorphicOptions, MultiSelectOptions, TextInput, RegistrationForm, CandidateSheet, CardStack, SavedJobsStack. ' +
      '_update: true merges delta props into the matching id/templateId without full re-mount. Strict JSON (double quotes, no trailing commas, no comments); omit optional keys — never send null. ' +
      'Reserved: _sessionEstablished (see agent-knowledge execution rule 8; frontend may strip). ' +
      'Auto-inject — do NOT pass in props (frontend/cache fills): rawSkillProgression, rawJobs, rawMarketRelevance, rawCareerGrowth, requiredSkills, recommendedSkills, skillGaps, candidate name/title/experience/education. ' +
      'CandidateSheet: pass only candidateId (frontend auto-injects the rest). JobDetailSheet: only jobId, title, company, fitCategory (frontend resolves the rest). SavedJobsStack: props.bubbles required (labels from search_knowledge / trainco_dashboard_payloads). ' +
      'Corrections: [TEMPLATE ERROR] → resend full payload with valid templateId; [CORRECTION NEEDED] → _update: true with delta only; [REMINDER] → include navigateToSection when the turn requires UI. ' +
      'Full journeys and UI payloads: public/prompts/speak-llm-system-prompt.md. CARDS DSL / GridView scenes: public/prompts/show-llm-system-prompt.md.',
    schema: {
      type: 'object',
      description:
        'Matches glass-prompt.md payload schema: badge, title, subtitle, generativeSubsections',
      properties: {
        badge: { type: 'string', description: 'Context label (e.g. trAIn CAREER)' },
        title: { type: 'string', description: 'Main heading' },
        subtitle: { type: 'string', description: 'Subheading' },
        generativeSubsections: {
          type: 'array',
          description:
            'Screen sections; each call typically replaces content unless paired Dashboard + sheet per glass rules',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Stable section id for stacking / _update matching' },
              templateId: {
                type: 'string',
                description:
                  'Template: GlassmorphicOptions, MultiSelectOptions, TextInput, RegistrationForm, Dashboard, ProfileSheet, CardStack, SavedJobsStack, JobSearchSheet, JobDetailSheet, etc.',
              },
              props: { type: 'object', additionalProperties: true },
              _update: {
                type: 'boolean',
                description: 'If true, merge props into existing section with same id/templateId',
              },
            },
            required: ['templateId'],
          },
        },
      },
      required: ['badge', 'title', 'subtitle', 'generativeSubsections'],
    },
  },

  welcomeJourneyTool: {
    fn: welcomeJourneyTool,
    description:
      'Welcome Journey Tool for MOBEUS 2.0 - consolidated tool for the entire welcome journey with section-based data retrieval',
    schema: {
      type: 'object',
      properties: {
        sectionId: {
          type: 'string',
          description: 'Section ID to retrieve (e.g., "2194-A", "7483-A", "4521-E")',
        },
        customIndustry: {
          type: 'string',
          description: 'Required for section 4521-E to generate dynamic role options',
        },
      },
      required: ['sectionId'],
    },
    defaults: {},
  },
};

// ─── Window registration ────────────────────────────────────────────────────

// Extend window type
declare global {
  interface Window {
    __siteFunctions: Record<string, (args: any) => any>;
  }
}

/**
 * Register all site functions on window.__siteFunctions.
 * Call this once on app initialization (e.g., in VoiceSessionProvider or layout).
 *
 * Only the `fn` from each manifest entry is registered on the window —
 * metadata (description, schema, defaults) is used by the discovery service,
 * not at runtime.
 */
export function registerSiteFunctions() {
  if (typeof window === 'undefined') return;

  window.__siteFunctions ??= {};
  for (const [name, entry] of Object.entries(siteFunctionManifest)) {
    window.__siteFunctions[name] = entry.fn;
  }
}
