export type ProspectStatus =
  | 'new'
  | 'audited'
  | 'proposal_sent'
  | 'negotiating'
  | 'won'
  | 'lost'
  | 'closed';

export function isArchivedProspectStatus(status: ProspectStatus): boolean {
  return status === 'lost' || status === 'closed';
}

export function isAnalyzedProspectStatus(status: ProspectStatus): boolean {
  return status !== 'new';
}

export type AiSearchVisibilityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type OpportunityType =
  | 'no_maps'
  | 'maps_unclaimed'
  | 'low_rating'
  | 'non_mobile'
  | 'outdated_html'
  | 'no_geo_schema'
  | 'missing_website';

export interface AuditTechnicalCheck {
  isHtml5Valid: boolean;
  hasViewportMeta: boolean;
  hasSsl: boolean;
  hasSemanticTags: boolean; // header, nav, main, footer
  hasTableLayout: boolean; // outdated layout sign
  loadingSpeedSec: number;
}

export interface AuditSeoCheck {
  title: string;
  hasTitle: boolean;
  titleLength: number;
  metaDescription: string;
  hasMetaDescription: boolean;
  hasOpenGraph: boolean;
  hasH1: boolean;
  h1Text?: string;
  imageAltRatio: number; // 0-100%
}

export interface AuditGeoCheck {
  hasJsonLd: boolean;
  hasLocalBusinessSchema: boolean;
  hasNapData: boolean; // Name, Address, Phone matches
  isAiBotAllowed: boolean; // GPTBot / PerplexityBot in robots.txt
  geoCoordinatesFound: boolean;
  nlpEntityClarityScore: number; // 0-100
  aiSearchVisibilityGrade: AiSearchVisibilityGrade;
}

export interface AuditMapsCheck {
  existsOnMaps: boolean;
  isClaimed: boolean;
  rating: number; // 1-5
  reviewCount: number;
  hasOwnerResponses: boolean;
  categoryMatched: boolean;
  isVerified?: boolean;
  dataSource?: 'openstreetmap' | 'google_places' | 'manual' | 'unknown';
}

export interface LeadDiscoveryMetadata {
  provider: 'openstreetmap' | 'manual' | 'domain_audit';
  sourceId?: string;
  sourceUrl?: string;
  discoveredAt: string;
  potentialScore: number;
  reasons: string[];
  attribution?: string;
}

export interface ComprehensiveAudit {
  overallScore: number; // 0-100
  technicalScore: number;
  seoScore: number;
  geoScore: number; // Generative Engine Optimization
  mapsScore: number;

  technical: AuditTechnicalCheck;
  seo: AuditSeoCheck;
  geo: AuditGeoCheck;
  maps: AuditMapsCheck;

  criticalFlaws: string[];
  quickFixes: string[];
  estimatedMonthlyLeadLoss: number; // in TL or USD
  aiRecommendationSummary: string;
}

export interface Prospect {
  id: string;
  businessName: string;
  industry: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  email: string;
  websiteUrl: string;
  contactPerson?: string;
  mapsUrl?: string;
  lat: number;
  lng: number;

  primaryOpportunity: OpportunityType;
  secondaryOpportunities: OpportunityType[];
  status: ProspectStatus;

  audit: ComprehensiveAudit;
  notes: string[];

  createdAt: string;
  updatedAt: string;
  estimatedContractValue: number; // Estimated agency fee in TL
  discovery?: LeadDiscoveryMetadata;
}

export interface ProposalOutput {
  title: string;
  executiveSummary: string;
  auditHighlights: {
    category: string;
    issue: string;
    impact: string;
    solution: string;
  }[];
  proposedServices: {
    packageName: string;
    price: string;
    features: string[];
    timeline: string;
  }[];
  expectedResults: string[];
  coldEmailTemplate: {
    subject: string;
    body: string;
  };
  whatsappMessage: string;
  callScript: string;
}
