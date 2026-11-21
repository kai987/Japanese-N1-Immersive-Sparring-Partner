import type { LiveUnitGroup } from '../data/live-reaction-units.ts'

// Reviewed against the rendered entries, readings, notes and usage explanations.
// Keep source transcripts intact for provenance and published audio identities.
// Exact IDs make new or unreviewed source context visible by default; do not
// hide every note, or infer redundancy from a phrase being part of a longer quote.
const integratedSourcesByDate: Record<string, readonly string[]> = {
  '2026-09-30': ['exhaust', 'request', 'yashinai'],
  '2026-10-29': [
    'dore-dakke', 'space-wo', 'route-wo', 'guide-prolong', 'moteasobu', 'hachiawase',
    'refusal', 'kata', 'takaga', 'prohibition', 'hagukumu', 'kitaihazure', 'chittomo',
    'loanwords', 'perception', 'impression',
  ],
  '2026-10-30': [
    'extract', 'appearance', 'chew', 'benefactive-causative', 'show', 'prohibition',
    'obligation', 'sekkaku-wazawaza', 'corners', 'soft-suggestion', 'sunshine',
    'decide-suru', 'alternatives', 'whether', 'give-feed', 'forced-feed', 'konoaida',
    'dryness', 'touch-panel', 'hottoku', 'wake', 'hearing', 'voluntary', 'water-plants',
    'laziness-thought', 'frequency', 'revisit', 'winter', 'future-time', 'youni',
    'diligence', 'spoken-openers',
  ],
  '2026-11-03': [
    'boomerang', 'thrill', 'notify-call', 'noun-modifiers', 'conquer-tree',
    'anger-control', 'unnoticed', 'result-time', 'soredemo', 'achievement',
    'deliberate', 'social-idioms', 'half-eaten', 'refusal', 'noodles', 'fantasy',
    'position', 'show', 'glare', 'body-words', 'mood', 'negative-command', 'origin',
    'pleasure', 'timing', 'mama-shimau', 'zutsu', 'call-purpose', 'manner-words',
    'absence', 'reflect', 'button',
  ],
  '2026-11-04': [
    'sharing', 'chew-and-overdo', 'recently-and-strange', 'hin-jaku',
    'location-and-eco', 'tsugo', 'action-timing', 'personal-distance', 'datte-tatte',
    'follow-peek-stop', 'unsightly', 'caveat-and-agreement', 'taste-and-texture',
    'first-kiss', 'kisses', 'perception', 'full-and-savor', 'explanatory-conjecture',
    'stare-and-glance', 'senses-emerge', 'food-and-table', 'body-sounds',
    'sticky-and-mold', 'mukamuka',
  ],
  '2026-11-05': [
    'replace-and-rearrange', 'concern-and-serious-effort', 'scolding-and-excess',
    'no-need-and-needless-to-say', 'not-at-all-and-benefit', 'reproach-and-consequence',
    'datte-inclusion-and-hearsay', 'searching-for-words', 'extreme-and-any',
    'serious-and-tense', 'suggestions-with-tara', 'sae-minimum-condition',
    'consequence-and-absence', 'somehow-and-vaguely', 'imagine-and-get-in-the-mood',
    'shelves', 'warito-warini', 'janai-ka', 'narenakya', 'holiday-topics', 'hierarchy',
    'beki-past', 'feelings-and-wishes', 'datte-damon', 'occasional-boredom',
  ],
  '2026-11-13': [
    'excess', 'dawn-and-dusk', 'no-end', 'clean-up', 'variety-and-each',
    'return-contraction', 'ownership', 'pointed-questions', 'conjecture', 'this-much',
    'meaning-equivalence', 'shopping-tools', 'heard-news', 'action-choices',
    'never-again', 'hot-food-sound', 'gaze-and-games', 'new-obligation',
    'gathering-place', 'comparison-and-reframing', 'unsteady-and-direction',
    'physical-sensations', 'causative-passive-basics', 'hear-causative-passive',
    'su-ending-causative-passive', 'trouble-and-resolution', 'recycling-and-clubs',
    'plenty-and-casual-completion', 'delay-and-propagation',
  ],
  '2026-11-18': [
    'growth-and-diving', 'hidden-talent', 'gratitude-and-good-news',
    'bottom-and-reserve-strength', 'reassured-and-uneasy', 'unusual-cleaning',
    'cleaning-and-discovery', 'fresh-and-clear', 'interpersonal-distance',
    'cigarette-litter', 'critical-concession', 'verbal-habit', 'relative-expectation',
    'thanks-to-guidance', 'ending-you-ni-instructions', 'ending-you-ni-wishes',
    'exaggerated-and-rough', 'cheeky-and-greedy', 'attention-and-noticing',
    'whichever-alternative', 'wearing-armband', 'fall-into-and-entrap',
    'escape-concession', 'demo-even-and-anyone', 'strange-events',
    'following-direction', 'ikenai-response', 'conditional-advice',
    'manner-and-malfunction', 'only-said', 'queue-cutting', 'rough-call-aside',
    'ask-for-leniency', 'effectiveness-and-winning', 'seize-miss-overlook',
    'even-if-failure', 'want-and-want-someone-to', 'passive-desire',
    'wanted-action-relative-clause', 'name-plus-desu-ga',
  ],
}

const integratedSourceIds = new Set(Object.entries(integratedSourcesByDate)
  .flatMap(([date, names]) => names.map(name => `live-${date}-${name}`)))

/** Shared by rendering and search, so every search hit has visible text. */
export function getVisibleLiveSource(group: Pick<LiveUnitGroup, 'id' | 'source'>): LiveUnitGroup['source'] {
  return integratedSourceIds.has(group.id) ? undefined : group.source
}
