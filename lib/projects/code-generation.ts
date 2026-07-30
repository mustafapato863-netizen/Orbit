function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function nextSequenceCode(
  prefix: string,
  existingCodes: readonly string[],
  padding = 3,
) {
  const pattern = new RegExp(`^${escapeRegExp(prefix)}-(\\d+)$`, "i");
  const maximum = existingCodes.reduce((current, code) => {
    const match = pattern.exec(code.trim());
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);

  return `${prefix.toUpperCase()}-${String(maximum + 1).padStart(padding, "0")}`;
}

export function nextChildCode(
  parentCode: string,
  existingCodes: readonly string[],
) {
  const safeParent = parentCode.trim().slice(0, 34);
  const pattern = new RegExp(`^${escapeRegExp(safeParent)}\\.(\\d+)$`, "i");
  const maximum = existingCodes.reduce((current, code) => {
    const match = pattern.exec(code.trim());
    return match ? Math.max(current, Number(match[1])) : current;
  }, 0);

  return `${safeParent}.${maximum + 1}`;
}
