/**
 * Shared utility functions used across the monorepo
 */

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function weightedAverage(scores: Array<{ score: number; weight: number }>): number {
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const weighted = scores.reduce((sum, s) => sum + s.score * s.weight, 0);
  return totalWeight ? weighted / totalWeight : 0;
}

export function normalizeScore(raw: number, min = 0, max = 100): number {
  return clamp(Math.round(((raw - min) / (max - min)) * 100), 0, 100);
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}
