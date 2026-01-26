// ══════════════════════════════════════════════════════════════
// SHARED UTILITIES
// ══════════════════════════════════════════════════════════════

const $ = (id) => document.getElementById(id);

// ══════════════════════════════════════════════════════════════
// DOCUMENT STORAGE
// ══════════════════════════════════════════════════════════════
const DocumentStore = {
    KEY: 'plansiteos_documents',
    PRICING_KEY: 'plansiteos_pricing',

    // Get all documents
    getAll() {
        try {
            return JSON.parse(localStorage.getItem(this.KEY) || '[]');
        } catch (e) {
            console.error('Error loading documents:', e);
            return [];
        }
    },

    // Save document
    save(document) {
        const documents = this.getAll();
        document.id = document.id || Date.now();
        document.createdAt = document.createdAt || new Date().toISOString();
        document.updatedAt = new Date().toISOString();

        // Check if updating existing
        const existingIndex = documents.findIndex(d => d.id === document.id);
        if (existingIndex >= 0) {
            documents[existingIndex] = document;
        } else {
            documents.unshift(document);
        }

        // Limit to 100 documents
        if (documents.length > 100) {
            documents.splice(100);
        }

        localStorage.setItem(this.KEY, JSON.stringify(documents));
        return document;
    },

    // Get document by ID
    getById(id) {
        return this.getAll().find(d => d.id === id);
    },

    // Delete document
    delete(id) {
        const documents = this.getAll().filter(d => d.id !== id);
        localStorage.setItem(this.KEY, JSON.stringify(documents));
    },

    // Get pricing
    getPricing() {
        const defaults = {
            water_heater: 450,
            lavatory: 185,
            kitchen_sink: 225,
            washer: 150,
            tub: 275,
            shower: 300,
            tub_shower: 325,
            toilet: 195
        };

        try {
            const stored = localStorage.getItem(this.PRICING_KEY);
            return stored ? JSON.parse(stored) : defaults;
        } catch (e) {
            return defaults;
        }
    },

    // Save pricing
    savePricing(pricing) {
        localStorage.setItem(this.PRICING_KEY, JSON.stringify(pricing));
    }
};

// ══════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
function showToast(message, type = 'success') {
    const container = $('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✓' : '✕'}</span>
        <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatCurrency(amount) {
    return '$' + amount.toLocaleString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

// ══════════════════════════════════════════════════════════════
// FIXTURE METADATA
// ══════════════════════════════════════════════════════════════
const FIXTURES = {
    water_heater: { label: 'Water Heater', icon: '🔥', abbr: 'W/H' },
    lavatory: { label: 'Lavatory', icon: '🚰', abbr: 'LAV' },
    kitchen_sink: { label: 'Kitchen Sink', icon: '🍳', abbr: 'K/S' },
    washer: { label: 'Washer Box', icon: '👕', abbr: 'W/M' },
    tub: { label: 'Bathtub', icon: '🛁', abbr: 'TUB' },
    shower: { label: 'Shower', icon: '🚿', abbr: 'SHW' },
    tub_shower: { label: 'Tub/Shower', icon: '🛁', abbr: 'T/S' },
    toilet: { label: 'Toilet', icon: '🚽', abbr: 'WC' }
};

// Service Worker Registration (PWA)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW not available, continue without
    });
}
