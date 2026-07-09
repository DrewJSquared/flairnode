// test-sense-filter.mjs
// Zero-dependency tests for the sense ID filtering logic in PlaybackController.
// Run with: node test-sense-filter.mjs

// Mirrors the exact condition in PlaybackController.mjs handleNewSenseData()
function shouldFireTrigger(trigger, packet) {
    if (trigger.sense_id != null && packet.ID !== trigger.sense_id) {
        return false;
    }
    return true;
}

const tests = [
    // Backwards-compatible cases — no sense_id configured, fires on any packet
    {
        label: 'sense_id null fires on any packet (backwards compatible)',
        trigger: { port: 1, scene_id: 5, sense_id: null },
        packet:  { ID: 42 },
        expected: true,
    },
    {
        label: 'sense_id absent fires on any packet (old trigger data)',
        trigger: { port: 1, scene_id: 5 },
        packet:  { ID: 42 },
        expected: true,
    },

    // Matching sense_id — fires
    {
        label: 'matching sense_id fires',
        trigger: { port: 1, scene_id: 5, sense_id: 42 },
        packet:  { ID: 42 },
        expected: true,
    },
    {
        label: 'matching sense_id fires (ID = 1)',
        trigger: { port: 2, scene_id: 7, sense_id: 1 },
        packet:  { ID: 1 },
        expected: true,
    },

    // Non-matching sense_id — skips
    {
        label: 'non-matching sense_id skips',
        trigger: { port: 1, scene_id: 5, sense_id: 42 },
        packet:  { ID: 99 },
        expected: false,
    },
    {
        label: 'sense_id 1, packet from device 2 — skips',
        trigger: { port: 3, scene_id: 2, sense_id: 1 },
        packet:  { ID: 2 },
        expected: false,
    },
    {
        label: 'sense_id 0 is treated as configured (not null) — non-matching skips',
        trigger: { port: 1, scene_id: 5, sense_id: 0 },
        packet:  { ID: 1 },
        expected: false,
    },
];

let passed = 0;
let failed = 0;

for (const { label, trigger, packet, expected } of tests) {
    const result = shouldFireTrigger(trigger, packet);
    if (result === expected) {
        console.log(`  ✓  ${label}`);
        passed++;
    } else {
        console.error(`  ✗  ${label}`);
        console.error(`     expected ${expected}, got ${result}`);
        failed++;
    }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
