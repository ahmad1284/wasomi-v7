
import { DegreeLevel, University } from './types';

export const UNIVERSITIES: University[] = [
  { id: '1', name: 'State University of Zanzibar (SUZA)', location: 'Zanzibar', verified: true, shortName: 'SUZA' },
  { id: '2', name: 'Zanzibar University (ZU)', location: 'Zanzibar', verified: true, shortName: 'ZU' },
  { id: '3', name: 'Abdulrahman Al-Sumait University (SUMAIT)', location: 'Zanzibar', verified: true, shortName: 'SUMAIT' },
  { id: '4', name: 'University of Dar es Salaam', location: 'Dar es Salaam', verified: true, shortName: 'UDSM' },
  { id: 'independent', name: 'Independent Research Hub (Non-Affiliated)', location: 'Wasomi Global', verified: true, shortName: 'IRH' },
];

export const DEPARTMENTS = [
  { id: 'health', name: 'Health & Medical Sciences', icon: 'Stethoscope' },
  { id: 'edu', name: 'Education & Pedagogy', icon: 'BookOpen' },
  { id: 'eng', name: 'Engineering & Technology', icon: 'Cpu' },
  { id: 'mar', name: 'Marine & Environmental Sciences', icon: 'Waves' },
  { id: 'bus', name: 'Business & Economics', icon: 'BarChart' },
  { id: 'law', name: 'Law & Governance', icon: 'Gavel' },
  { id: 'soc', name: 'Social Sciences & Humanities', icon: 'Users' },
  { id: 'ict', name: 'ICT & Computer Science', icon: 'Database' },
];

export const DEGREE_LEVELS = Object.values(DegreeLevel);

export const LICENSES = [
  { id: 'CC-BY', name: 'Creative Commons Attribution (CC BY)' },
  { id: 'CC-BY-SA', name: 'Creative Commons Attribution-ShareAlike (CC BY-SA)' },
  { id: 'CC-BY-NC', name: 'Creative Commons Attribution-NonCommercial (CC BY-NC)' },
  { id: 'CC-BY-ND', name: 'Creative Commons Attribution-NoDerivs (CC BY-ND)' },
];

export const APP_NAME = "Wasomi Scholars";
