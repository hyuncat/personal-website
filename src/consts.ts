import type { IconMap, SocialLink, Site } from '@/types'

export const SITE: Site = {
  title: "Sarah's Blog",
  description: 'Art, programming, math, and assorted reflections.',
  href: 'https://hyuncat.com',
  author: 'sarah-hong',
  locale: 'en-US',
  featuredPostCount: 3,
  postsPerPage: 10,
}

// Google Analytics
// Set your tracking ID from https://analytics.google.com/
// Leave empty to disable.
export const ANALYTICS = {
  google: '',
}

// Umami Analytics
// Set your website ID from your Umami instance.
// Leave empty to disable.
export const UMAMI = {
  websiteId: '',
}

// giscus Comments (powered by GitHub Discussions)
// Setup:
//   1. Make the repo public and enable its Discussions tab.
//   2. Install the giscus app: https://github.com/apps/giscus
//   3. Go to https://giscus.app, enter your repo, pick a Discussions category,
//      and copy the four generated values into the fields below.
// These IDs are public (they ship in the page HTML), so it's fine to commit them.
export const GISCUS = {
  repo: 'hyuncat/personal-website',
  repoId: 'R_kgDOS6F0Wg',
  category: 'Announcements', // the Discussions category to store comments in
  categoryId: 'DIC_kwDOS6F0Ws4C_Hfq',
  mapping: 'pathname', // one discussion per page URL path
}

export const NAV_LINKS: SocialLink[] = [
  {
    href: '/',
    label: 'Home',
    icon: 'lucide:home',
  },
  {
    href: '/blog',
    label: 'Blog',
    icon: 'lucide:library-big',
  },
  {
    href: '/projects',
    label: 'Projects',
    icon: 'lucide:folder-git-2',
  },
  {
    href: '/about',
    label: 'About',
    icon: 'lucide:user',
  },
]

// Sub-navigation shown on the /projects and /art pages
export const PROJECT_NAV_LINKS: SocialLink[] = [
  {
    href: '/projects',
    label: 'Code',
    icon: 'lucide:folder-git-2',
  },
  {
    href: '/art',
    label: 'Art',
    icon: 'lucide:palette',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://github.com/hyuncat',
    label: 'GitHub',
  },
  {
    href: 'https://www.linkedin.com/in/sarahshong',
    label: 'LinkedIn',
  },
  {
    href: 'mailto:hyuncat3@gmail.com',
    label: 'Email',
  },
  {
    href: '/rss.xml',
    label: 'RSS',
  },
]

export const ICON_MAP: IconMap = {
  Website: 'lucide:globe',
  GitHub: 'lucide:github',
  LinkedIn: 'lucide:linkedin',
  Twitter: 'lucide:instagram',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}

// Newsletter consent text (centralized for GDPR compliance)
export const NEWSLETTER_CONSENT_TEXT = {
  text: 'I agree to receive newsletter emails.',
  privacyLink: '/privacy',
  privacyText: 'Privacy Policy',
}
