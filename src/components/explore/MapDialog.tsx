import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import EnhancedMap from '@/components/map/EnhancedMap';
import MapErrorBoundary from '@/components/map/MapErrorBoundary';
import DemandHeatmapToggle from '@/components/explore/DemandHeatmapToggle';
import { Listing } from '@/hooks/useListings';

interface MapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listings: Listing[];
  onListingClick: (listing: Listing) => void;
}

const MapDialog = ({ open, onOpenChange, listings, onListingClick }: MapDialogProps) => {
  const [showDemandHeatmap, setShowDemandHeatmap] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[85vh] p-0 rounded-xl overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Mapa de propiedades</DialogTitle>
        </VisuallyHidden>
        <MapErrorBoundary>
          <div className="relative w-full h-full">
            <EnhancedMap
              listings={listings}
              hoveredListing={null}
              selectedListing={null}
              onListingHover={() => {}}
              onListingClick={(listing) => {
                onListingClick(listing);
                onOpenChange(false);
              }}
              className="w-full h-full"
            />
            {/* Demand heatmap toggle */}
            <div className="absolute top-4 right-4 z-10">
              <DemandHeatmapToggle
                active={showDemandHeatmap}
                onToggle={() => setShowDemandHeatmap(!showDemandHeatmap)}
              />
            </div>
          </div>
        </MapErrorBoundary>
      </DialogContent>
    </Dialog>
  );
};

export default MapDialog;
