/** Must match Google account email; set at build time via VITE_ADMIN_EMAIL. */
export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL?.trim() ?? '';
