# Custom Cursor

Place your custom cursor PNG files here.

## Required File

- **`cursor.png`** - Default cursor (required)
  - **Size:** 16×16 pixels (standard) or 32×32 pixels (high-DPI)
  - **Format:** PNG with transparency
  - This will be used as the default cursor across the entire site

## Optional Files

If you want different cursors for different interaction states:

- **`cursor-pointer.png`** - Pointer cursor for clickable elements (links, buttons)
- **`cursor-text.png`** - Text cursor for input fields and text areas
- **`cursor-move.png`** - Move cursor for draggable elements (window title bars)
- **`cursor-loading.png`** - Loading cursor when LLM is generating a response (animated spinner/hourglass recommended)

## Resizing Your Cursor Image

CSS cursor property doesn't resize images automatically. Your PNG must be pre-sized:

- **Standard:** 16×16 pixels (works on all displays)
- **High-DPI:** 32×32 pixels (looks sharper on retina/high-DPI screens)

**To resize:** Use an image editor (Photoshop, GIMP, online tools) to resize your cursor image to 16×16 or 32×32 pixels before placing it here.

The CSS in `app/globals.css` will automatically apply these cursors with fallbacks to system cursors if files are missing.
