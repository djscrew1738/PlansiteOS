// ══════════════════════════════════════════════════════════════
// DOCUMENT MANAGEMENT
// ══════════════════════════════════════════════════════════════

// Application state
const state = {
    documents: [],
    filteredDocuments: [],
    currentDocument: null,
    searchQuery: '',
    sortBy: 'newest',
    filterBy: 'all'
};

// DOM elements
const elements = {
    documentGrid: $('documentGrid'),
    emptyState: $('emptyState'),
    searchInput: $('searchInput'),
    sortSelect: $('sortSelect'),
    filterSelect: $('filterSelect'),
    clearAllBtn: $('clearAllBtn'),
    totalDocs: $('totalDocs'),
    totalFixtures: $('totalFixtures'),
    totalValue: $('totalValue'),
    documentModal: $('documentModal'),
    modalTitle: $('modalTitle'),
    modalContent: $('modalContent'),
    closeModalBtn: $('closeModalBtn'),
    deleteDocBtn: $('deleteDocBtn'),
    copyDocBtn: $('copyDocBtn')
};

// ══════════════════════════════════════════════════════════════
// DOCUMENT LOADING & RENDERING
// ══════════════════════════════════════════════════════════════
function loadDocuments() {
    state.documents = DocumentStore.getAll();
    applyFiltersAndSort();
    updateStats();
    renderDocuments();
}

function applyFiltersAndSort() {
    let filtered = [...state.documents];

    // Apply search
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filtered = filtered.filter(doc =>
            doc.filename.toLowerCase().includes(query) ||
            doc.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    }

    // Apply filter
    if (state.filterBy !== 'all') {
        filtered = filtered.filter(doc =>
            doc.tags?.includes(state.filterBy)
        );
    }

    // Apply sort
    filtered.sort((a, b) => {
        switch (state.sortBy) {
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'name':
                return a.filename.localeCompare(b.filename);
            case 'price-high':
                return (b.totalPrice || 0) - (a.totalPrice || 0);
            case 'price-low':
                return (a.totalPrice || 0) - (b.totalPrice || 0);
            default:
                return 0;
        }
    });

    state.filteredDocuments = filtered;
}

function renderDocuments() {
    if (state.filteredDocuments.length === 0) {
        elements.documentGrid.innerHTML = '';
        elements.emptyState.classList.remove('hidden');
        return;
    }

    elements.emptyState.classList.add('hidden');

    elements.documentGrid.innerHTML = state.filteredDocuments.map(doc => `
        <div class="document-card" data-id="${doc.id}">
            <div class="document-preview">
                ${doc.fileData && doc.fileType?.startsWith('image/')
                    ? `<img src="${doc.fileData}" alt="${doc.filename}" />`
                    : `<div class="document-preview-placeholder">📄</div>`
                }
            </div>
            <div class="document-content">
                <div class="document-header">
                    <div class="document-title">${escapeHtml(doc.filename)}</div>
                    <div class="document-meta">
                        <span>${formatDate(doc.createdAt)}</span>
                        <span>${formatFileSize(doc.fileSize || 0)}</span>
                    </div>
                </div>
                <div class="document-stats-row">
                    <div class="document-stat">
                        <div class="document-stat-label">Fixtures</div>
                        <div class="document-stat-value">${doc.totalFixtures || 0}</div>
                    </div>
                    <div class="document-stat">
                        <div class="document-stat-label">Estimate</div>
                        <div class="document-stat-value highlight">${formatCurrency(doc.totalPrice || 0)}</div>
                    </div>
                </div>
                ${doc.tags ? `
                    <div class="document-tags">
                        ${doc.tags.map(tag => `<span class="document-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.document-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            openDocumentModal(id);
        });
    });
}

function updateStats() {
    const totalDocs = state.documents.length;
    const totalFixtures = state.documents.reduce((sum, doc) => sum + (doc.totalFixtures || 0), 0);
    const totalValue = state.documents.reduce((sum, doc) => sum + (doc.totalPrice || 0), 0);

    elements.totalDocs.textContent = totalDocs;
    elements.totalFixtures.textContent = totalFixtures;
    elements.totalValue.textContent = formatCurrency(totalValue);
}

// ══════════════════════════════════════════════════════════════
// DOCUMENT MODAL
// ══════════════════════════════════════════════════════════════
function openDocumentModal(id) {
    const doc = DocumentStore.getById(id);
    if (!doc) return;

    state.currentDocument = doc;
    elements.modalTitle.textContent = doc.filename;

    // Render modal content
    elements.modalContent.innerHTML = `
        <div class="document-detail-grid">
            <div class="document-detail-preview">
                ${doc.fileData && doc.fileType?.startsWith('image/')
                    ? `<img src="${doc.fileData}" alt="${doc.filename}" />`
                    : `<div class="document-preview-placeholder" style="font-size: 96px;">📄</div>`
                }
            </div>

            <div class="detail-section">
                <div class="detail-section-title">Document Info</div>
                <table class="detail-table">
                    <tr>
                        <td>Filename</td>
                        <td>${escapeHtml(doc.filename)}</td>
                    </tr>
                    <tr>
                        <td>File Size</td>
                        <td>${formatFileSize(doc.fileSize || 0)}</td>
                    </tr>
                    <tr>
                        <td>Created</td>
                        <td>${formatDate(doc.createdAt)}</td>
                    </tr>
                    <tr>
                        <td>Last Updated</td>
                        <td>${formatDate(doc.updatedAt)}</td>
                    </tr>
                    <tr>
                        <td>Total Fixtures</td>
                        <td>${doc.totalFixtures || 0}</td>
                    </tr>
                </table>
            </div>

            ${doc.analysis ? `
                <div class="detail-section" style="grid-column: 1 / -1;">
                    <div class="detail-section-title">Fixture Breakdown</div>
                    <table class="detail-table">
                        <tbody>
                            ${renderFixtureBreakdown(doc.analysis, doc.pricing)}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td><strong>Total Estimate</strong></td>
                                <td>${formatCurrency(doc.totalPrice || 0)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ` : ''}

            ${doc.analysis?.rooms?.length > 0 ? `
                <div class="detail-section" style="grid-column: 1 / -1;">
                    <div class="detail-section-title">Room Breakdown</div>
                    <div class="room-list">
                        ${doc.analysis.rooms.map(room => `
                            <div class="room-item">
                                <span class="room-name">${room.name}</span>
                                <div class="room-fixtures">
                                    ${room.fixtures.map(f => `
                                        <span class="room-fixture-tag">${FIXTURES[f]?.abbr || f}</span>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    elements.documentModal.classList.add('active');
}

function renderFixtureBreakdown(analysis, pricing) {
    if (!analysis?.fixtures) return '';

    return Object.entries(analysis.fixtures)
        .filter(([_, count]) => count > 0)
        .map(([key, count]) => {
            const fixture = FIXTURES[key];
            const price = pricing?.[key] || 0;
            const total = count * price;
            return `
                <tr>
                    <td>
                        <span class="fixture-icon">${fixture.icon}</span>
                        ${fixture.label}
                    </td>
                    <td>${count} × ${formatCurrency(price)} = ${formatCurrency(total)}</td>
                </tr>
            `;
        }).join('');
}

function closeModal() {
    elements.documentModal.classList.remove('active');
    state.currentDocument = null;
}

// ══════════════════════════════════════════════════════════════
// DOCUMENT ACTIONS
// ══════════════════════════════════════════════════════════════
function deleteCurrentDocument() {
    if (!state.currentDocument) return;

    if (confirm(`Delete "${state.currentDocument.filename}"?`)) {
        DocumentStore.delete(state.currentDocument.id);
        showToast('Document deleted');
        closeModal();
        loadDocuments();
    }
}

function copyCurrentDocument() {
    if (!state.currentDocument) return;

    const doc = state.currentDocument;

    let text = `PLANSITEOS DOCUMENT EXPORT\n`;
    text += `${'═'.repeat(50)}\n\n`;
    text += `File: ${doc.filename}\n`;
    text += `Created: ${new Date(doc.createdAt).toLocaleString()}\n`;
    text += `Total Fixtures: ${doc.totalFixtures || 0}\n`;
    text += `${'─'.repeat(50)}\n\n`;

    if (doc.analysis?.fixtures) {
        text += `FIXTURE BREAKDOWN:\n`;
        for (const [key, count] of Object.entries(doc.analysis.fixtures)) {
            if (count > 0) {
                const fixture = FIXTURES[key];
                const price = doc.pricing?.[key] || 0;
                const total = count * price;
                text += `${fixture.label.padEnd(20)} ${String(count).padStart(3)} × $${String(price).padStart(6)} = $${total.toLocaleString()}\n`;
            }
        }
        text += `\n${'─'.repeat(50)}\n`;
        text += `ESTIMATED TOTAL: $${(doc.totalPrice || 0).toLocaleString()}\n`;
    }

    if (doc.analysis?.rooms?.length > 0) {
        text += `\nROOM BREAKDOWN:\n`;
        doc.analysis.rooms.forEach(room => {
            text += `  ${room.name}: ${room.fixtures.map(f => FIXTURES[f]?.abbr || f).join(', ')}\n`;
        });
    }

    text += `\nCTL Plumbing LLC · Johnson County, TX`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

function clearAllDocuments() {
    if (state.documents.length === 0) return;

    if (confirm(`Delete all ${state.documents.length} documents? This cannot be undone.`)) {
        state.documents.forEach(doc => DocumentStore.delete(doc.id));
        showToast('All documents deleted');
        loadDocuments();
    }
}

// ══════════════════════════════════════════════════════════════
// SEARCH & FILTER
// ══════════════════════════════════════════════════════════════
function handleSearch(e) {
    state.searchQuery = e.target.value;
    applyFiltersAndSort();
    renderDocuments();
}

function handleSortChange(e) {
    state.sortBy = e.target.value;
    applyFiltersAndSort();
    renderDocuments();
}

function handleFilterChange(e) {
    state.filterBy = e.target.value;
    applyFiltersAndSort();
    renderDocuments();
}

// ══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ══════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ══════════════════════════════════════════════════════════════
function initEventListeners() {
    // Search and filters
    elements.searchInput.addEventListener('input', handleSearch);
    elements.sortSelect.addEventListener('change', handleSortChange);
    elements.filterSelect.addEventListener('change', handleFilterChange);
    elements.clearAllBtn.addEventListener('click', clearAllDocuments);

    // Modal
    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.deleteDocBtn.addEventListener('click', deleteCurrentDocument);
    elements.copyDocBtn.addEventListener('click', copyCurrentDocument);

    // Close modal on overlay click
    elements.documentModal.addEventListener('click', (e) => {
        if (e.target === elements.documentModal) closeModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// ══════════════════════════════════════════════════════════════
// INITIALIZE
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadDocuments();
    console.log('Document Management initialized');
});
