import type { BeehiveType } from '@/types/beehive';
import { calculateDistance, findEmptyPosition, isPositionOccupied } from './calculatePosition';

const hives: BeehiveType[] = [
  { beehiveId: 1, xDirection: 0, yDirection: 0 },
  { beehiveId: 2, xDirection: 130, yDirection: 0 },
  { beehiveId: 1, xDirection: 3000, yDirection: 0 },
  { beehiveId: 2, xDirection: 3000, yDirection: 130 },
] as BeehiveType[];

test('Unit - func - calculateDistance(hive1, hive2)', () => {
  expect(calculateDistance(0, 0, 3, 4)).toBe(5);
  expect(calculateDistance(1, 1, 4, 5)).toBe(5);
  expect(calculateDistance(0, 0, 0, 0)).toBe(0);
  expect(calculateDistance(1, 2, 1, 2)).toBe(0);
  expect(calculateDistance(1, 1, 1, 2)).toBe(1);
});

test('Unit - func - isPositionOccupied(x, y, hives)', () => {
  expect(isPositionOccupied(0, 0, hives)).toBe(true);
  expect(isPositionOccupied(249, 0, hives)).toBe(true);
  expect(isPositionOccupied(250, 0, hives)).toBe(false);

  expect(isPositionOccupied(3000, 249, hives)).toBe(true);
  expect(isPositionOccupied(3000, 250, hives)).toBe(false);
});

test('Unit - func - findEmptyPosition(hives)', () => {
  let pos = findEmptyPosition(hives);
  expect(isPositionOccupied(pos.x, pos.y, hives)).toBe(false);

  pos = findEmptyPosition(hives, 500, 0);
  expect(isPositionOccupied(pos.x, pos.y, hives)).toBe(false);

  pos = findEmptyPosition(hives, 0, 500);
  expect(isPositionOccupied(pos.x, pos.y, hives)).toBe(false);

  pos = findEmptyPosition(hives, 500, 500);
  expect(isPositionOccupied(pos.x, pos.y, hives)).toBe(false);
});
