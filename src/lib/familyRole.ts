/** Classify family member by role for public detail layout only. */

export type FamilyAudience = 'adult' | 'child' | 'general';

const CHILD_ROLES = new Set([
  'child',
  'son',
  'daughter',
  'kid',
  'kids',
  'boy',
  'girl',
  '子ども',
  '子供',
  'むすこ',
  'むすめ',
  '息子',
  '娘',
  '長男',
  '次男',
  '三男',
  '長女',
  '次女',
  '三女',
]);

const ADULT_ROLES = new Set([
  'father',
  'mother',
  'parent',
  'parents',
  'grandfather',
  'grandmother',
  'adult',
  'family',
  '父',
  '母',
  '祖父',
  '祖母',
]);

export function classifyFamilyAudience(
  role?: string | null,
): FamilyAudience {
  const normalized = (role || '').trim().toLowerCase();
  if (!normalized) return 'general';
  if (CHILD_ROLES.has(normalized)) return 'child';
  if (ADULT_ROLES.has(normalized)) return 'adult';
  return 'general';
}
