import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const TIMER_DURATIONS = [100, 200, 600]; // 5s, 10s, 30s in ticks
const PULSE_DURATION = 20; // 1 second output pulse

// In-memory map: locationKey -> { startTick, duration, pulseStart? }
const activeTimers = new Map();

function locationKey(block) {
    const { x, y, z } = block.location;
    return `${block.dimension.id}:${x},${y},${z}`;
}

world.beforeEvents.worldInitialize.subscribe((initEvent) => {
    initEvent.blockComponentRegistry.registerCustomComponent("custom:timer_logic", {
        onRedstoneUpdate: (arg) => {
            const { block, newValue, oldValue } = arg;
            console.warn(`[onRedstoneUpdate] Block: ${locationKey(block)}, Old: ${oldValue}, New: ${newValue}`);
        },

        onTick: (arg) => {
            const { block } = arg;
            const key = locationKey(block);
            const isActive = block.permutation.getState("custom:is_active");
            const isFinished = block.permutation.getState("custom:is_finished");

            // Redstone detection
            let powerLevel = block.getRedstonePower();
            const powered = (powerLevel ?? 0) > 0;

            if (system.currentTick % 20 === 0 || (powered && !isActive)) {
                console.warn(`[onTick] Block: ${key}, isActive: ${isActive}, isFinished: ${isFinished}, powered: ${powered}, power: ${powerLevel}`);
            }

            if (!isActive && !isFinished && powered) {
                const duration = activeTimers.get(key)?.duration ?? 100;
                activeTimers.set(key, { startTick: system.currentTick, duration });
                block.setPermutation(block.permutation.withState("custom:is_active", true));
                console.warn(`Timer triggered at ${key}. Duration: ${duration / 20}s`);

            } else if (isActive && !isFinished) {
                const data = activeTimers.get(key);
                if (data && system.currentTick - data.startTick >= data.duration) {
                    block.setPermutation(block.permutation.withState("custom:is_finished", true));
                    activeTimers.set(key, { ...data, pulseStart: system.currentTick });
                    console.warn(`Timer finished at ${key}. Emitting pulse.`);
                }

            } else if (isActive && isFinished) {
                const data = activeTimers.get(key);
                if (data?.pulseStart !== undefined && system.currentTick - data.pulseStart >= PULSE_DURATION) {
                    const duration = data.duration;
                    activeTimers.set(key, { duration });
                    block.setPermutation(block.permutation
                        .withState("custom:is_active", false)
                        .withState("custom:is_finished", false));
                }
            }
        },

        onPlayerInteract: (arg) => {
            const { block, player } = arg;
            if (!player) return;
            const key = locationKey(block);

            system.run(() => {
                new ActionFormData()
                    .title("Set Timer Duration")
                    .button("5 Seconds")
                    .button("10 Seconds")
                    .button("30 Seconds")
                    .show(player)
                    .then((response) => {
                        if (response.canceled || response.selection === undefined) return;
                        const duration = TIMER_DURATIONS[response.selection];
                        const existing = activeTimers.get(key) ?? {};
                        activeTimers.set(key, { ...existing, duration });

                        const message = `Timer set to ${duration / 20} seconds for block at ${key}`;
                        console.warn(message);
                        player.sendMessage(message);
                    });
            });
        },

        onPlayerDestroy: (arg) => {
            const { block } = arg;
            activeTimers.delete(locationKey(block));
        },
    });
});
