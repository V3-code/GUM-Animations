export function compareVersions(left, right) {
  const normalize = value => String(value || "0").split(/[.-]/).slice(0, 3).map(part => Number.parseInt(part, 10) || 0);
  const a = normalize(left);
  const b = normalize(right);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
  }
  return 0;
}

export function resolvePlaceable(value) {
  if (!value) return null;
  if (value.center || value.mesh || value.documentName === "Token") return value;
  return value.object || value.document?.object || value.token?.object || null;
}

export function resolvePlaceables(values) {
  return Array.from(values || []).map(resolvePlaceable).filter(Boolean);
}
