import type {
  ComprehensiveAudit,
  OpportunityType,
  Prospect,
} from '../src/types';

export interface MapEvidence {
  exists: boolean;
  isClaimed?: boolean;
  rating?: number;
  reviewCount?: number;
  hasOwnerResponses?: boolean;
  categoryMatched?: boolean;
  profileCompleteness?: number;
}

export interface WebsiteEvidence {
  requestedUrl: string;
  finalUrl: string;
  html: string;
  robotsTxt: string;
  statusCode: number;
  loadTimeMs: number;
}

export interface AuditContext {
  businessName?: string;
  industry?: string;
  city?: string;
  district?: string;
  phone?: string;
  address?: string;
  map?: MapEvidence;
}

export interface AuditAnalysis {
  audit: ComprehensiveAudit;
  primaryOpportunity: OpportunityType;
  secondaryOpportunities: OpportunityType[];
  estimatedContractValue: number;
  potentialScore: number;
  reasons: string[];
}

export interface DiscoveryRequest {
  location: string;
  industry: string;
  limit: number;
}

export interface DiscoverySummary {
  provider: 'openstreetmap';
  location: string;
  industry: string;
  examined: number;
  added: number;
  updated: number;
  skipped: number;
  skippedAnalyzed: number;
  cached: boolean;
}

export interface DiscoveryResult {
  prospects: Prospect[];
  summary: DiscoverySummary;
}

export interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export interface OsmResponse {
  elements?: OsmElement[];
}

export interface IndustryProfile {
  id: string;
  label: string;
  aliases: string[];
  selectors: Array<[string, string?]>;
  baseContractValue: number;
  monthlyDigitalOpportunity: number;
}
