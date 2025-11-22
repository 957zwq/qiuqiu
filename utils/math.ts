import { Vector } from '../types';

export const getRandomPos = (max: number) => Math.random() * max;

export const getDistance = (a: Vector, b: Vector) => Math.hypot(a.x - b.x, a.y - b.y);

export const randomColor = (palette: string[]) => palette[Math.floor(Math.random() * palette.length)];

// Standard Circle Collision
// Returns true if circle A is completely inside circle B (B eats A)
export const checkEatingCollision = (
  x1: number, y1: number, r1: number, 
  x2: number, y2: number, r2: number
): boolean => {
  const dist = Math.hypot(x1 - x2, y1 - y2);
  // To eat, you must be significantly bigger (e.g. 20% bigger mass, ~10% bigger radius) 
  // and your center must be close enough
  return r1 > r2 * 1.1 && dist < r1 - r2 * 0.4;
};

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
