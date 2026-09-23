import { useMemo } from 'react';
import * as THREE from 'three';

interface SolarLightProps {
  hour: number; // 0-24
  latitude?: number;
  longitude?: number;
  /** Terrain plane size in metres — scales sun distance and shadow frustum. */
  terrainSize?: number;
}

/**
 * Sun direction from hour + latitude (simplified solar position). Shared by the
 * directional light AND the drei <Sky>, so shadows and the visible sun agree.
 */
export function computeSunPosition(hour: number, latitude = -35, dist = 1): THREE.Vector3 {
  const h = ((hour % 24) + 24) % 24;
  const solarNoon = 12;
  const hourAngle = (h - solarNoon) * 15 * (Math.PI / 180); // 15 degrees per hour
  const latRad = latitude * (Math.PI / 180);
  const declination = 23.45 * Math.sin(((2 * Math.PI) / 365) * (284 + 80)) * (Math.PI / 180);

  const elevation = Math.asin(
    Math.sin(latRad) * Math.sin(declination) +
    Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle)
  );

  const azimuth = hourAngle; // Simplified
  const elev = Math.max(elevation, 0.05); // Keep slightly above horizon
  return new THREE.Vector3(
    dist * Math.cos(elev) * Math.sin(azimuth),
    Math.max(dist * Math.sin(elev), dist * 0.05),
    dist * Math.cos(elev) * Math.cos(azimuth),
  );
}

/**
 * Simulates sunlight direction based on time of day and geographic coordinates.
 * The shadow frustum follows the terrain size — a fixed ±40m box clipped
 * shadows on parcels whose plane spans hundreds of metres.
 */
export const SolarLight = ({ hour, latitude = -35, terrainSize = 120 }: SolarLightProps) => {
  const sunDist = Math.max(80, terrainSize * 0.9);
  const shadowHalf = Math.max(45, terrainSize * 0.55);

  const { position, intensity, color } = useMemo(() => {
    const h = ((hour % 24) + 24) % 24;
    const pos = computeSunPosition(hour, latitude, sunDist);
    const elevFrac = pos.y / sunDist;

    // Standard (lit) materials need a stronger key light than the old unlit scene.
    const intensityVal = h >= 6 && h <= 20
      ? Math.max(0.35, elevFrac * 2.2)
      : 0.12;

    let col: string;
    if (h < 7 || h > 19) col = '#22305e'; // Night blue
    else if (h < 8 || h > 18) col = '#ff8c42'; // Golden hour
    else if (h < 9 || h > 17) col = '#ffb347'; // Warm morning/evening
    else col = '#fffaf0'; // Daylight

    return { position: pos, intensity: intensityVal, color: col };
  }, [hour, latitude, sunDist]);

  const ambientIntensity = useMemo(() => {
    const h = ((hour % 24) + 24) % 24;
    if (h < 6 || h > 20) return 0.12;
    if (h < 8 || h > 18) return 0.25;
    return 0.35;
  }, [hour]);

  return (
    <>
      <ambientLight intensity={ambientIntensity} color={color} />
      {/* Sky/ground bounce so shaded faces keep colour instead of going grey. */}
      <hemisphereLight args={['#cfe2ff', '#77875f', 0.5]} />
      <directionalLight
        position={[position.x, position.y, position.z]}
        intensity={intensity}
        color={color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={sunDist * 3}
        shadow-camera-left={-shadowHalf}
        shadow-camera-right={shadowHalf}
        shadow-camera-top={shadowHalf}
        shadow-camera-bottom={-shadowHalf}
        shadow-bias={-0.0004}
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
