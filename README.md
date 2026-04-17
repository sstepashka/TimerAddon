# TimerAddon

A Minecraft Bedrock Edition behavior pack that adds a redstone timer block — place it, power it with redstone, and it emits a pulse after a configurable countdown.

## Installation

### Development / Testing

1. Copy or symlink this folder into your Minecraft **development behavior packs** directory:

   **Windows:**
   ```
   %LocalAppData%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_behavior_packs\TimerAddon
   ```

   **macOS (Preview):**
   ```
   ~/Library/Application Support/minecraftpe/games/com.mojang/development_behavior_packs/TimerAddon
   ```

2. Launch Minecraft, create or open a world, go to **Add-Ons → Behavior Packs**, and activate **Redstone Timer Add-on**.
3. Enable **cheats** on the world (required for `/reload`).

## Reloading after code changes

After editing `scripts/main.js` or any pack files, you can apply changes without restarting Minecraft:

1. Save your changes.
2. In-game, open the chat and run:
   ```
   /reload
   ```
3. The scripting engine will restart and pick up the updated files.

> **Note:** `/reload` only reloads scripts. Changes to block definitions (`blocks/timer.json`) or `manifest.json` require fully closing and reopening the world.