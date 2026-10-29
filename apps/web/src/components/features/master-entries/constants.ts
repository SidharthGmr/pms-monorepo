/**
 * Matches a 3- or 6-digit hex colour. The add/edit dialog no longer collects a colour, but
 * listings still render a swatch for entries that already carry one, so this lives here rather
 * than in the form.
 */
export const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
