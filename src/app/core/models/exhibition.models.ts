export interface TimelineEra {
  id: string;
  number: string;
  yearRange: string;
  titleTh: string;
  titleEn: string;
  subtitle: string;
  description: string;
  highlights: string[];
  quote?: {
    text: string;
    source: string;
  };
  historicalContext: string;
  heroImage: string;
  artifactsCount: number;
  interactiveChallengeTitle?: string;
  interactiveChallengeDescription?: string;
}

export interface ArtifactItem {
  id: string;
  nameTh: string;
  nameEn: string;
  eraId: string;
  category: 'regalia' | 'handicraft' | 'personal' | 'document' | 'vehicle';
  shortDesc: string;
  fullDesc: string;
  dimensions?: string;
  material?: string;
  origin?: string;
  provenance: string;
  threeDType: 'cypher_seal' | 'chanthaboon_loom' | 'vintage_camera' | 'royal_crown' | 'vintage_car' | 'royal_letter';
  imageUrl?: string;
  accentColor: string;
  hotspots: {
    title: string;
    description: string;
    position: [number, number, number];
  }[];
  audioNarration?: string;
}

export interface SurveyResponse {
  id: string;
  createdAt: string;
  visitorType: 'general' | 'student' | 'researcher' | 'kpi_staff' | 'international';
  ratingContent: number; // 1-5
  ratingInteractivity: number; // 1-5
  ratingVisual: number; // 1-5
  ratingEase: number; // 1-5
  npsScore: number; // 0-10
  favoriteZone: string;
  comment: string;
}

export interface AnalyticsRecord {
  date: string;
  visitors: number;
  pageViews: number;
  avgDwellMinutes: number;
  satisfactionAvg: number;
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  zoneInteractions: { [zoneId: string]: number };
}

export interface QuizQuestion {
  id: number;
  questionTh: string;
  questionEn: string;
  options: string[];
  correctIndex: number;
  explanationTh: string;
}

export interface MemoryCard {
  id: number;
  pairId: string;
  nameTh: string;
  icon: string;
  factTh: string;
  flipped: boolean;
  matched: boolean;
}

export interface HiddenTreasureItem {
  id: string;
  nameTh: string;
  categoryTh: string;
  descriptionTh: string;
  clueTh?: string;
  icon: string;
  xPercent: number;
  yPercent: number;
  found: boolean;
}

export interface ChronologyItem {
  id: string;
  yearTh: string;
  yearNum: number;
  titleTh: string;
  descriptionTh: string;
  icon: string;
  order: number;
}
