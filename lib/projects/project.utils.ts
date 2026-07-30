export function slugifyProject(name: string, code: string) {
  const base = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  const codeSuffix = code
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "project"}-${codeSuffix}`.slice(0, 120);
}

export function optionalDateValue(value: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export function optionalTextValue(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

export function dateInputValue(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? "";
}

export function displayEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
