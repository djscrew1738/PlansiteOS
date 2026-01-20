// ══════════════════════════════════════════════════════════════
// PLUMBING SYMBOLS LIBRARY
// Professional plumbing fixture symbols and definitions
// ══════════════════════════════════════════════════════════════

const PlumbingSymbols = {
    // Bathroom Fixtures
    toilet: {
        id: 'toilet',
        name: 'Toilet (Water Closet)',
        category: 'bathroom',
        icon: '🚽',
        width: 18,
        height: 24,
        connections: [
            { type: 'waste', x: 9, y: 12 },
            { type: 'supply', x: 4, y: 20 }
        ],
        draw(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Tank
            ctx.strokeStyle = '#1e293b';
            ctx.fillStyle = '#f8fafc';
            ctx.lineWidth = 1.5;
            ctx.fillRect(2, 0, 14, 8);
            ctx.strokeRect(2, 0, 14, 8);

            // Bowl
            ctx.beginPath();
            ctx.ellipse(9, 16, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Center mark
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(9, 16, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    },

    lavatory: {
        id: 'lavatory',
        name: 'Lavatory (Sink)',
        category: 'bathroom',
        icon: '🚰',
        width: 20,
        height: 16,
        connections: [
            { type: 'waste', x: 10, y: 8 },
            { type: 'supply-hot', x: 7, y: 14 },
            { type: 'supply-cold', x: 13, y: 14 }
        ],
        draw(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Sink bowl
            ctx.strokeStyle = '#1e293b';
            ctx.fillStyle = '#f8fafc';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(10, 8, 9, 7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Drain
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(10, 8, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Faucet mark
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(10, 2);
            ctx.lineTo(10, 5);
            ctx.stroke();

            ctx.restore();
        }
    },

    bathtub: {
        id: 'bathtub',
        name: 'Bathtub',
        category: 'bathroom',
        icon: '🛁',
        width: 60,
        height: 30,
        connections: [
            { type: 'waste', x: 30, y: 15 },
            { type: 'supply-hot', x: 50, y: 10 },
            { type: 'supply-cold', x: 50, y: 20 }
        ],
        draw(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Tub outline
            ctx.strokeStyle = '#1e293b';
            ctx.fillStyle = '#f8fafc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(0, 0, 60, 30, 4);
            ctx.fill();
            ctx.stroke();

            // Drain
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(30, 15, 2, 0, Math.PI * 2);
            ctx.fill();

            // Faucet end
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(50, 15, 5, 0, Math.PI);
            ctx.stroke();

            ctx.restore();
        }
    },

    shower: {
        id: 'shower',
        name: 'Shower',
        category: 'bathroom',
        icon: '🚿',
        width: 36,
        height: 36,
        connections: [
            { type: 'waste', x: 18, y: 30 },
            { type: 'supply-hot', x: 6, y: 18 },
            { type: 'supply-cold', x: 6, y: 24 }
        ],
        draw(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Shower pan
            ctx.strokeStyle = '#1e293b';
            ctx.fillStyle = '#f1f5f9';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, 36, 36);

            // Drain
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(18, 30, 2, 0, Math.PI * 2);
            ctx.fill();

            // Shower head
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(8, 8, 4, 0, Math.PI * 2);
            ctx.stroke();

            // Water drops
            ctx.fillStyle = '#3b82f6';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(8 + (i * 3), 14 + (i * 2), 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    },

    // Kitchen Fixtures
    kitchenSink: {
        id: 'kitchenSink',
        name: 'Kitchen Sink',
        category: 'kitchen',
        icon: '🍳',
        width: 33,
        height: 22,
        connections: [
            { type: 'waste', x: 16, y: 11 },
            { type: 'supply-hot', x: 25, y: 18 },
            { type: 'supply-cold', x: 30, y: 18 }
        ],
        draw(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Double bowl
            ctx.strokeStyle = '#1e293b';
            ctx.fillStyle = '#f8fafc';
            ctx.lineWidth = 1.5;

            // Left bowl
            ctx.beginPath();
            ctx.rect(0, 0, 15, 20);
            ctx.fill();
            ctx.stroke();

            // Right bowl
            ctx.beginPath();
            ctx.rect(18, 0, 15, 20);
            ctx.fill();
            ctx.stroke();

            // Drains
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.arc(7, 10, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(26, 10, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Faucet
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(16, -2, 3, 0, Math.PI);
            ctx.stroke();

            ctx.restore();
        }
    },

    dishwasher: {
        id: 'dishwasher',
        name: 'Dishwasher',
        category: 'kitchen',
        icon: '🍽️',
        width: 24,
        height: 24,
        connections: [
            { type: 'waste', x: 12, y: 20 },
            { type: 'supply', x: 18, y: 20 }
        ],
        draw(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Appliance box
            ctx.strokeStyle = '#1e293b';
            ctx.fillStyle = '#e2e8f0';
            ctx.lineWidth = 1.5;
            ctx.fillRect(0, 0, 24, 24);
            ctx.strokeRect(0, 0, 24, 24);

            // DW label
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('DW', 12, 15);

            ctx.restore();
        }
    },

    // Utility Fixtures
    waterHeater: {
        id: 'waterHeater',
        name: 'Water Heater',
        category: 'utility',
        icon: '🔥',
        width: 24,
        height: 24,
        connections: [
            { type: 'supply-cold', x: 8, y: 0 },
            { type: 'supply-hot', x: 16, y: 0 }
        ],
        draw(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Tank
            ctx.strokeStyle = '#1e293b';
            ctx.fillStyle = '#fef3c7';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(12, 12, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // WH label
            ctx.fillStyle = '#92400e';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('WH', 12, 15);

            // Hot/Cold indicators
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(16, 4, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(8, 4, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    },

    washer: {
        id: 'washer',
        name: 'Washing Machine',
        category: 'utility',
        icon: '👕',
        width: 27,
        height: 27,
        connections: [
            { type: 'waste', x: 13, y: 24 },
            { type: 'supply-hot', x: 8, y: 0 },
            { type: 'supply-cold', x: 19, y: 0 }
        ],
        draw(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Appliance box
            ctx.strokeStyle = '#1e293b';
            ctx.fillStyle = '#e2e8f0';
            ctx.lineWidth = 1.5;
            ctx.fillRect(0, 0, 27, 27);
            ctx.strokeRect(0, 0, 27, 27);

            // Drum
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(13, 13, 8, 0, Math.PI * 2);
            ctx.stroke();

            // W label
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('W', 13, 16);

            ctx.restore();
        }
    },

    floorDrain: {
        id: 'floorDrain',
        name: 'Floor Drain',
        category: 'utility',
        icon: '⬇️',
        width: 12,
        height: 12,
        connections: [
            { type: 'waste', x: 6, y: 6 }
        ],
        draw(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Drain grate
            ctx.strokeStyle = '#1e293b';
            ctx.fillStyle = '#94a3b8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(6, 6, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Grate lines
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 0.5;
            for (let i = -2; i <= 2; i++) {
                ctx.beginPath();
                ctx.moveTo(6 + (i * 2), 2);
                ctx.lineTo(6 + (i * 2), 10);
                ctx.stroke();
            }

            ctx.restore();
        }
    },

    hosebibb: {
        id: 'hosebibb',
        name: 'Hose Bibb (Outdoor Faucet)',
        category: 'utility',
        icon: '💧',
        width: 12,
        height: 12,
        connections: [
            { type: 'supply', x: 0, y: 6 }
        ],
        draw(ctx, x, y, scale = 1) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(scale, scale);

            // Valve body
            ctx.strokeStyle = '#1e293b';
            ctx.fillStyle = '#3b82f6';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(6, 6, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Spout
            ctx.beginPath();
            ctx.moveTo(11, 6);
            ctx.lineTo(14, 6);
            ctx.stroke();

            // HB label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 6px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('HB', 6, 8);

            ctx.restore();
        }
    }
};

// Fixture categories for UI organization
const FixtureCategories = {
    all: {
        name: 'All Fixtures',
        fixtures: Object.keys(PlumbingSymbols)
    },
    bathroom: {
        name: 'Bathroom',
        fixtures: ['toilet', 'lavatory', 'bathtub', 'shower']
    },
    kitchen: {
        name: 'Kitchen',
        fixtures: ['kitchenSink', 'dishwasher']
    },
    utility: {
        name: 'Utility',
        fixtures: ['waterHeater', 'washer', 'floorDrain', 'hosebibb']
    }
};

// Templates for common room layouts
const PlumbingTemplates = {
    'full-bath': {
        name: 'Full Bathroom',
        description: '3-fixture bathroom with tub',
        width: 96,
        height: 84,
        fixtures: [
            { type: 'toilet', x: 20, y: 10 },
            { type: 'lavatory', x: 50, y: 10 },
            { type: 'bathtub', x: 18, y: 48 }
        ],
        walls: [
            { x1: 0, y1: 0, x2: 96, y2: 0 },
            { x1: 96, y1: 0, x2: 96, y2: 84 },
            { x1: 96, y1: 84, x2: 0, y2: 84 },
            { x1: 0, y1: 84, x2: 0, y2: 0 }
        ]
    },
    'half-bath': {
        name: 'Half Bathroom',
        description: '2-fixture powder room',
        width: 60,
        height: 60,
        fixtures: [
            { type: 'toilet', x: 20, y: 18 },
            { type: 'lavatory', x: 20, y: 40 }
        ],
        walls: [
            { x1: 0, y1: 0, x2: 60, y2: 0 },
            { x1: 60, y1: 0, x2: 60, y2: 60 },
            { x1: 60, y1: 60, x2: 0, y2: 60 },
            { x1: 0, y1: 60, x2: 0, y2: 0 }
        ]
    },
    'kitchen': {
        name: 'Kitchen',
        description: 'Kitchen with sink and dishwasher',
        width: 120,
        height: 60,
        fixtures: [
            { type: 'kitchenSink', x: 30, y: 20 },
            { type: 'dishwasher', x: 70, y: 20 }
        ],
        walls: [
            { x1: 0, y1: 0, x2: 120, y2: 0 },
            { x1: 120, y1: 0, x2: 120, y2: 60 },
            { x1: 120, y1: 60, x2: 0, y2: 60 },
            { x1: 0, y1: 60, x2: 0, y2: 0 }
        ]
    },
    'laundry': {
        name: 'Laundry Room',
        description: 'Utility room with washer',
        width: 72,
        height: 60,
        fixtures: [
            { type: 'washer', x: 22, y: 16 },
            { type: 'floorDrain', x: 30, y: 45 }
        ],
        walls: [
            { x1: 0, y1: 0, x2: 72, y2: 0 },
            { x1: 72, y1: 0, x2: 72, y2: 60 },
            { x1: 72, y1: 60, x2: 0, y2: 60 },
            { x1: 0, y1: 60, x2: 0, y2: 0 }
        ]
    }
};

// Pipe type definitions
const PipeTypes = {
    'supply': {
        name: 'Supply Pipe',
        color: '#3b82f6',
        width: 2,
        style: 'solid'
    },
    'supply-hot': {
        name: 'Hot Water Supply',
        color: '#ef4444',
        width: 2,
        style: 'solid'
    },
    'supply-cold': {
        name: 'Cold Water Supply',
        color: '#3b82f6',
        width: 2,
        style: 'solid'
    },
    'waste': {
        name: 'Waste/Drain Pipe',
        color: '#64748b',
        width: 3,
        style: 'solid'
    },
    'vent': {
        name: 'Vent Pipe',
        color: '#10b981',
        width: 2,
        style: 'dashed'
    }
};
