// KMZ Parser - Main entry point
// Refactored for stability and better polygon extraction

import JSZip from 'jszip';
import { KMLPlacemark, ParsedKMZ, LotInfo } from './types';
import { parseKML } from './kmlParser';
import { generatePolygonsFromPoints } from './polygonBuilder';
import { calculatePolygonArea } from './geometry';

// Re-export types and utilities
export type { KMLPlacemark, ParsedKMZ, LotInfo };
export { calculatePolygonArea, generatePolygonsFromPoints };

// Calculate bounds and center from placemarks
const calculateBoundsAndCenter = (placemarks: KMLPlacemark[]) => {
  let north = -90, south = 90, east = -180, west = 180;
  
  placemarks.forEach(p => {
    p.coordinates.forEach(([lng, lat]) => {
      if (lat > north) north = lat;
      if (lat < south) south = lat;
      if (lng > east) east = lng;
      if (lng < west) west = lng;
    });
  });
  
  return {
    bounds: { north, south, east, west },
    center: {
      lat: (north + south) / 2,
      lng: (east + west) / 2,
    },
  };
};

// Main function to parse KMZ file
export const parseKMZFile = async (file: File): Promise<ParsedKMZ> => {
  console.log('=== PARSING KMZ FILE ===');
  console.log('File name:', file.name, 'Size:', file.size);
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Find KML file in the zip
    let kmlContent: string | null = null;
    const fileList = Object.keys(zip.files);
    console.log('Files in KMZ:', fileList);
    
    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if (filename.toLowerCase().endsWith('.kml')) {
        kmlContent = await zipEntry.async('string');
        console.log('Found KML:', filename, 'Length:', kmlContent.length);
        break;
      }
    }
    
    if (!kmlContent) {
      // Maybe it's a plain KML file renamed as KMZ
      console.log('No KML found in archive, trying as plain text');
      kmlContent = await file.text();
    }
    
    const placemarks = parseKML(kmlContent);
    const { bounds, center } = calculateBoundsAndCenter(placemarks);
    
    const metadata = {
      totalPlacemarks: placemarks.length,
      polygons: placemarks.filter(p => p.isPolygon).length,
      lineStrings: placemarks.filter(p => p.originalType === 'LineString').length,
      points: placemarks.filter(p => p.originalType === 'Point').length,
    };
    
    console.log('=== KMZ PARSE COMPLETE ===');
    console.log('Metadata:', metadata);
    console.log('Center:', center);
    
    return {
      placemarks,
      bounds,
      center,
      metadata,
    };
  } catch (error) {
    console.error('Error parsing KMZ:', error);
    throw new Error(`Failed to parse KMZ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Parse a plain KML file
export const parseKMLFile = async (file: File): Promise<ParsedKMZ> => {
  console.log('=== PARSING KML FILE ===');
  
  try {
    const kmlContent = await file.text();
    const placemarks = parseKML(kmlContent);
    const { bounds, center } = calculateBoundsAndCenter(placemarks);
    
    return {
      placemarks,
      bounds,
      center,
    };
  } catch (error) {
    console.error('Error parsing KML:', error);
    throw new Error(`Failed to parse KML file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Parse KMZ from URL (for auto-import)
export const parseKMZFromUrl = async (url: string): Promise<ParsedKMZ> => {
  console.log('=== PARSING KMZ FROM URL ===');
  console.log('URL:', url);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch KMZ: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const file = new File([blob], 'imported.kmz', { type: 'application/vnd.google-earth.kmz' });
    
    return parseKMZFile(file);
  } catch (error) {
    console.error('Error fetching/parsing KMZ from URL:', error);
    throw error;
  }
};
