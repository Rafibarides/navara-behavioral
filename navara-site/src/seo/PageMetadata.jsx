import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import pages from './pages.json';
const origin = 'https://navarabehavioralgroup.com';
const videos = {
  background: {
    '@type': 'VideoObject',
    name: 'Navara office welcome video',
    description: 'A quiet view of the Navara office that plays behind the page header.',
    thumbnailUrl: [origin + '/loader.jpg'],
    uploadDate: '2025-06-09',
    duration: 'PT8S',
    contentUrl: origin + '/assets/background-video.mp4'
  },
  promo: {
    '@type': 'VideoObject',
    name: 'Navara Behavior Method introduction video',
    description: 'See the Navara Behavior Method, Navara Behavioral Group\'s 12-week parent-training program.',
    thumbnailUrl: [origin + '/assets/8-navara-promo-poster.webp'],
    uploadDate: '2026-10-15',
    duration: 'PT58S',
    contentUrl: origin + '/assets/3-11-navara-method-promo.mp4'
  }
};
export function applyMetadata(path) {
  const page = pages.find(p => p.path === path.replace(/\/$/, '') || p.path === path);
  const title = page?.title || 'Page Not Found | Navara Behavioral Group';
  const description = page?.description || 'The page you requested could not be found.';
  document.title = title;
  const set = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.setAttribute('content', value);
  };
  for (const selector of ['meta[name="title"]', 'meta[property="og:title"]', 'meta[property="twitter:title"]']) set(selector, title);
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[property="twitter:description"]']) set(selector, description);
  const url = origin + (page?.path || path);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', url);
  set('meta[property="og:url"]', url);
  set('meta[property="twitter:url"]', url);
  if (path.startsWith('/pathways')) {
    const card = origin + '/pathways-share.png';
    set('meta[name="keywords"]', 'RBT exam prep, BCBA exam prep, RBT practice questions, BCBA practice questions, RBT timed sets, BCBA timed sets, RBT study plan, BACB exam practice, Navara Pathways');
    for (const selector of ['meta[property="og:image"]', 'meta[property="og:image:secure_url"]', 'meta[property="twitter:image"]']) set(selector, card);
    set('meta[property="og:image:type"]', 'image/png');
    for (const selector of ['meta[property="og:image:alt"]', 'meta[property="twitter:image:alt"]']) set(selector, 'Navara Pathways - RBT and BCBA exam prep');
  }
  const robots = !page || page.noindex ? 'noindex, follow' : 'index, follow';
  set('meta[name="robots"]', robots);
  set('meta[name="googlebot"]', robots);
  const schema = document.querySelector('script[type="application/ld+json"]');
  if (schema && page) {
    const organization = {
      '@type': 'Organization', '@id': origin + '/#organization',
      name: 'Navara Behavioral Group', url: origin + '/',
      logo: origin + '/logo-white.png',
      contactPoint: { '@type': 'ContactPoint', telephone: '+1-877-762-8272', email: 'info@navarabehavioralgroup.com', contactType: 'Customer Service' }
    };
    const webpage = { '@type': 'WebPage', '@id': url + '#webpage', url, name: title, description, publisher: { '@id': organization['@id'] } };
    const graph = [organization, webpage];
    if (page.path.startsWith('/services/')) graph.push({ '@type': 'Service', '@id': url + '#service', name: title.split('|')[0].trim(), description, url, provider: { '@id': organization['@id'] } });
    for (const key of page.videos || []) {
      const video = videos[key];
      if (video) graph.push({ ...video, '@id': url + '#' + key + '-video' });
    }
    schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  }
}
export default function PageMetadata() {
  const { pathname } = useLocation();
  useEffect(() => applyMetadata(pathname), [pathname]);
  return null;
}
