import { ContentBlockData } from '@/components/home/ContentBlockSection'

export const homeContentBlock: ContentBlockData = {
  subtitle: 'How KC DIME Works',
  heading: 'From "we need a laptop" to "it just shipped" — in three steps.',
  description:
    "KC DIME is the Kansas City tech nonprofit that turns donor dollars into actual devices in actual hands. Whether you're a community organization equipping a classroom or an individual restarting your career, the path is the same.",
  listItems: [
    'Orgs and individuals submit a verified technology need',
    'Donors fund the request — every dollar tagged to a real device',
    'KC DIME ships the gear and reports back at 30 and 90 days',
  ],
  buttons: [
    { label: 'Browse Campaigns', href: '/campaigns', variant: 'primary' },
    { label: 'Learn More', href: '/about', variant: 'secondary' },
  ],
  // Real Unsplash photo: father and son learning together on a laptop.
  // Free license; kcdd_placeholder=1 keeps the "Placeholder photo" overlay
  // until real KC DIME photos are available.
  imageUrl:
    'https://images.unsplash.com/photo-1758687126499-9ff30d1c5762?w=1200&q=80&auto=format&fit=crop&kcdd_placeholder=1',
  imageAlt: 'A parent and child learning together on a laptop',
  backgroundColor: '#103032',
  imageBackgroundColor: '#DBF938',
}
