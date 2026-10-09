export type AppRole = "ADMIN" | "EDITOR";

export type Permission =
  | "products.write"
  | "categories.write"
  | "pages.write"
  | "faqs.write"
  | "media.write"
  | "quotes.write"
  | "homepage.write"
  | "seo.write"
  | "settings.write"
  | "users.write"
  | "redirects.write"
  | "audit.read";

const EDITOR_PERMISSIONS = new Set<Permission>([
  "products.write",
  "categories.write",
  "pages.write",
  "faqs.write",
  "media.write",
  "quotes.write",
  "homepage.write",
  "seo.write",
]);

const ADMIN_PERMISSIONS = new Set<Permission>([
  ...EDITOR_PERMISSIONS,
  "settings.write",
  "users.write",
  "redirects.write",
  "audit.read",
]);

export function can(role: AppRole, permission: Permission): boolean {
  const allowed = role === "ADMIN" ? ADMIN_PERMISSIONS : EDITOR_PERMISSIONS;
  return allowed.has(permission);
}
