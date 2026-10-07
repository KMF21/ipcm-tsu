/**
 * Single image map. Every image slot in the site reads from here (or from the database later),
 * so swapping placeholders for real photography is a file replacement or admin upload, no code change.
 * `placeholder: true` lets the pre-launch check fail while any stand-in remains.
 */
export type SiteImage = { src: string; alt: string; width: number; height: number; placeholder: boolean }

const ph = (file: string, alt: string, width: number, height: number): SiteImage => ({
  src: `/placeholders/${file}`,
  alt,
  width,
  height,
  placeholder: true,
})

export const images = {
  logo: { src: '/tsu-logo.png', alt: 'Taraba State University logo', width: 500, height: 500, placeholder: false },
  hero: ph('hero.png', 'Participants in a community dialogue session', 2400, 1350),
  about: ph('about.png', 'Taraba State University campus', 1600, 1200),
  og: ph('og-default.jpg', 'Institute of Peace and Conflict Management', 1200, 630),
  programmes: {
    PCM: ph('programme-pcm.png', 'Peace and conflict management class in session', 1200, 900),
    NMA: ph('programme-nma.png', 'Mediation practice session', 1200, 900),
    CEW: ph('programme-cew.png', 'Conflict mapping workshop', 1200, 900),
    PHR: ph('programme-phr.png', 'Community recovery meeting', 1200, 900),
    PSS: ph('programme-pss.png', 'Security and community leaders in dialogue', 1200, 900),
  } as Record<string, SiteImage>,
  programmeHeroes: {
    NMA: ph('programme-nma-hero.png', 'Mediation practice session', 2400, 1350),
  } as Record<string, SiteImage>,
  research: [
    ph('research-1.png', 'Research brief cover', 1200, 900),
    ph('research-2.jpg', 'Research brief cover', 1200, 900),
    ph('research-3.jpg', 'Research brief cover', 1200, 900),
  ],
}

export function remainingPlaceholders(): string[] {
  const out: string[] = []
  const walk = (o: unknown, path: string) => {
    if (o && typeof o === 'object') {
      if ('placeholder' in o && (o as SiteImage).placeholder) out.push(path)
      else for (const [k, v] of Object.entries(o)) walk(v, path ? `${path}.${k}` : k)
    }
  }
  walk(images, '')
  return out
}
