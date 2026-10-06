/** Demo data for the Phase 0 design preview only. Replaced by Supabase queries in Phase 1/2. */
export const demoStudent = {
  name: 'Amina Bello',
  firstName: 'Amina',
  regNo: 'TSU/IPCM/NMA/2027/0042',
  programmeCode: 'NMA',
  programme: 'Negotiation, Mediation and ADR',
  cohort: 'NMA – February 2027',
}

export const demoModules = [
  { n: 1, title: 'Principles of negotiation', facilitator: 'Dr. Facilitator One', progress: 100, status: 'completed', score: '24/30' },
  { n: 2, title: 'The mediation process and ethics', facilitator: 'Dr. Facilitator Two', progress: 60, status: 'in_progress', score: '—' },
  { n: 3, title: 'ADR in Nigerian law and customary practice', facilitator: 'Barr. Facilitator Three', progress: 0, status: 'not_started', score: '—' },
  { n: 4, title: 'Community, workplace and family mediation', facilitator: 'Dr. Facilitator One', progress: 0, status: 'not_started', score: '—' },
] as const

export const demoWeek = [
  { day: 'Mon', date: 1, iso: '2027-03-01', active: false },
  { day: 'Tue', date: 2, iso: '2027-03-02', active: false },
  { day: 'Wed', date: 3, iso: '2027-03-03', active: false },
  { day: 'Thu', date: 4, iso: '2027-03-04', active: false },
  { day: 'Fri', date: 5, iso: '2027-03-05', active: false },
  { day: 'Sat', date: 6, iso: '2027-03-06', active: true },
  { day: 'Sun', date: 7, iso: '2027-03-07', active: false },
]

export const demoSessions = [
  { time: '9:00am', end: '10:30am', title: 'Mediation stages: opening and storytelling', facilitator: 'Dr. Facilitator Two', tone: 'teal' },
  { time: '10:45am', end: '12:30pm', title: 'Role-play: land boundary dispute', facilitator: 'Dr. Facilitator Two', tone: 'amber' },
  { time: '12:30pm', end: '1:30pm', title: 'Lunch break', facilitator: '', tone: 'neutral' },
  { time: '1:30pm', end: '3:00pm', title: 'Ethics: neutrality and confidentiality', facilitator: 'Barr. Facilitator Three', tone: 'navy' },
  { time: '3:15pm', end: '4:00pm', title: 'Reflection and peer feedback', facilitator: 'Cohort', tone: 'success' },
] as const

export const demoAnnouncements = [
  { title: 'Module 2 reading pack is now available', when: '2 days ago' },
  { title: 'Capstone briefing moved to Saturday 13 March', when: '5 days ago' },
]
