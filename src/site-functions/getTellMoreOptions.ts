/**
 * getTellMoreOptions — Welcome Journey Tool for MOBEUS 2.0
 *
 * Returns tell-me-more options for Step 3847-B
 * 
 * Registered as window.__siteFunctions.getTellMoreOptions
 * The voice agent can call this via the callSiteFunction RPC.
 */
export default function getTellMoreOptions(): {
  badge: string;
  title: string;
  subtitle: string;
  generativeSubsections: Array<{
    id: string;
    templateId: string;
    props: {
      bubbles: Array<{ label: string }>;
    };
  }>;
} {
  return {
    badge: "MOBEUS CAREER",
    title: "Welcome",
    subtitle: "About TrAIn",
    generativeSubsections: [
      {
        id: "tell-me-more",
        templateId: "GlassmorphicOptions",
        props: {
          bubbles: [
            { label: "How does TrAIn work?" },
            { label: "How is TrAIn different?" },
            { label: "Can I build skills on TrAIn?" },
            { label: "Which jobs can I find on TrAIn?" },
            { label: "How does TrAIn use my data?" },
            { label: "Something else" }
          ]
        }
      }
    ]
  };
}