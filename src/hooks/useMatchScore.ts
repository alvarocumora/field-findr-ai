import { useMemo } from 'react';
import { Listing } from '@/hooks/useListings';

export interface InvestorProfile {
  investmentGoal: 'living' | 'investment' | 'development' | 'agriculture';
  budgetMin: number;
  budgetMax: number;
  preferredAreaMin: number;
  preferredAreaMax: number;
  preferredRegions: string[];
  preferredTypes: string[];
  preferredTags: string[];
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface MatchResult {
  score: number;
  criteria: { label: string; matched: boolean; weight: number }[];
}

// Default profile for users without a saved profile
const DEFAULT_PROFILE: InvestorProfile = {
  investmentGoal: 'investment',
  budgetMin: 0,
  budgetMax: 1000000000,
  preferredAreaMin: 0,
  preferredAreaMax: 100000,
  preferredRegions: [],
  preferredTypes: [],
  preferredTags: [],
  riskTolerance: 'medium',
};

/**
 * Calculate match score between a listing and investor profile
 */
export const calculateMatchScore = (
  listing: Listing,
  profile: InvestorProfile
): MatchResult => {
  const criteria: { label: string; matched: boolean; weight: number }[] = [];

  // 1. Price within budget (weight: 25)
  const priceInBudget =
    listing.price >= profile.budgetMin && listing.price <= profile.budgetMax;
  criteria.push({
    label: 'Precio dentro del presupuesto',
    matched: priceInBudget,
    weight: 25,
  });

  // 2. Area within preference (weight: 20)
  const areaM2 = listing.area_m2 || (listing.area_ha ? listing.area_ha * 10000 : 0);
  const areaInRange =
    areaM2 >= profile.preferredAreaMin && areaM2 <= profile.preferredAreaMax;
  criteria.push({
    label: 'Superficie adecuada',
    matched: areaInRange,
    weight: 20,
  });

  // 3. Region match (weight: 15)
  const regionMatch =
    profile.preferredRegions.length === 0 ||
    (listing.region && profile.preferredRegions.includes(listing.region));
  criteria.push({
    label: 'Ubicación preferida',
    matched: Boolean(regionMatch),
    weight: 15,
  });

  // 4. Type match (weight: 15)
  const typeMatch =
    profile.preferredTypes.length === 0 ||
    profile.preferredTypes.includes(listing.type);
  criteria.push({
    label: 'Tipo de terreno deseado',
    matched: typeMatch,
    weight: 15,
  });

  // 5. Has preferred tags (weight: 10)
  const tagMatch =
    profile.preferredTags.length === 0 ||
    profile.preferredTags.some((tag) => listing.tags.includes(tag));
  criteria.push({
    label: 'Características deseadas',
    matched: tagMatch,
    weight: 10,
  });

  // 6. Legal status verified (weight: 8)
  const legalVerified = listing.legal_status === 'verified';
  criteria.push({
    label: 'Documentación verificada',
    matched: legalVerified,
    weight: 8,
  });

  // 7. Has utilities (weight: 7)
  const utilitiesObj = listing.utilities as Record<string, unknown> | null;
  const hasUtilities =
    utilitiesObj &&
    typeof utilitiesObj === 'object' &&
    (utilitiesObj.water || utilitiesObj.electricity);
  criteria.push({
    label: 'Servicios básicos',
    matched: Boolean(hasUtilities),
    weight: 7,
  });

  // Calculate weighted score
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const matchedWeight = criteria
    .filter((c) => c.matched)
    .reduce((sum, c) => sum + c.weight, 0);

  const score = Math.round((matchedWeight / totalWeight) * 100);

  return { score, criteria };
};

/**
 * Hook to calculate match scores for listings
 */
export const useMatchScore = (
  listings: Listing[],
  profile?: InvestorProfile | null
) => {
  const effectiveProfile = profile || DEFAULT_PROFILE;

  const scoredListings = useMemo(() => {
    return listings.map((listing) => ({
      listing,
      match: calculateMatchScore(listing, effectiveProfile),
    }));
  }, [listings, effectiveProfile]);

  const sortedByMatch = useMemo(() => {
    return [...scoredListings].sort((a, b) => b.match.score - a.match.score);
  }, [scoredListings]);

  return {
    scoredListings,
    sortedByMatch,
    getMatchForListing: (listingId: string) => {
      const found = scoredListings.find((s) => s.listing.id === listingId);
      return found?.match || null;
    },
  };
};

export default useMatchScore;
