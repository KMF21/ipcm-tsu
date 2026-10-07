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
  director: { src: '/people/elijah-akombo.jpg', alt: 'Prof. Elijah Akombo, Director of the Institute, in academic regalia', width: 720, height: 1080, placeholder: false },
  directorHeadshot: { src: '/people/elijah-akombo-square.jpg', alt: 'Prof. Elijah Akombo', width: 320, height: 320, placeholder: false },
  logo: { src: '/tsu-logo.png', alt: 'Taraba State University logo', width: 500, height: 500, placeholder: false },
  // AI-generated stand-ins (Gemini). Keep placeholder: true until replaced with real IPCM photography.
  hero: ph('hero.jpg', 'Community leaders, women and officials in a dialogue circle led by a facilitator', 1672, 941),
  about: ph('about.jpg', 'A lecturer addressing adult participants in a university seminar room', 1448, 1086),
  og: ph('og-default.jpg', 'Two people shaking hands in reconciliation at a community gathering', 1424, 752),
  emptyState: ph('empty-state.jpg', '', 1024, 1024),
  certificateTexture: ph('certificate-texture.jpg', '', 1200, 896),
  programmes: {
    PCM: ph('programme-pcm.jpg', 'Participants mapping a conflict with sticky notes during group work', 1448, 1086),
    NMA: ph('programme-nma.jpg', 'A mediator guiding a calm conversation between two community members', 1448, 1086),
    CEW: ph('programme-cew.jpg', 'An analyst marking a regional map while a colleague points to an area', 1448, 1086),
    PHR: ph('programme-phr.jpg', 'A humanitarian worker talking gently with an older woman outside her home', 1200, 896),
    PSS: ph('programme-pss.jpg', 'Two police officers listening to a village elder under a shade tree', 1448, 1086),
  } as Record<string, SiteImage>,
  programmeHeroes: {
    PCM: ph('programme-pcm-hero.jpg', 'A university classroom of adult participants at a peace workshop', 1672, 941),
    NMA: ph('programme-nma-hero.jpg', 'Elders and community members meeting under a tree with a mediator', 1672, 941),
    CEW: ph('programme-cew-hero.jpg', 'Officials, a police officer and a traditional leader reviewing maps together', 1672, 941),
    PHR: ph('programme-phr-hero.jpg', 'Community members replanting a farm and repairing a wall together', 1376, 768),
    PSS: ph('programme-pss-hero.jpg', 'Security personnel and civilians attending a seminar in a university hall', 1672, 941),
  } as Record<string, SiteImage>,
  research: [
    ph('research-1.jpg', 'Cattle grazing beside a maize farm at sunset while a herder rests nearby', 1448, 1086),
    ph('research-2.jpg', 'Young people in a dialogue circle as a young woman speaks', 1200, 896),
    ph('research-3.jpg', 'A local peace committee of mixed faiths meeting around a table', 1200, 896),
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
