/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);

// This environment cannot download Remotion's browser; use the pre-installed headless shell.
// Override with REMOTION_BROWSER_EXECUTABLE elsewhere.
Config.setBrowserExecutable(
  process.env.REMOTION_BROWSER_EXECUTABLE ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
);
Config.setChromiumOpenGlRenderer("swangle");
Config.setJpegQuality(92);
