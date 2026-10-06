/**
 * Programme catalogue. Mirrors supabase/seed.sql. In Phase 1 pages read from the
 * `programmes` table; this module stays as the typed fallback and the source for the seed.
 */
export type Module = { number: number; title: string; summary: string }

export type Programme = {
  code: 'PCM' | 'NMA' | 'CEW' | 'PHR' | 'PSS'
  slug: string
  title: string
  shortTitle: string
  promise: string
  overview: string
  audience: string[]
  audienceTags: string[]
  modules: Module[]
  outcomes: string[]
  capstone: string
}

export const FORMAT = {
  durationWeeks: 8,
  schedule: 'Saturdays, 9:00am to 4:00pm',
  contactHours: 48,
  mode: 'In person, with materials and recordings in the portal',
  cohortSize: 40,
  assessment: [
    { label: 'Attendance and participation', weight: 20 },
    { label: 'Module exercises and quizzes', weight: 30 },
    { label: 'Capstone project', weight: 50 },
  ],
  award: 'At least 75% attendance and 50% overall. Distinction at 70% and above.',
  entry: [
    "Five O'Level credits including English Language (WASSCE, NECO or equivalent), or",
    'Age 25 or above with at least 2 years of relevant work or community experience.',
    'Graduates and serving officers are welcome.',
  ],
}

/** Amounts in kobo. */
export const FEES = {
  application: { base: 1_500_000, processing: 30_000 },
  tuition: { base: 3_500_000, processing: 30_000 },
}

export const programmes: Programme[] = [
  {
    code: 'PCM',
    slug: 'peace-conflict-management',
    title: 'Certificate in Peace and Conflict Management',
    shortTitle: 'Peace and Conflict Management',
    promise: 'Understand why conflicts start, how they escalate, and how to resolve them.',
    overview:
      'The foundation course of the institute. Participants learn the language, frameworks and practical tools of peace and conflict work, grounded in Nigerian and African realities.',
    audience: ['Anyone new to peace work', 'Public servants and community leaders', 'Graduates entering the field'],
    audienceTags: ['Public service', 'Community and faith leaders', 'NGOs'],
    modules: [
      { number: 1, title: 'Foundations of peace and conflict studies', summary: 'Concepts, types and levels of conflict; positive and negative peace.' },
      { number: 2, title: 'Causes and dynamics of conflict in Nigeria', summary: 'Identity, land, resources and politics; how conflicts escalate.' },
      { number: 3, title: 'Conflict handling styles and communication for peace', summary: 'Choosing a response; listening, framing and de-escalation.' },
      { number: 4, title: 'African and indigenous approaches to resolution', summary: 'Traditional institutions, elders, faith actors and restorative practice.' },
    ],
    outcomes: [
      'Explain a conflict using recognised analytical frameworks',
      'Choose an appropriate response for a given conflict',
      'Communicate in ways that calm rather than escalate',
    ],
    capstone: 'A written analysis of a conflict the participant knows first-hand.',
  },
  {
    code: 'NMA',
    slug: 'negotiation-mediation-adr',
    title: 'Certificate in Negotiation, Mediation and ADR',
    shortTitle: 'Negotiation, Mediation and ADR',
    promise: 'Lead negotiations and mediate disputes from first meeting to signed agreement.',
    overview:
      'A skills-intensive course built around role-play and simulated mediation. Participants practise every stage of a mediation, under observation, until it becomes second nature.',
    audience: ['Traditional and religious leaders', 'Lawyers and HR professionals', 'Community and organisational leaders'],
    audienceTags: ['Legal and HR', 'Community and faith leaders', 'Public service'],
    modules: [
      { number: 1, title: 'Principles of negotiation', summary: 'Interests versus positions, power, preparation and BATNA.' },
      { number: 2, title: 'The mediation process and ethics', summary: 'Opening, storytelling, issue mapping, options, agreement; neutrality and confidentiality.' },
      { number: 3, title: 'ADR in Nigerian law and customary practice', summary: 'Arbitration, conciliation, multi-door courthouses and customary dispute resolution.' },
      { number: 4, title: 'Community, workplace and family mediation', summary: 'Practicum: supervised simulations across common Nigerian dispute types.' },
    ],
    outcomes: [
      'Run a structured, interest-based negotiation',
      'Conduct a mediation from opening to written agreement',
      'Draft a clear, enforceable settlement',
    ],
    capstone: 'A graded, observed mediation simulation.',
  },
  {
    code: 'CEW',
    slug: 'conflict-analysis-early-warning',
    title: 'Certificate in Conflict Analysis, Early Warning and Early Response',
    shortTitle: 'Conflict Analysis and Early Warning',
    promise: 'Spot conflict before it turns violent, and trigger the right response in time.',
    overview:
      'Participants learn to analyse conflict systematically, track warning signs, and work with security, government and traditional actors to act early.',
    audience: ['Security agencies', 'Local government staff', 'NGO and community monitors'],
    audienceTags: ['Security', 'Public service', 'NGOs'],
    modules: [
      { number: 1, title: 'Conflict analysis tools', summary: 'Conflict mapping, stakeholder analysis and the conflict tree.' },
      { number: 2, title: 'Early warning indicators and data', summary: 'Choosing indicators, collecting reliable information, ethics.' },
      { number: 3, title: 'Reporting, verification and digital monitoring', summary: 'Verifying reports, avoiding rumour, using simple digital tools.' },
      { number: 4, title: 'Designing early response', summary: 'Coordinating with security, traditional and government actors.' },
    ],
    outcomes: [
      'Produce a clear conflict analysis',
      'Set up an indicator-based watch system',
      'Escalate warnings to the right actors at the right time',
    ],
    capstone: 'An early-warning plan for a named LGA or community.',
  },
  {
    code: 'PHR',
    slug: 'peacebuilding-humanitarian-recovery',
    title: 'Certificate in Peacebuilding, Humanitarian Response and Post-Conflict Recovery',
    shortTitle: 'Peacebuilding and Recovery',
    promise: 'Help communities recover, reconcile and rebuild after violence.',
    overview:
      'For people working with communities affected by conflict and displacement. The course joins humanitarian principles with long-term peacebuilding and recovery.',
    audience: ['NGO and humanitarian staff', 'IDP camp and SEMA officials', 'Social workers and faith-based responders'],
    audienceTags: ['NGOs', 'Public service', 'Community and faith leaders'],
    modules: [
      { number: 1, title: 'Peacebuilding theory and practice', summary: 'From ceasefire to sustainable peace; local ownership.' },
      { number: 2, title: 'Humanitarian principles and displacement', summary: 'Managing IDPs and returnees with dignity and protection.' },
      { number: 3, title: 'Trauma, reconciliation and transitional justice', summary: 'Trauma awareness, dialogue and truth-telling.' },
      { number: 4, title: 'Livelihoods, reintegration and recovery', summary: 'Conflict-sensitive recovery and reintegration programmes.' },
    ],
    outcomes: [
      'Apply humanitarian principles in practice',
      'Design a reconciliation activity',
      'Plan conflict-sensitive recovery work',
    ],
    capstone: 'A recovery or peacebuilding project design for an affected community.',
  },
  {
    code: 'PSS',
    slug: 'peace-security-studies',
    title: 'Certificate in Peace and Security Studies',
    shortTitle: 'Peace and Security Studies',
    promise: 'Connect security work to lasting peace, within human-rights standards.',
    overview:
      'For officers and those who work with them. The course links security practice to peace outcomes, with a focus on the conflicts most common in the North-East and Middle Belt.',
    audience: ['Police, NSCDC and military officers', 'Vigilance and community security groups', 'Security advisers'],
    audienceTags: ['Security'],
    modules: [
      { number: 1, title: 'Human security and the Nigerian security architecture', summary: 'Who does what, and how human security changes the question.' },
      { number: 2, title: 'Civil-military and police-community relations', summary: 'Building trust and cooperation with communities.' },
      { number: 3, title: 'Farmer-herder, banditry and resource conflicts', summary: 'Drivers, dynamics, and small arms and light weapons.' },
      { number: 4, title: 'Human rights and conflict-sensitive operations', summary: 'Rules of engagement, accountability and do-no-harm.' },
    ],
    outcomes: [
      'Analyse threats through a human-security lens',
      'Strengthen trust between security agencies and communities',
      'Act within human-rights standards',
    ],
    capstone: 'A policy brief on a security challenge in the participant’s area of operation.',
  },
]

export function getProgramme(slug: string) {
  return programmes.find((p) => p.slug === slug)
}
