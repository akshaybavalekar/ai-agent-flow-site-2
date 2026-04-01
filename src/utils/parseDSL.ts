/**
 * parseDSL — Pipe-delimited card DSL parser
 * v2.0 · playground branch
 *
 * DSL format replaces the JSON cards array inside navigateToSection props.
 * ~80% fewer tokens than JSON. Parser is transparent to GridView — output
 * is identical shape to what JSON-based cards produce.
 *
 * SUPPORTED CARD TYPES (16) — trainco training platform:
 *   Flat:      concept-card
 *   Container: course-overview · course-progress · learning-path · lesson
 *              objectives · flashcard · skill-quiz · skills-assessment
 *              skills-profile · certifications · step-by-step
 *              milestone · achievement · celebration · lesson-split
 *
 * ITEM PREFIXES:
 *   domain · dp · module · lesson-step · objective · card-item
 *   quiz-opt · assessed-skill · skill-item · cert · step-item
 *   m-stat · a-stat · cel-detail · split-bullet
 */

export { type CardDef } from '@/types/cards';
import type { CardDef } from '@/types/cards';

export interface ParsedDSL {
    layout?: string;
    badge?: string;
    cards: CardDef[];
}

// ── Sentinels — fuzzy regex tolerates spaces, casing, and markdown fences ────
// Handles: ===CARDS===, === CARDS ===, ===cards===, ```===CARDS===```, etc.
const SENTINEL_START_RE = /={3}\s*CARDS\s*={3}/i;
const SENTINEL_END_RE   = /={3}\s*END\s*={3}/i;

// ── Placeholder normalizer ───────────────────────────────────────────────────
// — / - / _ / empty → undefined so component default props kick in
function n(s: string | undefined): string | undefined {
    if (s === undefined) return undefined;
    const t = s.trim();
    return (t === '—' || t === '-' || t === '_' || t === '') ? undefined : t;
}

// Bool helper: "true" → true, anything else → false
function b(s: string | undefined): boolean {
    return n(s)?.toLowerCase() === 'true';
}

// Safe float: returns 0 on NaN
function f(s: string | undefined): number {
    return parseFloat(n(s) ?? '0') || 0;
}

// ── Schema table ─────────────────────────────────────────────────────────────
export const DSL_SCHEMA: Record<string, { pipeCount: number; fields: string[] }> = {
    // Flat cards
    'concept-card':    { pipeCount: 7, fields: ['term','definition','explanation','examTip','category','examples (semicolons)','relatedTerms (semicolons)'] },
    // Container headers
    'course-overview': { pipeCount: 7, fields: ['courseTitle','certificationName','difficulty','totalQuestions','passingScore','examDuration','overallMastery'] },
    'course-progress': { pipeCount: 3, fields: ['courseTitle','overallScore','readyForExam'] },
    'learning-path':   { pipeCount: 5, fields: ['title','subtitle','targetJob','totalDuration','overallProgress'] },
    'lesson':          { pipeCount: 4, fields: ['lessonTitle','lessonSubtitle','skill','difficulty'] },
    'objectives':      { pipeCount: 2, fields: ['title','taskTitle'] },
    'flashcard':       { pipeCount: 2, fields: ['title','subtitle'] },
    'skill-quiz':      { pipeCount: 7, fields: ['skillName','question','difficulty','currentScore','totalQuestions','questionsAnswered','explanation'] },
    'skills-assessment': { pipeCount: 1, fields: ['title'] },
    'skills-profile':  { pipeCount: 1, fields: ['title'] },
    'certifications':  { pipeCount: 1, fields: ['title'] },
    'step-by-step':    { pipeCount: 3, fields: ['title','subtitle','currentStep'] },
    'milestone':       { pipeCount: 5, fields: ['title','milestone','subtitle','encouragement','nextMilestone'] },
    'achievement':     { pipeCount: 5, fields: ['achievementTitle','badge','date','message','title'] },
    'celebration':     { pipeCount: 3, fields: ['title','type','subtitle'] },
    'lesson-split':    { pipeCount: 4, fields: ['title','content','badge','actionText'] },
    // Item lines
    'domain':        { pipeCount: 4, fields: ['number','title','weight','masteryScore'] },
    'dp':            { pipeCount: 5, fields: ['number','title','weight','tasksCompleted','totalTasks'] },
    'module':        { pipeCount: 4, fields: ['title','duration','status','description'] },
    'lesson-step':   { pipeCount: 4, fields: ['stepNumber','title','description','duration'] },
    'objective':     { pipeCount: 3, fields: ['text','completed','score'] },
    'card-item':     { pipeCount: 2, fields: ['term','definition'] },
    'quiz-opt':      { pipeCount: 2, fields: ['text','correct'] },
    'assessed-skill': { pipeCount: 4, fields: ['name','score','category','lastAssessed'] },
    'skill-item':    { pipeCount: 4, fields: ['name','level','category','verified'] },
    'cert':          { pipeCount: 5, fields: ['name','issuer','issueDate','expiryDate','status'] },
    'step-item':     { pipeCount: 4, fields: ['stepNumber','title','description','completed'] },
    'm-stat':        { pipeCount: 3, fields: ['label','value','improvement'] },
    'a-stat':        { pipeCount: 2, fields: ['label','value'] },
    'cel-detail':    { pipeCount: 2, fields: ['label','value'] },
    'split-bullet':  { pipeCount: 1, fields: ['text'] },
};

// ── Container → item prefix map ───────────────────────────────────────────────
const CONTAINER_ITEM_PREFIXES: Record<string, string> = {
    'course-overview':   'domain',
    'course-progress':   'dp',
    'learning-path':     'module',
    'lesson':            'lesson-step',
    'objectives':        'objective',
    'flashcard':         'card-item',
    'skill-quiz':        'quiz-opt',
    'skills-assessment': 'assessed-skill',
    'skills-profile':    'skill-item',
    'certifications':    'cert',
    'step-by-step':      'step-item',
    'milestone':         'm-stat',
    'achievement':       'a-stat',
    'celebration':       'cel-detail',
    'lesson-split':      'split-bullet',
};

const CONTAINER_TYPES   = new Set(Object.keys(CONTAINER_ITEM_PREFIXES));
const ALL_ITEM_PREFIXES = new Set(Object.values(CONTAINER_ITEM_PREFIXES));
const FLAT_TYPES        = new Set(['concept-card']);

// ── Item parsers ──────────────────────────────────────────────────────────────
function parseItem(prefix: string, fields: string[]): Record<string, any> | null {
    switch (prefix) {
        case 'domain': {
            const [numStr, title, weightStr, masteryStr] = fields;
            const item: Record<string, any> = { number: parseInt(n(numStr) ?? '0', 10), title: n(title) ?? '', weight: f(weightStr) };
            if (n(masteryStr)) item.masteryScore = f(masteryStr);
            return item;
        }
        case 'dp': {
            const [numStr, title, weightStr, tasksCompStr, totalTasksStr] = fields;
            return { domainNumber: parseInt(n(numStr) ?? '0', 10), domainTitle: n(title) ?? '', weight: f(weightStr), tasksCompleted: f(tasksCompStr), totalTasks: f(totalTasksStr) };
        }
        case 'module': {
            const [title, duration, status, ...rest] = fields;
            return { title: n(title) ?? '', duration: n(duration), status: n(status) ?? 'locked', description: n(rest.join('|')) };
        }
        case 'lesson-step': {
            const [stepNumStr, title, description, duration] = fields;
            return { stepNumber: parseInt(n(stepNumStr) ?? '1', 10), title: n(title) ?? '', description: n(description) ?? '', duration: n(duration) };
        }
        case 'objective': {
            const [text, completedStr, scoreStr] = fields;
            const item: Record<string, any> = { text: n(text) ?? '', completed: b(completedStr) };
            if (n(scoreStr)) item.score = f(scoreStr);
            return item;
        }
        case 'card-item': {
            const [term, definition] = fields;
            return { term: n(term) ?? '', definition: n(definition) ?? '' };
        }
        case 'quiz-opt': {
            const [text, correctStr] = fields;
            const item: Record<string, any> = { text: n(text) ?? '' };
            if (b(correctStr)) item.correct = true;
            return item;
        }
        case 'assessed-skill': {
            const [name, scoreStr, category, lastAssessed] = fields;
            const item: Record<string, any> = { name: n(name) ?? '', score: f(scoreStr) };
            if (n(category)) item.category = n(category);
            if (n(lastAssessed)) item.lastAssessed = n(lastAssessed);
            return item;
        }
        case 'skill-item': {
            const [name, levelStr, category, verifiedStr] = fields;
            const item: Record<string, any> = { name: n(name) ?? '', level: f(levelStr) };
            if (n(category)) item.category = n(category);
            if (b(verifiedStr)) item.verified = true;
            return item;
        }
        case 'cert': {
            const [name, issuer, issueDate, expiryDate, status] = fields;
            const item: Record<string, any> = { name: n(name) ?? '', issuer: n(issuer) ?? '', issueDate: n(issueDate) ?? '' };
            if (n(expiryDate)) item.expiryDate = n(expiryDate);
            if (n(status)) item.status = n(status);
            return item;
        }
        case 'step-item': {
            const [stepNumStr, title, description, completedStr] = fields;
            return { stepNumber: parseInt(n(stepNumStr) ?? '1', 10), title: n(title) ?? '', description: n(description) ?? '', completed: b(completedStr) };
        }
        case 'm-stat': {
            const [label, value, improvement] = fields;
            const item: Record<string, any> = { label: n(label) ?? '', value: n(value) ?? '' };
            if (n(improvement)) item.improvement = n(improvement);
            return item;
        }
        case 'a-stat':
        case 'cel-detail': {
            const [label, value] = fields;
            return { label: n(label) ?? '', value: n(value) ?? '' };
        }
        case 'split-bullet': {
            const [text] = fields;
            return { text: n(text) ?? '' };
        }
        default:
            return null;
    }
}

// ── Flat card parser ──────────────────────────────────────────────────────────
function parseFlatCard(type: string, fields: string[], span?: 'full'): CardDef | null {
    const card: CardDef = { type };
    if (span) card.span = span;

    switch (type) {
        case 'concept-card': {
            const [term, definition, explanation, examTip, category, examplesStr, relatedTermsStr] = fields;
            const item: CardDef = Object.assign(card, { term: n(term) ?? '', definition: n(definition) ?? '' });
            if (n(explanation))   item.explanation = n(explanation);
            if (n(examTip))       item.examTip = n(examTip);
            if (n(category))      item.category = n(category);
            if (n(examplesStr))   item.examples = n(examplesStr)!.split(';').map(s => s.trim()).filter(Boolean);
            if (n(relatedTermsStr)) item.relatedTerms = n(relatedTermsStr)!.split(';').map(s => s.trim()).filter(Boolean);
            return item;
        }
        default:
            return null;
    }
}

// ── Container extra metadata ──────────────────────────────────────────────────
interface ContainerMeta {
    title?: string;
    courseTitle?: string;
    certificationName?: string;
    difficulty?: string;
    totalQuestions?: number;
    passingScore?: number;
    examDuration?: string;
    overallMastery?: number;
    overallScore?: number;
    readyForExam?: boolean;
    subtitle?: string;
    targetJob?: string;
    totalDuration?: string;
    overallProgress?: number;
    lessonTitle?: string;
    lessonSubtitle?: string;
    skill?: string;
    taskTitle?: string;
    skillName?: string;
    question?: string;
    currentScore?: number;
    totalQuestions2?: number;
    questionsAnswered?: number;
    explanation?: string;
    currentStep?: number;
    milestone?: string;
    encouragement?: string;
    nextMilestone?: string;
    achievementTitle?: string;
    badge?: string;
    date?: string;
    message?: string;
    type?: string;
    content?: string;
    actionText?: string;
}

function parseContainerHeader(type: string, fields: string[]): ContainerMeta {
    switch (type) {
        case 'course-overview': {
            const [courseTitle, certificationName, difficulty, totalQStr, passingStr, examDuration, masteryStr] = fields;
            const meta: ContainerMeta = { courseTitle: n(courseTitle) ?? '' };
            if (n(certificationName)) meta.certificationName = n(certificationName);
            if (n(difficulty))        meta.difficulty = n(difficulty);
            if (n(totalQStr))         meta.totalQuestions = parseInt(n(totalQStr)!, 10);
            if (n(passingStr))        meta.passingScore = parseInt(n(passingStr)!, 10);
            if (n(examDuration))      meta.examDuration = n(examDuration);
            if (n(masteryStr))        meta.overallMastery = f(masteryStr);
            return meta;
        }
        case 'course-progress': {
            const [courseTitle, scoreStr, readyStr] = fields;
            return { courseTitle: n(courseTitle) ?? '', overallScore: n(scoreStr) ? f(scoreStr) : undefined, readyForExam: b(readyStr) };
        }
        case 'learning-path': {
            const [title, subtitle, targetJob, totalDuration, progressStr] = fields;
            const meta: ContainerMeta = { title: n(title) };
            if (n(subtitle))     meta.subtitle = n(subtitle);
            if (n(targetJob))    meta.targetJob = n(targetJob);
            if (n(totalDuration)) meta.totalDuration = n(totalDuration);
            if (n(progressStr))  meta.overallProgress = f(progressStr);
            return meta;
        }
        case 'lesson': {
            const [lessonTitle, lessonSubtitle, skill, difficulty] = fields;
            return { lessonTitle: n(lessonTitle) ?? '', lessonSubtitle: n(lessonSubtitle), skill: n(skill), difficulty: n(difficulty) };
        }
        case 'objectives': {
            const [title, taskTitle] = fields;
            return { title: n(title), taskTitle: n(taskTitle) };
        }
        case 'flashcard': {
            const [title, subtitle] = fields;
            return { title: n(title), subtitle: n(subtitle) };
        }
        case 'skill-quiz': {
            const [skillName, question, difficulty, scoreStr, totalQStr, answeredStr, explanation] = fields;
            const meta: ContainerMeta = { skillName: n(skillName) ?? '', question: n(question) ?? '', difficulty: n(difficulty) };
            if (n(scoreStr))    meta.currentScore = f(scoreStr);
            if (n(totalQStr))   meta.totalQuestions2 = parseInt(n(totalQStr)!, 10);
            if (n(answeredStr)) meta.questionsAnswered = parseInt(n(answeredStr)!, 10);
            if (n(explanation)) meta.explanation = n(explanation);
            return meta;
        }
        case 'milestone': {
            const [title, milestone, subtitle, encouragement, nextMilestone] = fields;
            return { title: n(title), milestone: n(milestone) ?? '', subtitle: n(subtitle), encouragement: n(encouragement), nextMilestone: n(nextMilestone) };
        }
        case 'achievement': {
            const [achievementTitle, badge, date, message, title] = fields;
            return { achievementTitle: n(achievementTitle) ?? '', badge: n(badge), date: n(date), message: n(message), title: n(title) };
        }
        case 'celebration': {
            const [title, type, subtitle] = fields;
            return { title: n(title), type: n(type), subtitle: n(subtitle) };
        }
        case 'lesson-split': {
            const [title, content, badge, actionText] = fields;
            return { title: n(title) ?? '', content: n(content) ?? '', badge: n(badge), actionText: n(actionText) };
        }
        default:
            return { title: n(fields[0]) };
    }
}

// ── Container flusher ─────────────────────────────────────────────────────────
function flushContainer(
    type: string,
    meta: ContainerMeta,
    items: Record<string, any>[],
    span: 'full' | undefined,
    cards: CardDef[]
): void {
    if (items.length === 0 && !['flashcard', 'skill-quiz', 'lesson'].includes(type)) return;
    const card: CardDef = { type };
    if (span) card.span = span;
    if (meta.title) card.title = meta.title;

    switch (type) {
        case 'course-overview':
            if (meta.courseTitle)       card.courseTitle       = meta.courseTitle;
            if (meta.certificationName) card.certificationName = meta.certificationName;
            if (meta.difficulty)        card.difficulty        = meta.difficulty;
            if (meta.totalQuestions)    card.totalQuestions    = meta.totalQuestions;
            if (meta.passingScore)      card.passingScore      = meta.passingScore;
            if (meta.examDuration)      card.examDuration      = meta.examDuration;
            if (meta.overallMastery !== undefined) card.overallMastery = meta.overallMastery;
            card.domains = items;
            break;
        case 'course-progress':
            if (meta.courseTitle)              card.courseTitle  = meta.courseTitle;
            if (meta.overallScore !== undefined) card.overallScore = meta.overallScore;
            if (meta.readyForExam)             card.readyForExam = meta.readyForExam;
            card.domains = items;
            break;
        case 'learning-path':
            if (meta.subtitle)       card.subtitle       = meta.subtitle;
            if (meta.targetJob)      card.targetJob      = meta.targetJob;
            if (meta.totalDuration)  card.totalDuration  = meta.totalDuration;
            if (meta.overallProgress !== undefined) card.overallProgress = meta.overallProgress;
            card.modules = items;
            break;
        case 'lesson':
            if (meta.lessonTitle)    card.lessonTitle    = meta.lessonTitle;
            if (meta.lessonSubtitle) card.lessonSubtitle = meta.lessonSubtitle;
            if (meta.skill)          card.skill          = meta.skill;
            if (meta.difficulty)     card.difficulty     = meta.difficulty;
            card.steps = items;
            break;
        case 'objectives':
            if (meta.taskTitle) card.taskTitle = meta.taskTitle;
            card.objectives = items;
            break;
        case 'flashcard':
            if (meta.subtitle) card.subtitle = meta.subtitle;
            card.cards = items;
            break;
        case 'skill-quiz':
            if (meta.skillName)         card.skillName         = meta.skillName;
            if (meta.question)          card.question          = meta.question;
            if (meta.difficulty)        card.difficulty        = meta.difficulty;
            if (meta.currentScore !== undefined) card.currentScore = meta.currentScore;
            if (meta.totalQuestions2)   card.totalQuestions    = meta.totalQuestions2;
            if (meta.questionsAnswered) card.questionsAnswered = meta.questionsAnswered;
            if (meta.explanation)       card.explanation       = meta.explanation;
            card.options = items;
            break;
        case 'skills-assessment':
            card.skills = items;
            break;
        case 'skills-profile':
            card.skills = items;
            break;
        case 'certifications':
            card.certifications = items;
            break;
        case 'step-by-step':
            if (meta.subtitle)     card.subtitle     = meta.subtitle;
            if (meta.currentStep !== undefined) card.currentStep = meta.currentStep;
            card.steps = items;
            break;
        case 'milestone':
            if (meta.milestone)    card.milestone    = meta.milestone;
            if (meta.subtitle)     card.subtitle     = meta.subtitle;
            if (meta.encouragement) card.encouragement = meta.encouragement;
            if (meta.nextMilestone) card.nextMilestone = meta.nextMilestone;
            card.stats = items;
            break;
        case 'achievement':
            if (meta.achievementTitle) card.achievementTitle = meta.achievementTitle;
            if (meta.badge)            card.badge            = meta.badge;
            if (meta.date)             card.date             = meta.date;
            if (meta.message)          card.message          = meta.message;
            card.stats = items;
            break;
        case 'celebration':
            if (meta.type)     card.type     = meta.type;
            if (meta.subtitle) card.subtitle = meta.subtitle;
            card.details = items;
            break;
        case 'lesson-split':
            if (meta.content)    card.content    = meta.content;
            if (meta.badge)      card.badge      = meta.badge;
            if (meta.actionText) card.actionText = meta.actionText;
            card.bulletPoints = items.map((i: any) => i.text ?? '');
            break;
    }

    cards.push(card);
}

// ── Certified Layout Recipes → layout code mapping ───────────────────────────
// Imported from single source of truth. Also documented in glass-prompt.md.
import { CERTIFIED_LAYOUT_MAP } from '@/data/certifiedLayoutRecipes';

// ── Main parser ───────────────────────────────────────────────────────────────
export function parseDSL(raw: string): ParsedDSL {
    // 1. Extract block between sentinels — fuzzy regex (see SENTINEL_START_RE / SENTINEL_END_RE).
    // Graceful degradation: if sentinels not found, try to parse the whole string as DSL content.
    const startMatch = SENTINEL_START_RE.exec(raw);
    const endMatch   = SENTINEL_END_RE.exec(raw);
    const startIdx   = startMatch ? startMatch.index + startMatch[0].length : -1;
    const endIdx     = endMatch   ? endMatch.index : -1;
    const content = (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx)
        ? raw.slice(startIdx, endIdx)
        : raw;

    // 2. Clean lines
    const lines = content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('#'));

    const result: ParsedDSL = { cards: [] };

    // 3. Container accumulator
    let containerType: string | null    = null;
    let containerMeta: ContainerMeta   = {};
    let containerSpan: 'full' | undefined;
    let containerItems: Record<string, any>[] = [];

    const flush = () => {
        if (containerType) {
            flushContainer(containerType, containerMeta, containerItems, containerSpan, result.cards);
        }
        containerType  = null;
        containerMeta  = {};
        containerSpan  = undefined;
        containerItems = [];
    };

    for (const line of lines) {
        // Meta directives
        if (line.startsWith('layout:')) { result.layout = line.slice('layout:'.length).trim(); continue; }
        if (line.startsWith('badge:'))  { result.badge  = line.slice('badge:'.length).trim();  continue; }

        // Certified layout recipes → resolve to layout code
        if (line.startsWith('certified-layout:')) {
            const recipeName = line.slice('certified-layout:'.length).trim();
            const recipeLayout = CERTIFIED_LAYOUT_MAP[recipeName];
            if (recipeLayout) {
                result.layout = recipeLayout;
            } else {
                // Unknown recipe — log it, let GridView auto-layout handle fallback
                console.warn(`[parseDSL] Unknown certified layout: "${recipeName}"`);
            }
            continue;
        }

        // Optional span prefix
        let effectiveLine = line;
        let hasSpan = false;
        if (line.startsWith('span:')) {
            effectiveLine = line.slice('span:'.length);
            hasSpan = true;
        }

        const parts  = effectiveLine.split('|');
        const prefix = parts[0].toLowerCase().trim();
        const fields = parts.slice(1);

        // Item line for active container
        if (containerType
            && ALL_ITEM_PREFIXES.has(prefix)
            && CONTAINER_ITEM_PREFIXES[containerType] === prefix) {
            const item = parseItem(prefix, fields);
            if (item) containerItems.push(item);
            continue;
        }

        // Flat card
        if (FLAT_TYPES.has(prefix)) {
            flush();
            const card = parseFlatCard(prefix, fields, hasSpan ? 'full' : undefined);
            if (card) result.cards.push(card);
            continue;
        }

        // Container header
        if (CONTAINER_TYPES.has(prefix)) {
            flush();
            containerType  = prefix;
            containerMeta  = parseContainerHeader(prefix, fields);
            containerSpan  = hasSpan ? 'full' : undefined;
            containerItems = [];
            continue;
        }

        // Unknown — inform tele so the model knows what was lost
        console.warn(`[parseDSL] Unknown type: "${prefix}" — line skipped`);
    }

    flush();

    // After parsing, report any dropped lines to the model
    const allKnownTypes = new Set([...FLAT_TYPES, ...CONTAINER_TYPES, ...ALL_ITEM_PREFIXES,
        'layout', 'badge', 'certified-layout', 'span']);
    // Check was already done inline — the informTele fires from GridView for rendering issues.
    // Here we just return the clean result.
    return result;
}
