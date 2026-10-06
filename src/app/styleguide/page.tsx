import type { Metadata } from 'next'
import { BookOpen, FileText, Wallet } from 'lucide-react'
import {
  Accordion,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  FileUploadBox,
  Input,
  ProgressBar,
  Select,
  Skeleton,
  StatCard,
  StatusPill,
  Stepper,
  Textarea,
} from '@/components/ui'
import { remainingPlaceholders } from '@/lib/images'

export const metadata: Metadata = { title: 'Styleguide', robots: { index: false, follow: false } }

const colours = [
  ['navy', '#0F1F3D', 'Headings, header, footer, sidebar'],
  ['teal (IPCM accent)', '#0E7C6B', 'Primary actions, links, progress, focus'],
  ['teal-50', '#E8F5F2', 'Accent tints, selected states'],
  ['crimson', '#C4293B', 'Errors, overdue, destructive only'],
  ['amber', '#B7791F', 'Warnings, pending'],
  ['success', '#2F855A', 'Paid, approved, complete'],
  ['ink', '#1C2536', 'Body text'],
  ['ink-muted', '#4A5468', 'Secondary text'],
  ['line', '#E3E7EE', 'Borders'],
  ['canvas', '#F6F8FB', 'Portal background'],
]

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-12">
      <h2 className="text-h2 font-semibold">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  )
}

export default function Styleguide() {
  const placeholders = remainingPlaceholders()
  return (
    <main id="main" className="container-page py-12">
      <p className="text-label font-semibold uppercase tracking-[0.08em] text-teal">IPCM design system</p>
      <h1 className="mt-2 text-h1 font-bold">Styleguide</h1>
      <p className="mt-3 max-w-2xl text-lead text-ink-muted">Every component in every state. Built on the TSU parent brand with the IPCM peace-teal accent. No text below 14px.</p>

      <Block title="Colour">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {colours.map(([name, hex, use]) => (
            <div key={name} className="overflow-hidden rounded-card border border-line">
              <div className="h-20" style={{ background: hex }} />
              <div className="p-3">
                <p className="font-semibold text-navy">{name}</p>
                <p className="text-sm text-ink-muted">{hex}</p>
                <p className="mt-1 text-sm text-ink">{use}</p>
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Typography">
        <div className="space-y-5">
          <p className="font-display text-display font-bold text-navy">Display 48 · Sora</p>
          <h1 className="text-h1 font-bold">Heading 1 · 40</h1>
          <h2 className="text-h2 font-semibold">Heading 2 · 30</h2>
          <h3 className="text-h3 font-semibold">Heading 3 · 22</h3>
          <p className="text-lead text-ink">Lead paragraph · 20. Practical training for the people who manage conflict every day.</p>
          <p className="text-base">Body · 16 (17 on phones). Inter is used for all reading text, forms and tables.</p>
          <p className="text-label font-medium text-ink-muted">Label · 15. Table cells and secondary text.</p>
          <p className="text-sm text-ink-muted">Small · 14. The absolute minimum, for captions and badges only.</p>
        </div>
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
          <Button size="lg">Large primary</Button>
          <Button loading>Processing</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Block>

      <Block title="Status pills and badges">
        <div className="flex flex-wrap gap-3">
          {['paid', 'approved', 'admitted', 'pending', 'under_review', 'offered', 'in_progress', 'rejected', 'overdue', 'not_started'].map((s) => (
            <StatusPill key={s} status={s} />
          ))}
          <Badge tone="navy">TSU/IPCM/NMA/2027/0042</Badge>
        </div>
      </Block>

      <Block title="Form fields">
        <div className="grid max-w-3xl gap-6 md:grid-cols-2">
          <Field id="sg-name" label="Full name" required hint="As it should appear on your certificate">
            <Input id="sg-name" placeholder="e.g. Amina Bello" />
          </Field>
          <Field id="sg-email" label="Email address" required error="Enter a valid email address">
            <Input id="sg-email" type="email" defaultValue="amina@" invalid aria-describedby="sg-email-error" />
          </Field>
          <Field id="sg-state" label="State of origin" required>
            <Select id="sg-state" defaultValue="">
              <option value="" disabled>Select a state</option>
              <option>Taraba</option>
              <option>Adamawa</option>
              <option>Benue</option>
            </Select>
          </Field>
          <Field id="sg-phone" label="Phone number" hint="We’ll send admission updates by SMS">
            <Input id="sg-phone" type="tel" placeholder="0803 000 0000" />
          </Field>
          <div className="md:col-span-2">
            <Field id="sg-why" label="Why this programme?" hint="100 to 300 words">
              <Textarea id="sg-why" placeholder="Tell us about your work and what you hope to learn" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <FileUploadBox label="Upload passport photograph" accept="JPG or PNG" maxSize="300 KB" />
          </div>
        </div>
      </Block>

      <Block title="Cards and stats">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={<BookOpen className="h-6 w-6" />} value="1/4" label="Modules completed" />
          <StatCard icon={<FileText className="h-6 w-6" />} value="3" label="Documents approved" tone="success" />
          <StatCard icon={<Wallet className="h-6 w-6" />} value="₦35,300" label="Balance due" tone="crimson" hint="Due 31 January 2027" />
          <Card>
            <CardHeader title="Card" subtitle="Generic container" />
            <ProgressBar value={60} label="Module 2" />
          </Card>
        </div>
      </Block>

      <Block title="Stepper">
        <Card>
          <Stepper steps={['Apply', 'Submitted', 'Review', 'Offer', 'Pay tuition', 'Admitted']} current={3} />
        </Card>
      </Block>

      <Block title="Alerts">
        <div className="grid gap-4 md:grid-cols-2">
          <Alert tone="info" title="We’re confirming your payment">This usually takes under a minute.</Alert>
          <Alert tone="success" title="Payment received">Receipt RCT-2027-000315 has been emailed to you.</Alert>
          <Alert tone="warning" title="Your offer expires in 3 days">Pay tuition to secure your seat.</Alert>
          <Alert tone="error" title="Passport photograph rejected">The background must be white. Please upload a new photo.</Alert>
        </div>
      </Block>

      <Block title="Avatars, accordion, empty and loading states">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Avatar name="Amina Bello" size={40} />
              <Avatar name="Dr. Musa Ibrahim" size={52} />
              <Avatar name="Director IPCM" size={64} />
            </div>
            <Accordion items={[{ q: 'Who can apply?', a: 'Anyone meeting the entry requirements.' }, { q: 'When are classes?', a: 'Saturdays, 9:00am to 4:00pm.' }]} />
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
          <EmptyState icon={<FileText className="h-7 w-7" />} title="No receipts yet" body="Receipts appear here after each payment is confirmed." action={<Button>Make a payment</Button>} />
        </div>
      </Block>

      <Block title="Placeholder images still to replace">
        <p className="text-base text-ink-muted">{placeholders.length} image slots are using placeholders. The pre-launch check fails until these are replaced.</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {placeholders.map((p) => (
            <li key={p} className="rounded-lg border border-line bg-amber-50 px-3 py-2 text-sm font-medium text-amber">{p}</li>
          ))}
        </ul>
      </Block>
    </main>
  )
}
