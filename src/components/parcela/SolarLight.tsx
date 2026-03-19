import { useMemo } from 'react';
import * as THREE from 'three';

interface SolarLightProps {
  hour: number; // 0-24
  latitude?: number;
  longitude?: number;
}

/**
 * Simulates sunlight direction based on time of day and geographic coordinates.
 * Uses a simplified solar position algorithm.
 */
export const SolarLight = ({ hour, latitude = -35, longitude = -71 }: SolarLightProps) => {
  const { position, intensity, color } = useMemo(() => {
    // Normalize hour to 0-24
    const h = ((hour % 24) + 24) % 24;
    
    // Simple solar angle calculation
    // Solar elevation angle (simplified)
    const solarNoon = 12;
    const hourAngle = (h - solarNoon) * 15 * (Math.PI / 180); // 15 degrees per hour
    const latRad = latitude * (Math.PI / 180);
    const declination = 23.45 * Math.sin((2 * Math.PI / 365) * (284 + 80)) * (Math.PI / 180); // Approximate for March
    
    const elevation = Math.asin(
      Math.sin(latRad) * Math.sin(declination) +
      Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle)
    );
    
    const azimuth = hourAngle; // Simplified
    
    // Convert to 3D position
    const dist = 40;
    const elev = Math.max(elevation, 0.05); // Keep slightly above horizon
    const x = dist * Math.cos(elev) * Math.sin(azimuth);
    const y = dist * Math.sin(elev);
    const z = dist * Math.cos(elev) * Math.cos(azimuth);
    
    // Intensity based on elevation
    const intensityVal = h >= 6 && h <= 20
      ? Math.max(0.2, Math.sin(elev) * 1.5)
      : 0.1;
    
    // Color temperature based on hour
    let col: string;
    if (h < 7 || h > 19) col = '#1a1a3e'; // Night blue
    else if (h < 8 || h > 18) col = '#ff8c42'; // Golden hour
    else if (h < 9 || h > 17) col = '#ffb347'; // Warm morning/evening
    else col = '#fffaf0'; // Daylight
    
    return {
      position: new THREE.Vector3(x, Math.max(y, 2), z),
      intensity: intensityVal,
      color: col,
    };
  }, [hour, latitude]);

  const ambientIntensity = useMemo(() => {
    const h = ((hour % 24) + 24) % 24;
    if (h < 6 || h > 20) return 0.15;
    if (h < 8 || h > 18) return 0.3;
    return 0.45;
  }, [hour]);

  return (
    <>
      <ambientLight intensity={ambientIntensity} color={color} />
      <directionalLight
        position={[position.x, position.y, position.z]}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      {/* Fill light from opposite side */}
      <directionalLight
        position={[-position.x * 0.5, position.y * 0.3, -position.z * 0.5]}
        intensity={intensity * 0.15}
        color="#b3d1ff"
      />
    </>
  );
};
