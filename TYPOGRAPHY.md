# Windows XP & AOL AIM Typography Reference

This document outlines the typography choices made to faithfully replicate Windows XP and AOL Instant Messenger UI.

## Research Summary

### Windows XP Desktop UI
- **Primary UI Font:** Tahoma (introduced in Windows 2000, replacing Microsoft Sans Serif)
- **Virtual Font Name:** "MS Shell Dlg 2" — Microsoft's recommended virtual font name that maps to the correct UI font per locale
- **Message Boxes:** MS Sans Serif at 8.25pt (≈11px)
- **Standard UI Text:** Typically 8-11pt
- **Title Bars:** ~13pt

### AOL Instant Messenger (AIM)
- **Font:** Tahoma (standard Windows UI font of the era)
- **Era:** 1990s-2000s Windows applications used Microsoft-commissioned fonts (Tahoma, Verdana)
- **Chat Windows:** Used system UI fonts consistent with Windows XP

### Windows XP Notepad
- **Content Area:** Monospace font (Fixedsys or Courier New)
- **UI Elements:** Tahoma (title bar, menus)

## Implementation

### Font Constants (`lib/xp-fonts.ts`)

```typescript
FONT_XP_UI = '"MS Shell Dlg 2", Tahoma, Verdana, sans-serif'
FONT_AIM = '"MS Shell Dlg 2", Tahoma, Verdana, sans-serif'
FONT_NOTEPAD = 'Fixedsys, "Courier New", Courier, monospace'
```

**Why "MS Shell Dlg 2"?**
- Microsoft's virtual font name that ensures correct font mapping across locales
- Falls back to Tahoma on English systems
- Provides better internationalization support

### Font Sizes

- **Small (9px):** Version numbers, small labels
- **Standard (11px):** Buttons, menus, input fields, message box text
- **Title (13px):** Title bar text, headings

### Component Usage

- **DesktopShell:** `FONT_XP_UI` for taskbar
- **AIMSignOnWindow:** `FONT_XP_UI` throughout, sizes from `FONT_SIZE_XP`
- **AIMChatWindow:** `FONT_AIM` (same as `FONT_XP_UI`) for all UI
- **ChatBlock (AIM layout):** `FONT_AIM` for messages, formatting toolbar, input
- **NotepadWindow:** 
  - UI (title bar, menus): `FONT_XP_UI`
  - Content area: `FONT_NOTEPAD` (monospace, like real XP Notepad)

## Notes

- Browsers may not have Fixedsys installed; fallback chain ensures Courier New or Courier displays
- "MS Shell Dlg 2" may not resolve in all browsers; Tahoma fallback ensures compatibility
- Font sizes use pixel values matching XP's point-based system (8.25pt ≈ 11px)
