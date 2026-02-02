# Windows XP Icons

Place your `.ico` files in this folder. The app will use them for desktop and window iconography. **No conversion is required**—browsers support `.ico` directly.

## Expected filenames (AOL chat flow + desktop)

| Filename       | Used for |
|----------------|----------|
| `folder.ico`   | Desktop project folders |
| `notepad.ico`  | Notepad window title bar, taskbar Notepad button |
| `aim.ico`      | AIM Sign On: title bar, blue panel logo, Sign On button; AIM chat: title bar; taskbar AIM button |
| `aol.ico`      | Desktop AOL Instant Messenger icon |
| `file.ico`     | Desktop Resume file icon |
| `start.ico`    | Taskbar Start button |
| `help.ico`     | Sign On window Help button |
| `setup.ico`    | Sign On window Setup (wrench) button |
| `key.ico`      | Sign On window, next to “ScreenName” label |

Each spot uses the `.ico` when present and falls back to the built-in SVG/text if the file is missing or fails to load.

You can add more and reference them via `iconPath('your-name')` in `lib/icons.ts`. Name the file `your-name.ico`.
