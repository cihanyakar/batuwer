import type { MapDefinition } from './types';

export const MAP_GRASSLANDS: MapDefinition = {
  id: 'grasslands',
  name: 'Grasslands',
  description: 'A winding path through open fields',
  width: 1200,
  height: 800,
  paths: [
    {
      waypoints: [
        { x: 0, y: 400 },
        { x: 300, y: 400 },
        { x: 300, y: 200 },
        { x: 600, y: 200 },
        { x: 600, y: 600 },
        { x: 900, y: 600 },
        { x: 900, y: 400 },
        { x: 1200, y: 400 },
      ],
    },
  ],
  towerSlots: [
    { id: 'ts1', position: { x: 200, y: 300 } },
    { id: 'ts2', position: { x: 450, y: 300 } },
    { id: 'ts3', position: { x: 450, y: 100 } },
    { id: 'ts4', position: { x: 750, y: 500 } },
    { id: 'ts5', position: { x: 750, y: 700 } },
    { id: 'ts6', position: { x: 1000, y: 300 } },
  ],
  spawnPoints: [{ id: 'sp1', position: { x: 0, y: 400 }, pathIndex: 0 }],
  endPoint: { x: 1200, y: 400 },
  previewColor: 0x44aa44,
};

export const MAP_FORTRESS: MapDefinition = {
  id: 'fortress',
  name: 'Fortress',
  description: 'Enemies approach from two sides',
  width: 1200,
  height: 800,
  paths: [
    {
      waypoints: [
        { x: 0, y: 200 },
        { x: 400, y: 200 },
        { x: 400, y: 400 },
        { x: 600, y: 400 },
      ],
    },
    {
      waypoints: [
        { x: 0, y: 600 },
        { x: 400, y: 600 },
        { x: 400, y: 400 },
        { x: 600, y: 400 },
      ],
    },
  ],
  towerSlots: [
    { id: 'ts1', position: { x: 200, y: 100 } },
    { id: 'ts2', position: { x: 200, y: 300 } },
    { id: 'ts3', position: { x: 200, y: 500 } },
    { id: 'ts4', position: { x: 200, y: 700 } },
    { id: 'ts5', position: { x: 500, y: 300 } },
    { id: 'ts6', position: { x: 500, y: 500 } },
    { id: 'ts7', position: { x: 700, y: 400 } },
  ],
  spawnPoints: [
    { id: 'sp1', position: { x: 0, y: 200 }, pathIndex: 0 },
    { id: 'sp2', position: { x: 0, y: 600 }, pathIndex: 1 },
  ],
  endPoint: { x: 600, y: 400 },
  previewColor: 0x8888aa,
};

export const ALL_MAPS: readonly MapDefinition[] = [MAP_GRASSLANDS, MAP_FORTRESS];

export function getMapById(id: string): MapDefinition | undefined {
  return ALL_MAPS.find((m) => m.id === id);
}
