/**
 * Site functions manifest — required at this path for Mobeus / deployment discovery.
 * (Dashboard: “Push code with a site-functions/register.ts manifest”.)
 *
 * Canonical implementation: `src/site-functions/register.ts`
 * Registered functions: `setTheme`, `navigateToSection`
 */
export {
  siteFunctionManifest,
  registerSiteFunctions,
  type SiteFunctionEntry,
} from '../src/site-functions/register';
