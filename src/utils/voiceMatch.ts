import type { BubbleOption } from "@/components/FloatingAnswerBubbles";
import type { JobListing } from "@/types/flow";

const FILLER_WORDS = new Set([
  "a",
  "an",
  "the",
  "i",
  "im",
  "i'm",
  "me",
  "my",
  "to",
  "for",
  "of",
  "in",
  "on",
  "at",
  "is",
  "it",
  "this",
  "that",
  "please",
  "want",
  "like",
  "would",
  "choose",
  "select",
  "go",
  "with",
  "and",
  "or",
]);

const LABEL_ALIASES: Record<string, string[]> = {
  // Welcome journey
  "artificial intelligence": ["ai", "machine learning", "ml"],
  "civil & structural engineering": ["civil engineering", "structural engineering"],
  "investment & banking": ["investment banking", "banking"],
  "accounting & audit": ["accounting", "audit"],
  "risk & compliance": ["risk", "compliance"],
  "human resources": ["hr"],
  "operations & logistics": ["operations", "logistics"],
  "something else": ["something", "other"],
  "i'm not sure": ["not sure", "unsure", "dont know", "don't know"],
  "yes, i'm ready": ["yes", "im ready", "i am ready", "ready"],
  "not just yet": ["not yet", "later"],
  "technology": ["tech", "teknoloji"],
  "cybersecurity": ["cyber security", "cyber", "siber"],
  // Dashboard options
  "browse new jobs": ["browse jobs", "new jobs", "find jobs", "show jobs"],
  "view my profile": ["my profile", "profile", "show profile"],
  "i'd like some coaching": ["coaching", "coach me", "some coaching"],
  "complete some training": ["training", "complete training"],
  "check on my applications": ["my applications", "applications", "check applications"],
  "view saved jobs": ["saved jobs", "saved"],
  // Detail / sheet actions
  "view full details": ["full details", "details", "more details", "see details", "show details"],
  "view full posting": [
    "full posting",
    "view posting",
    "the posting",
    "open posting",
    "view the full posting",
    "see the full posting",
    "see full posting",
    "show full posting",
    "show the full posting",
    "open full posting",
    "open the full posting",
    "want to view full posting",
    "i want to view the full posting",
    "want to see the posting",
    "show me the posting",
    "see posting",
  ],
  "am i eligible": [
    "eligible",
    "check eligibility",
    "eligibility check",
    "my eligibility",
  ],
};

export const VOICE_MIN_SCORE = 0.58;
export const VOICE_MIN_MARGIN = 0.08;

/** Phrases for fuzzy match → same path as tapping “Continue with LinkedIn”. */
const LINKEDIN_REGISTRATION_PHRASES = [
  "continue with linkedin",
  "continue with linked in",
  "continue linkedin",
  "connect with linkedin",
  "connect with linked in",
  "connect linkedin",
  "sign in with linkedin",
  "sign in with linked in",
  "log in with linkedin",
  "login with linkedin",
  "use linkedin",
  "through linkedin",
  "linkedin",
];

/**
 * Competing spoken intents on RegistrationForm (email / sign-in path).
 * Used only for margin vs LinkedIn — same idea as the runner-up bubble in
 * {@link resolveBestVoiceMatch}.
 */
const REGISTRATION_VOICE_RIVAL_PHRASES = [
  "continue with email",
  "use email",
  "enter my email",
  "ill use email",
  "i will use email",
  "my email",
  "type my email",
  "sign in with email",
  "already have an account",
  "already have account",
];

export function normalizeVoiceText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stemToken(token: string): string {
  if (token.length > 4 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 3 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 2 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function tokenizeMeaningful(input: string): string[] {
  return normalizeVoiceText(input)
    .split(" ")
    .map(stemToken)
    .filter((t) => t.length > 1 && !FILLER_WORDS.has(t));
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array(b.length + 1).fill(0);
  const curr = new Array(b.length + 1).fill(0);

  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }

  return prev[b.length];
}

function textSimilarity(a: string, b: string): number {
  const na = normalizeVoiceText(a);
  const nb = normalizeVoiceText(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  if (na.includes(nb) || nb.includes(na)) {
    const shorter = Math.min(na.length, nb.length);
    const longer = Math.max(na.length, nb.length);
    return 0.9 + (shorter / longer) * 0.08;
  }

  const distance = levenshteinDistance(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return Math.max(0, 1 - distance / maxLen);
}

function tokenOverlapScore(a: string, b: string): number {
  const ta = new Set(tokenizeMeaningful(a));
  const tb = new Set(tokenizeMeaningful(b));
  if (!ta.size || !tb.size) return 0;

  let overlap = 0;
  ta.forEach((token) => {
    if (tb.has(token)) overlap += 1;
  });

  const precision = overlap / ta.size;
  const recall = overlap / tb.size;
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

export function scoreMatch(transcript: string, candidate: string): number {
  const exact = textSimilarity(transcript, candidate);
  const token = tokenOverlapScore(transcript, candidate);
  return Math.max(exact, token * 0.92);
}

/**
 * True when spoken text should trigger the same path as tapping "Continue with LinkedIn"
 * on RegistrationForm. Uses {@link scoreMatch} with the same {@link VOICE_MIN_SCORE} and
 * {@link VOICE_MIN_MARGIN} as {@link resolveBestVoiceMatch} / {@link useVoiceActions};
 * margin is LinkedIn best score minus the best rival score among email/sign-in phrases.
 */
export function matchesLinkedInRegistrationIntent(rawTranscript: string): boolean {
  const norm = normalizeVoiceText(rawTranscript);
  if (!norm) return false;

  const linkedInScore = LINKEDIN_REGISTRATION_PHRASES.reduce(
    (max, phrase) => Math.max(max, scoreMatch(norm, phrase)),
    0,
  );
  const rivalScore = REGISTRATION_VOICE_RIVAL_PHRASES.reduce(
    (max, phrase) => Math.max(max, scoreMatch(norm, phrase)),
    0,
  );

  const margin = linkedInScore - rivalScore;
  return linkedInScore >= VOICE_MIN_SCORE && margin >= VOICE_MIN_MARGIN;
}

export type ResolveBestVoiceMatchOptions = {
  minScore?: number;
  minMargin?: number;
};

export function resolveBestVoiceMatch(
  transcript: string,
  bubbles: BubbleOption[],
  options?: ResolveBestVoiceMatchOptions,
): BubbleOption | null {
  const normalizedTranscript = normalizeVoiceText(transcript);
  if (!normalizedTranscript) return null;

  const minScore = options?.minScore ?? VOICE_MIN_SCORE;
  const minMargin = options?.minMargin ?? VOICE_MIN_MARGIN;

  const ranked = bubbles.map((bubble) => {
    const label = bubble.value ?? bubble.label;
    const normalizedLabel = normalizeVoiceText(label);
    const aliases = LABEL_ALIASES[normalizedLabel] ?? [];
    const candidatePhrases = [label, ...aliases];

    const bestScore = candidatePhrases.reduce((max, phrase) => {
      const score = scoreMatch(normalizedTranscript, phrase);
      return score > max ? score : max;
    }, 0);

    return { bubble, score: bestScore };
  });

  ranked.sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const second = ranked[1];
  if (!best) return null;

  const margin = second ? best.score - second.score : best.score;
  if (best.score < minScore || margin < minMargin) return null;

  return best.bubble;
}

/** Regex fallbacks when STT inserts filler words so substring match against the label fails. */
const SAVED_JOBS_VIEW_POSTING_RE =
  /view\s+(?:the\s+)?full\s+posting|(?:want\s+to\s+)?(?:see|show|open)\s+(?:the\s+)?(?:view\s+)?full\s+posting|open\s+view\s+full\s+posting|(?:^|\s)full\s+posting(?:\s|$)/;
const SAVED_JOBS_ELIGIBLE_RE =
  /(?:am\s+i|i\s+am)\s+eligible|(?:^|\s)eligible(?:\s|$)|check\s+eligibility/;
const SAVED_JOBS_FIND_MORE_RE =
  /find\s+more\s+jobs|(?:^|\s)find\s+more(?:\s+jobs)?(?:\s|$)|browse\s+(?:more\s+)?jobs|more\s+jobs/;
const SAVED_JOBS_VIEW_ALL_SAVED_RE =
  /view\s+all\s+saved(?:\s+jobs)?|all\s+saved\s+jobs|saved\s+jobs\s+list|view\s+all\s+saved\s+jobs/;

/**
 * Voice match for SavedJobsStack bubbles: same as {@link resolveBestVoiceMatch}, plus
 * tolerant patterns for “view the … posting” and short “eligible”.
 */
/** Canonical normalized label for the “View full posting” bubble in trainco_dashboard_payloads. */
const VIEW_FULL_POSTING_NORM = "view full posting";

function findBubbleByNormalizedLabel(bubbles: BubbleOption[], want: string): BubbleOption | null {
  const target = normalizeVoiceText(want);
  if (!target) return null;
  return bubbles.find((b) => normalizeVoiceText(b.value ?? b.label) === target) ?? null;
}

/**
 * When regex / fuzzy intent says “full posting” but payload labels differ slightly from canonical.
 */
function findViewFullPostingBubble(bubbles: BubbleOption[]): BubbleOption | null {
  const exact = findBubbleByNormalizedLabel(bubbles, VIEW_FULL_POSTING_NORM);
  if (exact) return exact;
  return (
    bubbles.find((b) => {
      const nl = normalizeVoiceText(b.value ?? b.label);
      return nl.includes("posting") && (nl.includes("full") || nl.includes("view"));
    }) ?? null
  );
}

const AMI_ELIGIBLE_NORM = "am i eligible";
const FIND_MORE_JOBS_NORM = "find more jobs";
const VIEW_ALL_SAVED_NORM = "view all saved jobs";

/** Fuzzy resolve when payload label drifts slightly from knowledge strings. */
function findAmIEligibleBubble(bubbles: BubbleOption[]): BubbleOption | null {
  const exact = findBubbleByNormalizedLabel(bubbles, AMI_ELIGIBLE_NORM);
  if (exact) return exact;
  return (
    bubbles.find((b) => {
      const nl = normalizeVoiceText(b.value ?? b.label);
      return nl.includes("eligible");
    }) ?? null
  );
}

function findFindMoreJobsBubble(bubbles: BubbleOption[]): BubbleOption | null {
  const exact = findBubbleByNormalizedLabel(bubbles, FIND_MORE_JOBS_NORM);
  if (exact) return exact;
  return (
    bubbles.find((b) => {
      const nl = normalizeVoiceText(b.value ?? b.label);
      return nl.includes("find") && nl.includes("more");
    }) ?? null
  );
}

function findViewAllSavedBubble(bubbles: BubbleOption[]): BubbleOption | null {
  const exact = findBubbleByNormalizedLabel(bubbles, VIEW_ALL_SAVED_NORM);
  if (exact) return exact;
  return (
    bubbles.find((b) => {
      const nl = normalizeVoiceText(b.value ?? b.label);
      return nl.includes("saved") && (nl.includes("all") || nl.includes("view"));
    }) ?? null
  );
}

/** Slightly looser than global — four short bubbles often tie on “view” / “jobs”. */
const SAVED_JOBS_FUZZY_MIN_MARGIN = 0.04;

export function resolveVoiceMatchForSavedJobsBubbles(
  transcript: string,
  bubbles: BubbleOption[],
): BubbleOption | null {
  const n = normalizeVoiceText(transcript);
  if (!n) return null;

  // Regex + label fallbacks first: avoids margin failures when two bubbles score close.
  if (SAVED_JOBS_VIEW_POSTING_RE.test(n)) {
    const b = findViewFullPostingBubble(bubbles);
    if (b) return b;
  }
  if (SAVED_JOBS_ELIGIBLE_RE.test(n) && !/ineligible/.test(n)) {
    const b = findAmIEligibleBubble(bubbles);
    if (b) return b;
  }
  if (SAVED_JOBS_FIND_MORE_RE.test(n)) {
    const b = findFindMoreJobsBubble(bubbles);
    if (b) return b;
  }
  if (SAVED_JOBS_VIEW_ALL_SAVED_RE.test(n)) {
    const b = findViewAllSavedBubble(bubbles);
    if (b) return b;
  }

  return resolveBestVoiceMatch(transcript, bubbles, { minMargin: SAVED_JOBS_FUZZY_MIN_MARGIN });
}

/** Phrases for {@link useVoiceActions} to open the top visible card (paired with that job’s action). */
export const CARD_STACK_FRONT_CARD_PHRASES = [
  "first card",
  "top card",
  "front card",
  "this card",
  "the first one",
  "the top one",
  "the one on top",
  "first job",
  "top job",
  "open the first",
  "show the first",
  "the front one",
] as const;

/**
 * Phrases to match user speech against a job — used with {@link useVoiceActions}
 * (one action per job, same scoring/margin as bubble options).
 */
export function jobListingVoicePhrases(job: JobListing): string[] {
  const phrases: string[] = [job.title, job.company, `${job.title} ${job.company}`];
  for (const part of job.title.split(/[/|—\-]+/)) {
    const t = part.trim();
    if (t.length > 2) {
      phrases.push(t);
      if (job.company) phrases.push(`${t} ${job.company}`);
    }
  }
  return [...new Set(phrases.filter(Boolean))];
}
