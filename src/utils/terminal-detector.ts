import { debug } from '@/logger';
import { $ } from 'bun';

/**
 * Known terminal application Bundle IDs
 */
const TERMINAL_BUNDLE_IDS = [
  'com.apple.Terminal', // macOS Terminal
  'com.googlecode.iterm2', // iTerm2
  'dev.warp.Warp-Stable', // Warp
  'com.github.wez.wezterm', // WezTerm
  'io.alacritty', // Alacritty
  'net.kovidgoyal.kitty', // Kitty
  'com.mitchellh.ghostty', // Ghostty
  'com.jetbrains.intellij', // IntelliJ IDEA
  'com.jetbrains.intellij.ce', // IntelliJ IDEA Community
  'com.jetbrains.AppCode', // AppCode
  'com.jetbrains.CLion', // CLion
  'com.jetbrains.PhpStorm', // PhpStorm
  'com.jetbrains.WebStorm', // WebStorm
  'com.jetbrains.PyCharm', // PyCharm
  'com.microsoft.VSCode', // VS Code
  'com.microsoft.VSCodeInsiders', // VS Code Insiders
  'com.todesktop.230313mzl4w4u92', // Cursor
  'com.apple.dt.Xcode', // Xcode
  'com.sublimetext.4', // Sublime Text 4
  'com.sublimetext.3', // Sublime Text 3
];

/**
 * Keywords to detect terminal-like applications
 */
const TERMINAL_KEYWORDS = ['terminal', 'console', 'iterm', 'shell', 'prompt'];

/**
 * Check if a Bundle ID belongs to a terminal application
 * @param bundleId - Application Bundle ID to check
 * @returns true if the Bundle ID is recognized as a terminal app
 */
export function isTerminalApp(bundleId: string): boolean {
  if (!bundleId) {
    return false;
  }

  const lowerBundleId = bundleId.toLowerCase();

  // Check against known terminal Bundle IDs
  if (TERMINAL_BUNDLE_IDS.includes(bundleId)) {
    return true;
  }

  // Check for terminal-related keywords
  return TERMINAL_KEYWORDS.some((keyword) => lowerBundleId.includes(keyword));
}

/**
 * Get the Bundle ID of the frontmost (foreground) application
 * @returns Bundle ID of the frontmost app, or empty string on error
 */
export async function getFrontmostAppBundleId(): Promise<string> {
  try {
    const result =
      await $`osascript -e 'id of application (path to frontmost application as text)'`.text();

    return result.trim();
  } catch (error) {
    return '';
  }
}

/**
 * Check if the frontmost application is a terminal
 * @returns true if the frontmost app is a terminal
 */
export async function isFrontmostAppTerminal(): Promise<boolean> {
  const bundleId = await getFrontmostAppBundleId();
  const isTerminal = isTerminalApp(bundleId);

  debug(`Frontmost app: ${bundleId}, isTerminal: ${isTerminal}`);

  return isTerminal;
}

/**
 * Detect the Bundle ID of the current terminal application.
 * Works even inside tmux by checking environment variables.
 * @returns Bundle ID of the terminal, or undefined if not detected
 */
export function detectTerminalBundleId(): string | undefined {
  const env = process.env;

  // 1. iTerm2
  if (env.LC_TERMINAL === 'iTerm2' || env.ITERM_SESSION_ID) {
    return 'com.googlecode.iterm2';
  }

  // 2. Ghostty
  if (env.GHOSTTY_RESOURCES_DIR) {
    return 'com.mitchellh.ghostty';
  }

  // 3. WezTerm
  if (env.WEZTERM_EXECUTABLE) {
    return 'com.github.wez.wezterm';
  }

  // 4. Kitty
  if (env.KITTY_WINDOW_ID) {
    return 'net.kovidgoyal.kitty';
  }

  // 5. Alacritty
  if (env.ALACRITTY_SOCKET) {
    return 'io.alacritty';
  }

  // 6. Warp
  if (env.WARP_IS_LOCAL_SHELL_SESSION) {
    return 'dev.warp.Warp-Stable';
  }

  // 7. TERM_PROGRAM 기반 매핑 (tmux 외부 환경)
  const termProgram = env.TERM_PROGRAM;

  if (termProgram && termProgram !== 'tmux') {
    const mapping: Record<string, string> = {
      Apple_Terminal: 'com.apple.Terminal',
      'iTerm.app': 'com.googlecode.iterm2',
      WarpTerminal: 'dev.warp.Warp-Stable',
      WezTerm: 'com.github.wez.wezterm',
      Alacritty: 'io.alacritty',
      kitty: 'net.kovidgoyal.kitty',
      ghostty: 'com.mitchellh.ghostty',
      vscode: 'com.microsoft.VSCode',
    };

    if (mapping[termProgram]) {
      return mapping[termProgram];
    }
  }

  // 8. __CFBundleIdentifier fallback
  const cfBundleId = env.__CFBundleIdentifier;

  if (cfBundleId) {
    return cfBundleId;
  }

  return undefined;
}
