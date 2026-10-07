/**
 * Website copy from the approved Content & Programme Brief. Kept in one place so the
 * institute can review and edit it (later from the admin).
 */
import { FEES, FORMAT } from './programmes'
import { formatNaira } from './utils'

export const identity =
  'The Institute of Peace and Conflict Management (IPCM), Taraba State University, is a professional training and research institute that turns peace knowledge into practical skill for the people who manage conflict every day.'

export const vision =
  'To be Africa’s leading centre for practical peace education, where knowledge rooted in local realities builds peaceful communities and resilient institutions.'

export const mission =
  'To equip individuals, communities and institutions with the knowledge, skills and ethics to prevent, manage and transform conflict, through rigorous training, evidence-based research and active partnership with the people of Taraba State, Nigeria and beyond.'

export const mandate = [
  { title: 'Train', body: 'Train professionals and community actors through accredited certificate programmes in peace and conflict management.' },
  { title: 'Research', body: 'Conduct and publish research on the causes, dynamics and resolution of conflict, with a focus on the North-East and Middle Belt.' },
  { title: 'Advise', body: 'Provide advisory and mediation support to government, traditional institutions, security agencies and civil society.' },
  { title: 'Partner', body: 'Build partnerships with national and international peace institutions to raise the standard of peace practice in the region.' },
]

export const values = [
  { title: 'Integrity', body: 'We teach and practise honesty, fairness and accountability.' },
  { title: 'Inclusion', body: 'Every community, faith, gender and generation has a place at the table.' },
  { title: 'Evidence', body: 'Our training and advice rest on research, not assumption.' },
  { title: 'Practice', body: 'Knowledge counts when it changes what people do.' },
  { title: 'Respect for local wisdom', body: 'Indigenous methods of dispute resolution sit alongside global best practice.' },
]

export const directorWelcome = [
  'Peace is not the absence of conflict. It is the presence of people and institutions able to handle conflict without violence.',
  'Taraba State knows the cost of conflict, and it also knows the strength of communities that choose dialogue. The Institute of Peace and Conflict Management was established to build on that strength. Our programmes are short, practical and taught by people who have done this work, so that what you learn on Saturday you can use on Monday.',
  'Whether you serve in a security agency, a ministry, a palace, a pulpit, a newsroom or a community group, you will find a programme here built for your reality. I welcome you to learn with us, and to help us build a more peaceful Taraba, Nigeria and Africa.',
]

export const audiences = ['Security officers', 'Public servants', 'Traditional and religious leaders', 'NGO and humanitarian staff', 'Journalists', 'Graduates entering peace work']

const appFee = formatNaira(FEES.application.base + FEES.application.processing)
const tuition = formatNaira(FEES.tuition.base + FEES.tuition.processing)

export type Faq = { q: string; a: string }
export const faqGroups: { id: string; title: string; items: Faq[] }[] = [
  {
    id: 'applying',
    title: 'Applying',
    items: [
      { q: 'Who can apply?', a: "Anyone with five O'Level credits including English Language (WASSCE, NECO or equivalent), or anyone aged 25 or above with at least two years of relevant work or community experience. Graduates and serving officers are welcome." },
      { q: 'How do I apply?', a: `Create an account, choose your programme and intake, and pay the ${appFee} application fee. Then complete the form and upload your documents. Your progress saves as you go, and submitting is free.` },
      { q: 'What documents do I need?', a: 'A passport photograph on a white background (JPG or PNG), your O’Level result or highest qualification (PDF), and a means of identification such as your NIN slip, voter’s card, international passport or driver’s licence. Mature applicants also upload a CV, and sponsored officers upload a sponsorship letter.' },
      { q: 'Can I apply for more than one programme?', a: 'One application at a time. Many participants take a second programme in a later intake; graduates of three certificates may later qualify for an Advanced Certificate, subject to Senate approval.' },
      { q: 'How long does the review take?', a: 'Most applications are reviewed within a few working days. You will receive an email at each step and can follow progress in your portal.' },
      { q: 'What if a document is rejected?', a: 'You will be told exactly what to fix. Replace the file in your portal and your application goes straight back to the review team. You do not pay again.' },
    ],
  },
  {
    id: 'fees',
    title: 'Fees and payment',
    items: [
      { q: 'How much does a programme cost?', a: `The application fee is ${appFee} and tuition is ${tuition}. Each includes a ₦300 processing charge. There is no acceptance fee.` },
      { q: 'How do I pay?', a: 'Online through Paystack by card, bank transfer or USSD. You get a receipt with a QR code straight away, and a copy by email.' },
      { q: 'Is the application fee refundable?', a: 'No. Please check the entry requirements before you pay. The checklist on the payment page helps you confirm you are eligible.' },
      { q: 'When do I pay tuition?', a: `After you receive an offer. You have 30 days to pay; once you pay you are admitted immediately and receive your registration number and admission letter.` },
      { q: 'Can my organisation pay for several staff?', a: 'Yes. Organisations can nominate staff and pay with a single invoice. Contact the admissions office to arrange it.' },
      { q: 'My money left my account but the payment shows pending.', a: 'Wait a few minutes and refresh. Payments are confirmed automatically even if you closed the page, and you will never be charged twice. If it is still pending after an hour, contact us with your payment reference.' },
    ],
  },
  {
    id: 'classes',
    title: 'Programmes and classes',
    items: [
      { q: 'When do classes hold?', a: `${FORMAT.schedule}, for ${FORMAT.durationWeeks} weeks (${FORMAT.contactHours} contact hours). Course materials and recordings are in your student portal.` },
      { q: 'Can I keep my job while studying?', a: 'Yes. The programmes are built for working adults and run on Saturdays only.' },
      { q: 'How many people are in a class?', a: `Up to ${FORMAT.cohortSize} participants per programme, so everyone takes part in discussions, role-plays and group work.` },
      { q: 'How am I assessed?', a: FORMAT.assessment.map((a) => `${a.label} ${a.weight}%`).join(', ') + '. The capstone is a practical project on a real conflict or intervention in your own workplace or community.' },
      { q: 'What if I miss a Saturday?', a: 'Recordings and materials are in your portal, but you need at least 75% attendance to receive the certificate. Tell your facilitator in advance if you will be absent.' },
    ],
  },
  {
    id: 'certificates',
    title: 'Certificates',
    items: [
      { q: 'What certificate will I receive?', a: 'A certificate of Taraba State University, with a unique certificate number and a QR code that anyone can scan to confirm it is genuine.' },
      { q: 'What do I need to pass?', a: FORMAT.award },
      { q: 'How can an employer check my certificate, receipt or admission letter?', a: 'Scan the QR code on the document, or enter the certificate number on the Verify page of this website.' },
    ],
  },
  {
    id: 'account',
    title: 'Your account',
    items: [
      { q: 'I forgot my password.', a: 'Use “Forgot password” on the login page. If you cannot receive the email, contact the admissions office and they will help you.' },
      { q: 'I typed my email wrongly when registering.', a: 'Contact the admissions office with your name and phone number. They can correct it for you.' },
      { q: 'Where are my receipts and admission letter?', a: 'In your portal, under Payments and on your application page. They are also emailed to you.' },
    ],
  },
]

export type Person = { name: string; role: string; group: 'director' | 'board' | 'staff' | 'facilitator'; bio?: string; expertise?: string[]; photo?: string | null; placeholder: boolean }

/** Shown until real profiles are added (people table). Every entry is a placeholder. */
export const placeholderPeople: Person[] = [
  { name: 'Prof. Elijah Akombo', role: 'Director', group: 'director', bio: 'Leads the Institute’s training, research and partnerships, and its work with government, traditional institutions, security agencies and civil society.', photo: '/people/elijah-akombo-square.jpg', placeholder: false },
  { name: 'Name to be announced', role: 'Deputy Director, Academic Programmes', group: 'staff', expertise: ['Curriculum', 'Assessment'], placeholder: true },
  { name: 'Name to be announced', role: 'Programmes Coordinator', group: 'staff', expertise: ['Cohort management', 'Partnerships'], placeholder: true },
  { name: 'Name to be announced', role: 'Admissions Officer', group: 'staff', expertise: ['Admissions', 'Student support'], placeholder: true },
  { name: 'Name to be announced', role: 'Chair, Advisory Board', group: 'board', placeholder: true },
  { name: 'Name to be announced', role: 'Member, Advisory Board', group: 'board', placeholder: true },
  { name: 'Name to be announced', role: 'Member, Advisory Board', group: 'board', placeholder: true },
  { name: 'Facilitator', role: 'Negotiation and mediation', group: 'facilitator', expertise: ['NMA'], placeholder: true },
  { name: 'Facilitator', role: 'Early warning and conflict analysis', group: 'facilitator', expertise: ['CEW'], placeholder: true },
  { name: 'Facilitator', role: 'Humanitarian response and recovery', group: 'facilitator', expertise: ['PHR'], placeholder: true },
  { name: 'Facilitator', role: 'Peace and security studies', group: 'facilitator', expertise: ['PSS'], placeholder: true },
]

export type Post = { kind: string; title: string; excerpt: string; date?: string; placeholder: boolean; pdf?: string; author?: string }
export const POST_KIND: Record<string, string> = { policy_brief: 'Policy brief', publication: 'Publication', event_report: 'Event report', research_note: 'Research note', news: 'News' }

export const placeholderPosts: Post[] = [
  { kind: 'policy_brief', title: 'Farmer-herder relations in southern Taraba: what works for prevention', excerpt: 'What local peace committees, traditional rulers and security agencies have learned about stopping disputes over land and water from turning violent.', placeholder: true },
  { kind: 'event_report', title: 'Community dialogue on youth and peace in Jalingo', excerpt: 'Highlights and commitments from a day of dialogue with young people, community leaders and local government.', placeholder: true },
  { kind: 'research_note', title: 'Early warning in practice: lessons from local peace committees', excerpt: 'How community monitors collect, verify and escalate warning signs, and where the system breaks down.', placeholder: true },
]

export const researchThemes = [
  { title: 'Land, resources and livelihoods', body: 'Farmer-herder relations, boundary disputes and access to water and grazing.' },
  { title: 'Early warning and response', body: 'Indicators, community monitoring and coordination between local actors.' },
  { title: 'Displacement and recovery', body: 'IDPs and returnees, reintegration and conflict-sensitive recovery.' },
  { title: 'Security and human rights', body: 'Police-community relations, civil-military relations and small arms.' },
  { title: 'Traditional and religious institutions', body: 'Customary dispute resolution and interfaith peacebuilding.' },
  { title: 'Women, youth and peace', body: 'Participation of women and young people in preventing and resolving conflict.' },
]
