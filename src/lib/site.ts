/**
 * Site settings. In Phase 1 these move to the `site_settings` table (editable in admin).
 * Fields marked placeholder: true are stand-ins until the institute supplies real details.
 */
export const site = {
  name: 'Institute of Peace and Conflict Management',
  shortName: 'IPCM',
  parent: 'Taraba State University',
  tagline: 'Practical peace. Lasting impact.',
  address: {
    value: 'Institute of Peace and Conflict Management, Taraba State University, ATC, 660213, Jalingo, Taraba State, Nigeria',
    placeholder: false,
  },
  email: { value: 'ipcm@tsuniversity.edu.ng', placeholder: true },
  admissionsEmail: { value: 'ipcm-admissions@tsuniversity.edu.ng', placeholder: true },
  phone: { value: '+234 800 000 0000', placeholder: true },
  whatsapp: { value: '+234 800 000 0000', placeholder: true },
  hours: { value: 'Monday to Friday, 8:00am to 4:00pm; Saturdays during cohorts', placeholder: true },
  tsuUrl: 'https://www.tsuniversity.edu.ng',
  socials: [] as { label: string; href: string }[], // hidden until filled
  director: { name: 'Director, IPCM', placeholder: true },
  nextIntake: {
    label: 'February 2027 cohort',
    startDate: '2027-02-06',
    deadline: '2027-01-31',
    seats: 40,
    seatsLeft: 40,
    placeholder: true,
  },
  venue: { value: 'IPCM Lecture Hall, Taraba State University, Jalingo', placeholder: true },
}
