// API Types matching Node.js backend schemas

// Blueprint Status
export type BlueprintStatus = 'pending' | 'processing' | 'processed-dxf' | 'completed' | 'failed';

// Bid Status
export type BidStatus = 'draft' | 'pending_review' | 'approved' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'archived';

// Project Type
export type ProjectType = 'residential' | 'commercial' | 'industrial' | 'renovation';

// Pricing Tier
export type PricingTier = 'economy' | 'standard' | 'premium';

// Fixture from analysis
export interface Fixture {
  type: string;
  quantity: number;
  width?: number;
  depth?: number;
  unit?: string;
  notes?: string;
}

// Room from analysis
export interface Room {
  name: string;
  floor?: number;
  fixtureCount: number;
  fixtures: Fixture[];
}

// Blueprint analysis data
export interface BlueprintAnalysis {
  summary: {
    totalFixtures: number;
    totalRooms: number;
    scale?: string;
    measurementUnit?: string;
    floors?: number;
  };
  rooms: Room[];
  fixtureTotals: Record<string, number>;
  notes?: string;
}

// Blueprint
export interface Blueprint {
  id: string;
  project_name: string;
  project_address?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  status: BlueprintStatus;
  total_fixtures: number;
  analysis_data: BlueprintAnalysis | null;
  analysis_completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Blueprint upload response
export interface BlueprintUploadResponse {
  success: boolean;
  blueprint: {
    id: string;
    projectName: string;
    fileName: string;
    status: BlueprintStatus;
    totalFixtures: number;
    message?: string;
  };
}

// Blueprints list response
export interface BlueprintsListResponse {
  success: boolean;
  blueprints: Blueprint[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Blueprint summary
export interface BlueprintSummary {
  success: boolean;
  summary: {
    blueprintId: string;
    projectName: string;
    totalFixtures: number;
    totalRooms: number;
    rooms: Array<{
      name: string;
      floor?: number;
      fixtures: Fixture[];
    }>;
    fixtureTotals: Record<string, number>;
  };
}

// Bid line item
export interface BidLineItem {
  id: string;
  bid_id: string;
  line_number: number;
  item_type: string;
  fixture_type?: string;
  description: string;
  room_location?: string;
  quantity: number;
  unit: string;
  unit_material_cost: number;
  unit_labor_cost: number;
  unit_total: number;
  line_material_total: number;
  line_labor_total: number;
  line_total: number;
  is_optional: boolean;
  is_included: boolean;
}

// Bid
export interface Bid {
  id: string;
  bid_number: string;
  blueprint_id: string;
  project_name: string;
  project_address?: string;
  project_type: ProjectType;
  project_description?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  pricing_tier: PricingTier;
  markup_percent: number;
  discount_percent: number;
  tax_percent: number;
  status: BidStatus;
  grand_total: number;
  material_total: number;
  labor_total: number;
  created_at: string;
  updated_at: string;
  line_items?: BidLineItem[];
}

// Bid generation request
export interface BidGenerateRequest {
  blueprintId: string;
  pricingTier?: PricingTier;
  projectType?: ProjectType;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  markupPercent?: number;
  discountPercent?: number;
  taxPercent?: number;
  notes?: string;
}

// Bids list response
export interface BidsListResponse {
  success: boolean;
  bids: Bid[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Health status
export interface HealthStatus {
  timestamp: string;
  status: string;
  services: {
    database: { healthy: boolean };
    ai: { initialized: boolean };
    blueprints: { initialized: boolean };
  };
}

// API Error
export interface ApiError {
  success: false;
  error: string;
  path?: string;
}

// Page Viewer Types
export type RealUnit = 'FT' | 'IN' | 'M' | 'CM';

export interface Page {
  id: string;
  pageNumber: number;
  imageUrl: string;
  status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
}

export interface Calibration {
  pageId: string;
  pixelDistance: number;
  realDistance: number;
  realUnit: RealUnit;
  pixelsPerUnit: number;
}
