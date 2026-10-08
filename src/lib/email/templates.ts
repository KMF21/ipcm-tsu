import { site } from '@/lib/site'

/** Everything a template needs to build links and the logo. */
export type EmailContext = { baseUrl: string }
export type Email = { subject: string; html: string; text: string }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const C = { navy: '#0F1F3D', teal: '#0E7C6B', ink: '#1C2536', muted: '#4A5468', line: '#E3E7EE', canvas: '#F6F8FB', tealBg: '#E8F5F2', amberBg: '#FDF6E7', crimsonBg: '#FDF1F2' }
const font = `font-family:Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`

type Block =
  | { p: string }
  | { rows: [string, string][] }
  | { list: string[] }
  | { note: string; tone?: 'info' | 'warning' | 'error' }
  | { button: { label: string; url: string } }

/** Plain text for the HTML-less version: strip the light markup used in paragraphs. */
const plain = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')

function render(ctx: EmailContext, o: { preheader: string; heading: string; greeting: string; blocks: Block[]; signoff?: string }) {
  const parts = o.blocks.map((b) => {
    if ('p' in b) return `<p style="margin:0 0 16px;${font};font-size:16px;line-height:26px;color:${C.ink}">${b.p}</p>`
    if ('rows' in b)
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:${C.canvas};border-radius:12px"><tbody>${b.rows
        .map(([k, v]) => `<tr><td style="padding:10px 16px 0;${font};font-size:14px;color:${C.muted};width:38%;vertical-align:top">${esc(k)}</td><td style="padding:10px 16px 0;${font};font-size:15px;font-weight:600;color:${C.ink};vertical-align:top;word-break:break-word;overflow-wrap:anywhere">${esc(v)}</td></tr>`)
        .join('')}<tr><td colspan="2" style="height:10px"></td></tr></tbody></table>`
    if ('list' in b) return `<ul style="margin:0 0 16px;padding-left:20px;${font};font-size:16px;line-height:26px;color:${C.ink}">${b.list.map((i) => `<li style="margin:0 0 6px">${i}</li>`).join('')}</ul>`
    if ('note' in b) {
      const bg = b.tone === 'error' ? C.crimsonBg : b.tone === 'warning' ? C.amberBg : C.tealBg
      return `<p style="margin:0 0 20px;padding:14px 16px;background:${bg};border-radius:12px;${font};font-size:15px;line-height:24px;color:${C.ink}">${b.note}</p>`
    }
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:999px;background:${C.teal}"><a href="${esc(b.button.url)}" style="display:inline-block;padding:14px 28px;${font};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${esc(b.button.label)}</a></td></tr></table>`
  })

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(o.heading)}</title></head>
<body style="margin:0;padding:0;background:${C.canvas}">
<span style="display:none!important;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.canvas}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${C.line}">
<tr><td style="height:6px;background:${C.navy}"></td></tr><tr><td style="height:3px;background:${C.teal}"></td></tr>
<tr><td style="padding:24px 28px 8px">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:middle"><img src="${esc(ctx.baseUrl)}/tsu-logo.png" width="44" height="44" alt="Taraba State University" style="display:block;border:0"></td>
    <td style="vertical-align:middle;padding-left:12px;${font};font-size:16px;font-weight:700;color:${C.navy};line-height:20px">${esc(site.name)}<br><span style="font-size:13px;font-weight:400;color:${C.muted}">${esc(site.parent)}</span></td>
  </tr></table>
</td></tr>
<tr><td style="padding:16px 24px 8px;word-break:break-word;overflow-wrap:break-word">
  <h1 style="margin:0 0 16px;${font};font-size:24px;line-height:32px;font-weight:700;color:${C.navy}">${esc(o.heading)}</h1>
  <p style="margin:0 0 16px;${font};font-size:16px;line-height:26px;color:${C.ink}">${esc(o.greeting)}</p>
  ${parts.join('\n  ')}
  <p style="margin:8px 0 24px;${font};font-size:16px;line-height:26px;color:${C.ink}">${o.signoff ?? 'Admissions Office'}<br><span style="color:${C.muted}">${esc(site.name)}</span></p>
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid ${C.line};${font};font-size:13px;line-height:20px;color:${C.muted}">
  ${esc(site.address.value)}<br>Questions? Reply to this email or write to <a href="mailto:${esc(site.admissionsEmail.value)}" style="color:${C.teal}">${esc(site.admissionsEmail.value)}</a>.<br>
  You are receiving this because you applied on the Institute’s website.
</td></tr>
</table></td></tr></table></body></html>`

  const text = [
    o.heading,
    '',
    o.greeting,
    '',
    ...o.blocks.flatMap((b) => {
      if ('p' in b) return [plain(b.p), '']
      if ('rows' in b) return [...b.rows.map(([k, v]) => `${k}: ${v}`), '']
      if ('list' in b) return [...b.list.map((i) => `- ${plain(i)}`), '']
      if ('note' in b) return [plain(b.note), '']
      return [`${b.button.label}: ${b.button.url}`, '']
    }),
    plain(o.signoff ?? 'Admissions Office'),
    site.name,
    '',
    site.address.value,
  ].join('\n')

  return { html, text }
}

const naira = (kobo: number) => '₦' + (kobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })
const hi = (first: string) => `Dear ${first || 'Applicant'},`

export function applicationFeePaid(ctx: EmailContext, d: { firstName: string; programme: string; receiptNo: string; amountKobo: number }): Email {
  const subject = `Payment received: application fee (${d.receiptNo})`
  return { subject, ...render(ctx, {
    preheader: 'Your application fee is paid. Finish your application next.',
    heading: 'Application fee received',
    greeting: hi(d.firstName),
    blocks: [
      { p: `Thank you. We have received your application fee for the <strong>${esc(d.programme)}</strong>. Your receipt is attached.` },
      { rows: [['Receipt number', d.receiptNo], ['Amount paid', naira(d.amountKobo)]] },
      { p: 'Next, complete the rest of your application and upload your documents. Your progress saves as you go, and submitting is free.' },
      { button: { label: 'Continue my application', url: `${ctx.baseUrl}/portal/apply` } },
    ],
  }) }
}

export function applicationSubmitted(ctx: EmailContext, d: { firstName: string; ref: string; programme: string }): Email {
  return { subject: `Application received: ${d.ref}`, ...render(ctx, {
    preheader: 'We have your application and will review it shortly.',
    heading: 'We have your application',
    greeting: hi(d.firstName),
    blocks: [
      { p: `Thank you for applying for the <strong>${esc(d.programme)}</strong>. The admissions team will check your details and documents. Most reviews take a few working days.` },
      { rows: [['Application number', d.ref]] },
      { p: 'We will email you when there is a decision. You can also check progress in your portal at any time.' },
      { button: { label: 'View my application', url: `${ctx.baseUrl}/portal/apply` } },
    ],
  }) }
}

export function changesRequested(ctx: EmailContext, d: { firstName: string; items: { label: string; reason: string }[]; note?: string | null }): Email {
  return { subject: 'Action needed: please replace a document', ...render(ctx, {
    preheader: 'One or more documents need replacing before we can continue.',
    heading: 'Please replace a document',
    greeting: hi(d.firstName),
    blocks: [
      { p: 'We reviewed your application. Before we can continue, please replace the following:' },
      { list: d.items.map((i) => `<strong>${esc(i.label)}</strong>: ${esc(i.reason)}`) },
      ...(d.note ? [{ note: `Note from admissions: ${esc(d.note)}` } as Block] : []),
      { p: 'Open your documents, remove the file marked “Rejected” and upload a new one. Your application goes back to the review team straight away.' },
      { button: { label: 'Fix my documents', url: `${ctx.baseUrl}/portal/apply/documents` } },
    ],
  }) }
}

export function offerMade(ctx: EmailContext, d: { firstName: string; programme: string; cohort: string; startDate: string; payBy: string; amountKobo: number }): Email {
  return { subject: `Offer of admission: ${d.programme}`, ...render(ctx, {
    preheader: `Congratulations. Pay tuition by ${d.payBy} to secure your seat.`,
    heading: 'Congratulations, you have an offer',
    greeting: hi(d.firstName),
    blocks: [
      { p: `We are pleased to offer you a place on the <strong>${esc(d.programme)}</strong>.` },
      { rows: [['Intake', d.cohort], ['Classes start', d.startDate], ['Tuition', naira(d.amountKobo)], ['Pay by', d.payBy]] },
      { note: `To accept, pay your tuition by <strong>${esc(d.payBy)}</strong>. You will be admitted straight away and receive your registration number and admission letter. After that date the offer lapses and your seat may go to someone else.`, tone: 'info' },
      { button: { label: 'Pay tuition', url: `${ctx.baseUrl}/portal/apply/pay` } },
    ],
  }) }
}

export function offerReminder(ctx: EmailContext, d: { firstName: string; programme: string; payBy: string; daysLeft: number; amountKobo: number }): Email {
  const when = d.daysLeft <= 1 ? 'tomorrow' : `in ${d.daysLeft} days`
  return { subject: `Reminder: your offer ends ${when}`, ...render(ctx, {
    preheader: `Pay tuition by ${d.payBy} to keep your place.`,
    heading: `Your offer ends ${when}`,
    greeting: hi(d.firstName),
    blocks: [
      { p: `This is a reminder that your offer for the <strong>${esc(d.programme)}</strong> ends on <strong>${esc(d.payBy)}</strong>.` },
      { rows: [['Tuition', naira(d.amountKobo)], ['Last day to pay', d.payBy]] },
      { p: 'If you are waiting for a sponsor or need more time, reply to this email before the deadline and we will see what we can do.' },
      { button: { label: 'Pay tuition', url: `${ctx.baseUrl}/portal/apply/pay` } },
    ],
  }) }
}

export function offerLapsed(ctx: EmailContext, d: { firstName: string; programme: string; payBy: string }): Email {
  return { subject: 'Your offer has expired', ...render(ctx, {
    preheader: 'Tuition was not paid in time. Contact us if you still want to join.',
    heading: 'Your offer has expired',
    greeting: hi(d.firstName),
    blocks: [
      { p: `Tuition for the <strong>${esc(d.programme)}</strong> was not paid by ${esc(d.payBy)}, so the offer has lapsed and the seat may be given to another applicant.` },
      { p: 'If you still want to join this intake, reply to this email as soon as possible. If seats remain, admissions may be able to extend your offer. You can also apply again for a later intake from your portal.' },
      { button: { label: 'Open my portal', url: `${ctx.baseUrl}/portal/apply` } },
    ],
  }) }
}

export function offerExtended(ctx: EmailContext, d: { firstName: string; programme: string; payBy: string }): Email {
  return { subject: `Your offer has been extended to ${d.payBy}`, ...render(ctx, {
    preheader: `You now have until ${d.payBy} to pay tuition.`,
    heading: 'More time to accept your offer',
    greeting: hi(d.firstName),
    blocks: [
      { p: `Admissions has extended your offer for the <strong>${esc(d.programme)}</strong>. The new last day to pay tuition is <strong>${esc(d.payBy)}</strong>.` },
      { button: { label: 'Pay tuition', url: `${ctx.baseUrl}/portal/apply/pay` } },
    ],
  }) }
}

export function applicationDeclined(ctx: EmailContext, d: { firstName: string; programme: string; reason: string }): Email {
  return { subject: 'Update on your application', ...render(ctx, {
    preheader: 'A decision has been made on your application.',
    heading: 'Update on your application',
    greeting: hi(d.firstName),
    blocks: [
      { p: `Thank you for applying for the <strong>${esc(d.programme)}</strong>. After careful review, we are unable to offer you a place in this intake.` },
      { note: `Reason: ${esc(d.reason)}`, tone: 'warning' },
      { p: 'You are welcome to apply again for a later intake. If you have questions about this decision, reply to this email.' },
      { button: { label: 'Open my portal', url: `${ctx.baseUrl}/portal/apply` } },
    ],
  }) }
}

export function admitted(ctx: EmailContext, d: { firstName: string; regNo: string; programme: string; cohort: string; startDate: string; venue: string; receiptNo: string; amountKobo: number }): Email {
  return { subject: `Welcome to IPCM: admission confirmed (${d.regNo})`, ...render(ctx, {
    preheader: 'Tuition received. Your admission letter and receipt are attached.',
    heading: 'You’re admitted. Welcome!',
    greeting: hi(d.firstName),
    blocks: [
      { p: `Your tuition has been received and your admission to the <strong>${esc(d.programme)}</strong> is confirmed. Your <strong>admission letter</strong> and <strong>payment receipt</strong> are attached.` },
      { rows: [['Registration number', d.regNo], ['Intake', d.cohort], ['First class', d.startDate], ['Venue', d.venue], ['Receipt', `${d.receiptNo} (${naira(d.amountKobo)})`]] },
      { p: 'Bring your admission letter (printed or on your phone) and a valid ID on the first day. Class details and your class group link will appear in your portal before classes begin.' },
      { button: { label: 'Open my portal', url: `${ctx.baseUrl}/portal` } },
    ],
    signoff: 'With best wishes,<br>Admissions Office',
  }) }
}

export function contactReceived(ctx: EmailContext, d: { name: string; topic: string }): Email {
  return { subject: 'We have your message', ...render(ctx, {
    preheader: 'Thank you for contacting the Institute. We reply within two working days.',
    heading: 'Thank you for getting in touch',
    greeting: `Dear ${d.name},`,
    blocks: [
      { p: `We have received your message about <strong>${esc(d.topic.toLowerCase())}</strong>. A member of our team will reply within two working days.` },
      { p: 'If your question is about applying, the admissions guide and FAQs may answer it sooner.' },
      { button: { label: 'Read the FAQs', url: `${ctx.baseUrl}/faq` } },
    ],
    signoff: 'Institute of Peace and Conflict Management',
  }) }
}

export function contactToStaff(ctx: EmailContext, d: { name: string; email: string; phone?: string | null; topic: string; message: string }): Email {
  const rows: [string, string][] = [['From', d.name], ['Email', d.email], ['Topic', d.topic]]
  if (d.phone) rows.push(['Phone', d.phone])
  return { subject: `Website message: ${d.topic} (${d.name})`, ...render(ctx, {
    preheader: d.message.slice(0, 90),
    heading: 'New message from the website',
    greeting: 'Hello,',
    blocks: [
      { rows },
      { note: esc(d.message).replace(/\n/g, '<br>') },
      { p: 'Reply to this email to answer them directly.' },
    ],
    signoff: 'IPCM website',
  }) }
}

export function offerWithdrawn(ctx: EmailContext, d: { firstName: string; programme: string; reason: string }): Email {
  return { subject: 'Your offer has been withdrawn', ...render(ctx, {
    preheader: 'An update on your offer of admission.',
    heading: 'Your offer has been withdrawn',
    greeting: `Dear ${d.firstName || 'Applicant'},`,
    blocks: [
      { p: `Your offer of admission for the <strong>${esc(d.programme)}</strong> has been withdrawn by the admissions office.` },
      { note: `Reason: ${esc(d.reason)}`, tone: 'warning' },
      { p: 'You are welcome to apply for a later intake from your portal. If you think this is a mistake, reply to this email.' },
      { button: { label: 'Open my portal', url: `${ctx.baseUrl}/portal/apply` } },
    ],
  }) }
}

export function resultsPublished(ctx: EmailContext, d: { firstName: string; programme: string; classification: string }): Email {
  const passed = d.classification !== 'Fail'
  return { subject: passed ? `Your results: ${d.classification}` : 'Your results are available', ...render(ctx, {
    preheader: 'Your results for the programme are now in your portal.',
    heading: passed ? `Congratulations, you passed${d.classification === 'Distinction' ? ' with Distinction' : ''}` : 'Your results are available',
    greeting: `Dear ${d.firstName || 'Student'},`,
    blocks: [
      { p: `Your results for the <strong>${esc(d.programme)}</strong> have been published.` },
      ...(passed
        ? [{ p: 'Your certificate will be issued by the University. We will let you know when it is ready.' } as Block]
        : [{ p: 'You did not meet the requirements this time. Please contact the Institute to discuss your options, including joining a later intake.' } as Block]),
      { button: { label: 'View my results', url: `${ctx.baseUrl}/portal/results` } },
    ],
  }) }
}

export function classAnnouncement(ctx: EmailContext, d: { firstName: string; programme: string; cohort: string; title: string; body: string }): Email {
  return { subject: d.title, ...render(ctx, {
    preheader: d.body.slice(0, 90),
    heading: d.title,
    greeting: `Dear ${d.firstName || 'Student'},`,
    blocks: [
      { note: esc(d.body).replace(/\n/g, '<br>') },
      { p: `This message is for the ${esc(d.programme)}, ${esc(d.cohort)}.` },
      { button: { label: 'Open my portal', url: `${ctx.baseUrl}/portal` } },
    ],
    signoff: 'Institute of Peace and Conflict Management',
  }) }
}

export function certificateReady(ctx: EmailContext, d: { firstName: string; programme: string; certificateNo: string }): Email {
  return { subject: 'Your certificate has been issued', ...render(ctx, {
    preheader: `Certificate ${d.certificateNo} is on record.`,
    heading: 'Your certificate has been issued',
    greeting: `Dear ${d.firstName || 'Student'},`,
    blocks: [
      { p: `Your certificate for the <strong>${esc(d.programme)}</strong> has been issued and recorded by the Institute.` },
      { rows: [['Certificate number', d.certificateNo]] },
      { p: 'The Institute will tell you when and where to collect it. Please bring a valid means of identification. If someone collects it for you, they need a signed note from you and their own identification.' },
      { p: 'Anyone can check your certificate is genuine by scanning its QR code or entering the number on our verification page. You can also download your statement of result from your portal.' },
      { button: { label: 'Open my results', url: `${ctx.baseUrl}/portal/results` } },
    ],
  }) }
}

/** Sent to the Director when someone else issues, prints, revokes or records collection of certificates. */
export function certificateActivity(ctx: EmailContext, d: { actor: string; action: string; intake: string; items: string[]; link: string }): Email {
  return { subject: `Certificates: ${d.action} by ${d.actor}`, ...render(ctx, {
    preheader: `${d.actor} ${d.action.toLowerCase()} for ${d.intake}.`,
    heading: `Certificates ${d.action.toLowerCase()}`,
    greeting: 'Dear Director,',
    blocks: [
      { p: `<strong>${esc(d.actor)}</strong> ${esc(d.action.toLowerCase())} for <strong>${esc(d.intake)}</strong>.` },
      { list: d.items.slice(0, 30).map(esc) },
      ...(d.items.length > 30 ? [{ p: `And ${d.items.length - 30} more.` } as Block] : []),
      { note: 'You receive this because certificate actions by anyone other than the Director are always reported to you. If you did not expect it, review the intake now.', tone: 'info' },
      { button: { label: 'Review certificates', url: d.link } },
    ],
    signoff: 'IPCM portal',
  }) }
}
