# Project Media Files

Place your project images and videos in this folder.

## File Path Format

When referencing files in `projects.json`, use the following path format:

- **Images**: `/projects/your-image-filename.jpg`
- **Videos**: `/projects/your-video-filename.mp4`

## Examples

```json
{
  "images": [
    "/projects/design-system-screenshot.png",
    "/projects/lift-results-ui.jpg"
  ],
  "videos": [
    "/projects/prototype-demo.mp4",
    "/projects/walkthrough.webm"
  ]
}
```

## Supported Formats

- **Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`
- **Videos**: `.mp4`, `.webm`, `.ogg`, `.mov`

## File Organization

You can organize files however you like within this folder. For example:
- Flat structure: all files directly in `/projects/`
- By project: `/projects/project-01/`, `/projects/project-02/`, etc.
- By type: `/projects/images/`, `/projects/videos/`

Just make sure your paths in `projects.json` match your folder structure!
