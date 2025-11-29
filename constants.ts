import { Service, Consultant } from "./types";

export const SERVICES: Service[] = [
  {
    id: 'financial',
    name: 'Financial Consulting',
    description: 'Tax filing, audits, and investment strategies.',
    icon: 'Calculator',
    price: 150
  },
  {
    id: 'legal',
    name: 'Legal Advisory',
    description: 'Corporate law, disputes, and contracts.',
    icon: 'Scale',
    price: 200
  },
  {
    id: 'marketing',
    name: 'Marketing Strategy',
    description: 'Brand growth, SEO, and social media campaigns.',
    icon: 'Megaphone',
    price: 120
  },
  {
    id: 'tech',
    name: 'IT & Tech Support',
    description: 'Software architecture, cloud migration, and security.',
    icon: 'Cpu',
    price: 180
  }
];

export const CONSULTANTS: Consultant[] = [
  {
    id: 'c1',
    name: 'Alice Johnson',
    specialty: 'Tax Specialist',
    serviceId: 'financial',
    avatarUrl: 'https://picsum.photos/100/100?random=1'
  },
  {
    id: 'c2',
    name: 'Robert Smith',
    specialty: 'Corporate Lawyer',
    serviceId: 'legal',
    avatarUrl: 'https://picsum.photos/100/100?random=2'
  },
  {
    id: 'c3',
    name: 'Sarah Lee',
    specialty: 'Growth Hacker',
    serviceId: 'marketing',
    avatarUrl: 'https://picsum.photos/100/100?random=3'
  },
  {
    id: 'c4',
    name: 'David Chen',
    specialty: 'Cloud Architect',
    serviceId: 'tech',
    avatarUrl: 'https://picsum.photos/100/100?random=4'
  }
];
