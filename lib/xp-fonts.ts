/**
 * Windows XP and AOL AIM typography constants.
 * Based on research: XP used Tahoma as primary UI font, AIM used Tahoma.
 * "MS Shell Dlg 2" is a virtual font name that maps to the correct UI font per locale.
 */

/** Windows XP UI font stack (title bars, menus, buttons, dialogs) */
export const FONT_XP_UI = '"MS Shell Dlg 2", Tahoma, Verdana, sans-serif';

/** AOL AIM font stack (matches XP UI) */
export const FONT_AIM = '"MS Shell Dlg 2", Tahoma, Verdana, sans-serif';

/** Windows XP Notepad content font (monospace) */
export const FONT_NOTEPAD = 'Fixedsys, "Courier New", Courier, monospace';

/** Standard XP UI font sizes */
export const FONT_SIZE_XP = {
  /** Small UI text (version numbers, labels) */
  small: '9px',
  /** Standard UI text (buttons, menus) */
  standard: '11px',
  /** Title bar text */
  title: '13px',
  /** Message box text (8.25pt ≈ 11px) */
  message: '11px',
} as const;
