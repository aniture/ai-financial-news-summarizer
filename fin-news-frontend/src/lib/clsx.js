// Local join helper. The app previously declared this inline in App.jsx; it is
// shared now that components live in their own files.
export function clsx(...parts) {
  return parts.filter(Boolean).join(" ");
}
