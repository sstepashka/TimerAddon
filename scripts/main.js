import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const TIMER_DURATION = 100; // Default 5 seconds (20 ticks = 1s)

world.beforeEvents.worldInitialize.subscribe((initEvent) => {
    initEvent.blockComponentRegistry.registerCustomComponent("custom:timer_logic", {
        onTick: (event) => {
            const { block } = event;
            const isActive = block.permutation.getState("custom:is_active");
            
            // Logic: If powered by redstone and not already active, start countdown
            if (block.getRedstonePower() > 0 && !isActive) {
                block.setPermutation(block.permutation.withState("custom:is_active", true));
                
                system.runTimeout(() => {
                    // When time finishes, set finished state to true
                    block.setPermutation(block.permutation.withState("custom:is_finished", true));
                    
                    // Reset after a brief pulse (e.g., 2 seconds)
                    system.runTimeout(() => {
                        block.setPermutation(block.permutation.withState("custom:is_active", false));
                        block.setPermutation(block.permutation.withState("custom:is_finished", false));
                    }, 40); 
                }, TIMER_DURATION);
            }
        }
    });
});

// Optional: UI to set time when interacting with the block
world.beforeEvents.itemUseOn.subscribe((event) => {
    if (event.block.typeId === "custom:timer") {
        system.run(() => {
            const player = event.source;
            const form = new ActionFormData()
                .title("Set Timer")
                .button("5 Seconds")
                .button("10 Seconds")
                .button("30 Seconds");

            form.show(player).then((response) => {
                if (response.selection === 0) /* Set dynamic property logic here */;
            });
        });
    }
});
