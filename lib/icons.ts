/**
 * Icon paths for Windows XP–style UI.
 * Icons live in public/icons/ as .ico files (no conversion needed).
 * See public/icons/README.md for expected filenames.
 */
export const ICON_PATHS = {
  folder: "/icons/folder.ico",
  notepad: "/icons/notepad.ico",
  aim: "/icons/aim.ico",
  aol: "/icons/aol.ico",
  start: "/icons/start.ico",
  windowsxp: "/icons/WindowsXP.ico",
  file: "/icons/file.ico",
  /** Sign On window: Help button */
  help: "/icons/help.ico",
  /** Sign On window: Setup button */
  setup: "/icons/setup.ico",
  /** Sign On window: next to ScreenName label */
  key: "/icons/key.ico",
} as const;

export type IconName = keyof typeof ICON_PATHS;

/** Resolve the public URL for an icon by name. */
export function iconPath(name: IconName): string {
  return ICON_PATHS[name];
}
