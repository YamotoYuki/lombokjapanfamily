/** Detect seeded dummy family profiles for cleanup / admin filters. */

const DUMMY_NAME_PREFIX = /^DUMMY\s*[-–—]/i;

export function isDummyFamilyName(name?: string | null): boolean {
  return DUMMY_NAME_PREFIX.test((name || '').trim());
}

export function isDummyFamilyProfile(profile: {
  name?: string | null;
  display_name?: string | null;
}): boolean {
  return (
    isDummyFamilyName(profile.name) || isDummyFamilyName(profile.display_name)
  );
}
