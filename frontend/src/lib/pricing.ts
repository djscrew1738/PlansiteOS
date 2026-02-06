/**
 * PlansiteOS Pricing Constants
 * DFW Market Data (2025)
 *
 * Based on current Dallas-Fort Worth market rates for plumbing fixtures.
 * Includes rough-in, trim-out, and material costs.
 */

export type FixtureTier = 'basic' | 'standard' | 'premium';
export type PipeMaterial = 'pex' | 'copper' | 'cpvc';
export type FoundationType = 'slab' | 'crawlspace' | 'basement';

/**
 * Per-Fixture Pricing (DFW Market)
 * Includes: Rough-in + Trim + Materials
 */
export const FIXTURE_PRICING: Record<FixtureTier, { min: number; max: number; description: string }> = {
  basic: {
    min: 600,
    max: 950,
    description: 'Builder Grade. Standard PEX piping. Entry-level fixtures (Delta/Moen chrome).',
  },
  standard: {
    min: 950,
    max: 1600,
    description: 'Mid-Range Custom. Copper or high-grade PEX. Mid-tier fixtures (brushed nickel, ORB).',
  },
  premium: {
    min: 1800,
    max: 3500,
    description: 'Luxury/High-End. Full copper piping. Designer fixtures (Kohler, Grohe, gold/matte black).',
  },
};

/**
 * Rough-In Phase Costs
 * Running supply lines and drain/vent before drywall
 */
export const ROUGH_IN_COSTS = {
  perFixture: { min: 350, max: 800 },
  perSqFt: { min: 4.0, max: 5.0 }, // Whole-house alternative pricing
};

/**
 * Fixture Allowance (Shopping List)
 * Cost of the actual fixture/faucet/toilet
 */
export const FIXTURE_ALLOWANCE: Record<FixtureTier, { min: number; max: number }> = {
  basic: { min: 150, max: 300 },
  standard: { min: 400, max: 800 },
  premium: { min: 1000, max: 3000 },
};

/**
 * Trim-Out Labor
 * Installing fixtures after painting/tile
 */
export const TRIM_OUT_LABOR: Record<FixtureTier, { min: number; max: number }> = {
  basic: { min: 200, max: 350 },
  standard: { min: 350, max: 600 },
  premium: { min: 650, max: 1500 },
};

/**
 * Specific Fixture Types
 * Labor-only costs for common fixtures
 */
export const SPECIFIC_FIXTURES = {
  toilet: {
    basic: { min: 150, max: 200, description: 'Standard floor-mount toilet' },
    premium: { min: 350, max: 550, description: 'Bidet/Wall-hung toilet' },
  },
  faucet: {
    basic: { min: 125, max: 175, description: 'Single-handle chrome faucet' },
    premium: { min: 250, max: 450, description: 'Widespread/touchless faucet' },
  },
  waterHeater: {
    basic: { min: 800, max: 1200, description: 'Standard 40-50 gal tank' },
    premium: { min: 2000, max: 4500, description: 'Tankless/high-capacity' },
  },
  garbageDisposal: {
    basic: { min: 150, max: 225, description: '1/2 HP disposal' },
    premium: { min: 250, max: 350, description: '3/4+ HP disposal' },
  },
  shower: {
    basic: { min: 400, max: 700, description: 'Standard tub/shower combo' },
    premium: { min: 1200, max: 3000, description: 'Walk-in shower with body sprays' },
  },
  sink: {
    basic: { min: 200, max: 350, description: 'Drop-in kitchen/bath sink' },
    premium: { min: 500, max: 1200, description: 'Undermount/farmhouse sink' },
  },
};

/**
 * DFW Labor Rates
 * Licensed plumber hourly rates
 */
export const LABOR_RATES = {
  min: 90,
  max: 165,
  average: 125,
  description: 'Per hour for licensed plumbers in DFW area',
};

/**
 * Pipe Material Multipliers
 * Affects both material cost and installation time
 */
export const PIPE_MATERIAL_FACTORS: Record<PipeMaterial, { cost: number; labor: number; description: string }> = {
  pex: {
    cost: 1.0,
    labor: 1.0,
    description: 'Standard PEX - fastest install, most cost-effective',
  },
  copper: {
    cost: 2.8,
    labor: 1.4,
    description: 'Premium copper - durable, preferred for luxury homes',
  },
  cpvc: {
    cost: 1.3,
    labor: 1.1,
    description: 'Mid-grade CPVC - good balance of cost and quality',
  },
};

/**
 * DFW-Specific Adjustments
 */
export const DFW_ADJUSTMENTS = {
  slabFoundation: {
    fixtureRelocation: { min: 1000, max: 2500 },
    description: 'Cost to jackhammer concrete and relocate plumbing',
  },
  permits: {
    smallJob: { min: 100, max: 300 },
    perSqFt: 0.50, // For new builds
    description: 'DFW municipal permit fees (strict code compliance)',
  },
  foundationTypes: {
    slab: {
      multiplier: 1.0,
      description: 'Most common in DFW - standard pricing',
    },
    crawlspace: {
      multiplier: 0.85,
      description: 'Easier access - reduces labor time',
    },
    basement: {
      multiplier: 0.9,
      description: 'Moderate access - slightly easier than slab',
    },
  },
};

/**
 * Crew Efficiency Factors
 */
export const CREW_EFFICIENCY = {
  oneMan: {
    multiplier: 1.0,
    description: 'Single plumber - standard timeline',
  },
  twoMan: {
    multiplier: 0.7,
    efficiency: 0.3,
    description: '2-man crew - 30% faster completion',
  },
};

/**
 * Helper: Calculate fixture cost based on tier
 */
export function calculateFixtureCost(
  tier: FixtureTier,
  pipeMaterial: PipeMaterial = 'pex',
  fixtureCount: number = 1
): { min: number; max: number; average: number } {
  const baseCost = FIXTURE_PRICING[tier];
  const materialFactor = PIPE_MATERIAL_FACTORS[pipeMaterial];

  const min = baseCost.min * materialFactor.cost * fixtureCount;
  const max = baseCost.max * materialFactor.cost * fixtureCount;
  const average = (min + max) / 2;

  return { min, max, average };
}

/**
 * Helper: Calculate labor hours for project
 */
export function calculateLaborHours(
  fixtureCount: number,
  tier: FixtureTier,
  pipeMaterial: PipeMaterial = 'pex',
  crewSize: 1 | 2 = 1
): { roughIn: number; trimOut: number; total: number } {
  // Base hours per fixture
  const roughInHoursPerFixture = tier === 'basic' ? 2 : tier === 'standard' ? 3 : 4;
  const trimOutHoursPerFixture = tier === 'basic' ? 1 : tier === 'standard' ? 1.5 : 2.5;

  // Material factor
  const materialFactor = PIPE_MATERIAL_FACTORS[pipeMaterial].labor;

  // Crew efficiency
  const crewFactor = crewSize === 2 ? CREW_EFFICIENCY.twoMan.multiplier : 1.0;

  const roughIn = roughInHoursPerFixture * fixtureCount * materialFactor * crewFactor;
  const trimOut = trimOutHoursPerFixture * fixtureCount * crewFactor;
  const total = roughIn + trimOut;

  return { roughIn, trimOut, total };
}

/**
 * Helper: Calculate permit costs
 */
export function calculatePermitCost(projectType: 'small' | 'newBuild', sqft?: number): number {
  if (projectType === 'small') {
    const { min, max } = DFW_ADJUSTMENTS.permits.smallJob;
    return (min + max) / 2;
  }

  if (projectType === 'newBuild' && sqft) {
    return sqft * DFW_ADJUSTMENTS.permits.perSqFt;
  }

  return 0;
}

/**
 * Helper: Get pricing recommendation
 */
export function getPricingRecommendation(margin: number): {
  status: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
  color: string;
} {
  if (margin >= 40) {
    return {
      status: 'excellent',
      message: 'Excellent margin. Healthy profitability with room for negotiation.',
      color: 'green',
    };
  } else if (margin >= 30) {
    return {
      status: 'good',
      message: 'Good margin. Competitive pricing with solid profit.',
      color: 'blue',
    };
  } else if (margin >= 20) {
    return {
      status: 'fair',
      message: 'Fair margin. Consider increasing labor rate or reducing discounts.',
      color: 'yellow',
    };
  } else {
    return {
      status: 'poor',
      message: 'Low margin. Risk of unprofitability. Increase pricing or reduce costs.',
      color: 'red',
    };
  }
}

/**
 * Market Data Reference
 * Source: DFW plumbing contractor market survey (2025)
 * Last Updated: January 2025
 *
 * Notes:
 * - All prices include materials, labor, and typical markup
 * - Prices assume code-compliant installation
 * - Slab foundation adjustments apply to most DFW homes
 * - Permit costs vary by municipality (Dallas, Fort Worth, Frisco, etc.)
 */
