/**
 * Depth Mesh Geometry Generator
 *
 * Creates a PlaneGeometry and displaces vertices using a depth map texture.
 * Used by CinematicCanvas to render scenes as 3D depth-displaced meshes.
 */

import * as THREE from 'three';

export interface DepthMeshConfig {
  subdivisions: number;     // Grid density (default 128)
  depthScale: number;       // Depth displacement amount (default 2.0)
  depthCurve: 'linear' | 'exponential'; // How depth values are mapped
  width: number;            // Mesh world width
  height: number;           // Mesh world height
}

const DEFAULT_CONFIG: DepthMeshConfig = {
  subdivisions: 128,
  depthScale: 2.0,
  depthCurve: 'linear',
  width: 8,
  height: 4.5,
};

/**
 * Read pixel data from a depth map texture (via offscreen canvas).
 */
function readDepthMap(depthTexture: THREE.Texture, resolution: number): Float32Array {
  const image = depthTexture.image;
  if (!image) return new Float32Array(resolution * resolution);

  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Float32Array(resolution * resolution);

  ctx.drawImage(image, 0, 0, resolution, resolution);
  const imageData = ctx.getImageData(0, 0, resolution, resolution);
  const data = imageData.data;

  const depths = new Float32Array(resolution * resolution);
  for (let i = 0; i < depths.length; i++) {
    // Use red channel normalized to 0-1 (most depth maps are grayscale)
    depths[i] = data[i * 4] / 255;
  }

  return depths;
}

/**
 * Create a depth-displaced mesh geometry from a depth map texture.
 */
export function createDepthMeshGeometry(
  depthTexture: THREE.Texture,
  config: Partial<DepthMeshConfig> = {},
): THREE.PlaneGeometry {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { subdivisions, depthScale, depthCurve, width, height } = cfg;

  const geometry = new THREE.PlaneGeometry(width, height, subdivisions, subdivisions);
  const positions = geometry.attributes.position;
  const uvs = geometry.attributes.uv;

  const depths = readDepthMap(depthTexture, subdivisions + 1);

  for (let i = 0; i < positions.count; i++) {
    const u = uvs.getX(i);
    const v = uvs.getY(i);

    // Sample depth from the map (flip V because texture coords are bottom-up)
    const px = Math.floor(u * subdivisions);
    const py = Math.floor((1 - v) * subdivisions);
    const idx = py * (subdivisions + 1) + px;
    let depth = depths[idx] ?? 0;

    // Apply depth curve
    if (depthCurve === 'exponential') {
      depth = Math.pow(depth, 2.0);
    }

    // Displace along Z axis (white = near/high, black = far/low)
    positions.setZ(i, depth * depthScale);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Update an existing geometry's vertex displacement when the depth map changes.
 */
export function updateDepthDisplacement(
  geometry: THREE.PlaneGeometry,
  depthTexture: THREE.Texture,
  config: Partial<DepthMeshConfig> = {},
) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { subdivisions, depthScale, depthCurve } = cfg;

  const positions = geometry.attributes.position;
  const uvs = geometry.attributes.uv;
  const depths = readDepthMap(depthTexture, subdivisions + 1);

  for (let i = 0; i < positions.count; i++) {
    const u = uvs.getX(i);
    const v = uvs.getY(i);

    const px = Math.floor(u * subdivisions);
    const py = Math.floor((1 - v) * subdivisions);
    const idx = py * (subdivisions + 1) + px;
    let depth = depths[idx] ?? 0;

    if (depthCurve === 'exponential') {
      depth = Math.pow(depth, 2.0);
    }

    positions.setZ(i, depth * depthScale);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
}

/**
 * Given a UV coordinate and depth map, get the 3D position on the mesh.
 * Used for placing elements at specific depth positions.
 */
export function getDepthPosition(
  u: number,
  v: number,
  depthTexture: THREE.Texture,
  config: Partial<DepthMeshConfig> = {},
): THREE.Vector3 {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { subdivisions, depthScale, depthCurve, width, height } = cfg;

  const depths = readDepthMap(depthTexture, subdivisions + 1);

  const px = Math.floor(u * subdivisions);
  const py = Math.floor((1 - v) * subdivisions);
  const idx = py * (subdivisions + 1) + px;
  let depth = depths[idx] ?? 0;

  if (depthCurve === 'exponential') {
    depth = Math.pow(depth, 2.0);
  }

  return new THREE.Vector3(
    (u - 0.5) * width,
    (v - 0.5) * height,
    depth * depthScale,
  );
}
