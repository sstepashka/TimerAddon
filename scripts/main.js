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
        onTick: ({ block }) => {
            const key = locationKey(block);
            const isActive = block.permutation.getState("custom:is_active");
            const isFinished = block.permutation.getState("custom:is_finished");
            const powered = (block.getRedstonePower() ?? 0) > 0;

            if (!isActive && !isFinished && powered) {
                // Start countdown
                const duration = activeTimers.get(key)?.duration ?? 100;
                activeTimers.set(key, { startTick: system.currentTick, duration });
                block.setPermutation(block.permutation.withState("custom:is_active", true));

            } else if (isActive && !isFinished) {
                // Check if countdown elapsed
                const data = activeTimers.get(key);
                if (data && system.currentTick - data.startTick >= data.duration) {
                    block.setPermutation(block.permutation.withState("custom:is_finished", true));
                    activeTimers.set(key, { ...data, pulseStart: system.currentTick });
                }

            } else if (isActive && isFinished) {
                // Auto-reset after pulse
                const data = activeTimers.get(key);
                if (data?.pulseStart !== undefined && system.currentTick - data.pulseStart >= PULSE_DURATION) {
                    const duration = data.duration;
                    activeTimers.set(key, { duration }); // preserve setting, clear run state
                    block.setPermutation(block.permutation
                        .withState("custom:is_active", false)
                        .withState("custom:is_finished", false));
                }
            }
        },

        onPlayerInteract: ({ block, player }) => {
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
                        const existing = activeTimers.get(key) ?? {};
                        activeTimers.set(key, { ...existing, duration: TIMER_DURATIONS[response.selection] });
                    });
            });
        },

        onPlayerDestroy: ({ block }) => {
            activeTimers.delete(locationKey(block));
        },
    });
});
