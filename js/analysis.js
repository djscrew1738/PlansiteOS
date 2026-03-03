// ══════════════════════════════════════════════════════════════
// BLUEPRINT ANALYSIS
// ══════════════════════════════════════════════════════════════

// Application state
const state = {
    currentFile: null,
    currentFileData: null, // Store file data for saving
    analysisResults: null,
    pricing: DocumentStore.getPricing()
};

// DOM elements
const elements = {
    uploadCard: $('uploadCard'),
    previewCard: $('previewCard'),
    loadingCard: $('loadingCard'),
    resultsCard: $('resultsCard'),
    dropZone: $('dropZone'),
    fileInput: $('fileInput'),
    cameraBtn: $('cameraBtn'),
    previewContainer: $('previewContainer'),
    fileName: $('fileName'),
    fileSize: $('fileSize'),
    clearBtn: $('clearBtn'),
    analyzeBtn: $('analyzeBtn'),
    totalFixtures: $('totalFixtures'),
    totalRooms: $('totalRooms'),
    totalEstimate: $('totalEstimate'),
    resultsBody: $('resultsBody'),
    grandTotal: $('grandTotal'),
    confidenceBadge: $('confidenceBadge'),
    roomBreakdown: $('roomBreakdown'),
    roomList: $('roomList'),
    saveBtn: $('saveBtn'),
    copyBtn: $('copyBtn'),
    newAnalysisBtn: $('newAnalysisBtn')
};

// ══════════════════════════════════════════════════════════════
// FILE HANDLING
// ══════════════════════════════════════════════════════════════
function handleFile(file) {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        showToast('Invalid file type. Use JPG, PNG, WebP, or PDF.', 'error');
        return;
    }

    // Validate file size (15MB max)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('File too large. Maximum 15MB.', 'error');
        return;
    }

    state.currentFile = file;

    // Convert file to base64 for storage
    const reader = new FileReader();
    reader.onload = (e) => {
        state.currentFileData = e.target.result;
    };
    reader.readAsDataURL(file);

    showPreview(file);
}

function showPreview(file) {
    elements.fileName.textContent = file.name;
    elements.fileSize.textContent = formatFileSize(file.size);

    if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        elements.previewContainer.innerHTML = `<img src="${url}" class="preview-image" alt="Blueprint preview">`;
    } else {
        elements.previewContainer.innerHTML = `
            <div class="preview-pdf">
                <span class="preview-pdf-icon">📄</span>
                <span class="preview-filename">${file.name}</span>
            </div>
        `;
    }

    showCard('previewCard');
}

function clearFile() {
    state.currentFile = null;
    state.currentFileData = null;
    elements.fileInput.value = '';
    elements.previewContainer.innerHTML = '';
    showCard('uploadCard');
}

function showCard(cardId) {
    ['uploadCard', 'previewCard', 'loadingCard', 'resultsCard'].forEach(id => {
        elements[id].classList.toggle('hidden', id !== cardId);
    });
}

// ══════════════════════════════════════════════════════════════
// ANALYSIS
// ══════════════════════════════════════════════════════════════
async function analyzeBlueprint() {
    if (!state.currentFile) return;

    showCard('loadingCard');

    try {
        const formData = new FormData();
        formData.append('blueprint', state.currentFile);

        // Try real API first
        let analysis;
        try {
            const response = await fetch('/api/blueprints/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('API error');

            const data = await response.json();
            if (data.success && data.results?.[0]?.analysis) {
                analysis = data.results[0].analysis;
            } else {
                throw new Error('Invalid response');
            }
        } catch (apiError) {
            console.log('Using mock analysis (API unavailable)');
            analysis = generateMockAnalysis();
        }

        state.analysisResults = analysis;
        displayResults(analysis);
        showToast('Analysis complete!');

    } catch (error) {
        console.error('Analysis error:', error);
        showToast('Analysis failed. Please try again.', 'error');
        showCard('previewCard');
    }
}

function generateMockAnalysis() {
    // Smart mock based on typical home layouts
    const layouts = [
        { // 3 bed 2 bath
            fixtures: { water_heater: 1, lavatory: 3, kitchen_sink: 1, washer: 1, tub: 0, shower: 1, tub_shower: 1, toilet: 2 },
            rooms: [
                { name: 'Master Bath', fixtures: ['toilet', 'lavatory', 'lavatory', 'shower'] },
                { name: 'Hall Bath', fixtures: ['toilet', 'tub_shower', 'lavatory'] },
                { name: 'Kitchen', fixtures: ['kitchen_sink'] },
                { name: 'Utility', fixtures: ['water_heater', 'washer'] }
            ]
        },
        { // 4 bed 3 bath
            fixtures: { water_heater: 1, lavatory: 4, kitchen_sink: 1, washer: 1, tub: 1, shower: 1, tub_shower: 1, toilet: 3 },
            rooms: [
                { name: 'Master Bath', fixtures: ['toilet', 'lavatory', 'lavatory', 'shower', 'tub'] },
                { name: 'Bath 2', fixtures: ['toilet', 'tub_shower', 'lavatory'] },
                { name: 'Bath 3', fixtures: ['toilet', 'lavatory'] },
                { name: 'Kitchen', fixtures: ['kitchen_sink'] },
                { name: 'Utility', fixtures: ['water_heater', 'washer'] }
            ]
        },
        { // 2 bed 1 bath
            fixtures: { water_heater: 1, lavatory: 1, kitchen_sink: 1, washer: 1, tub: 0, shower: 0, tub_shower: 1, toilet: 1 },
            rooms: [
                { name: 'Bathroom', fixtures: ['toilet', 'tub_shower', 'lavatory'] },
                { name: 'Kitchen', fixtures: ['kitchen_sink'] },
                { name: 'Utility', fixtures: ['water_heater', 'washer'] }
            ]
        }
    ];

    const layout = layouts[Math.floor(Math.random() * layouts.length)];
    const total = Object.values(layout.fixtures).reduce((a, b) => a + b, 0);

    return {
        fixtures: layout.fixtures,
        total_fixtures: total,
        rooms: layout.rooms,
        notes: 'Mock analysis - connect API for real detection',
        confidence: 'medium'
    };
}

function displayResults(analysis) {
    // Calculate totals
    let totalFixtures = 0;
    let totalPrice = 0;
    let tableHTML = '';

    for (const [key, count] of Object.entries(analysis.fixtures)) {
        if (count > 0) {
            const fixture = FIXTURES[key];
            const price = state.pricing[key] || 0;
            const lineTotal = count * price;
            totalFixtures += count;
            totalPrice += lineTotal;

            tableHTML += `
                <tr>
                    <td>
                        <div class="fixture-name">
                            <span class="fixture-icon">${fixture.icon}</span>
                            <span>${fixture.label}</span>
                        </div>
                    </td>
                    <td><span class="fixture-count">${count}</span></td>
                    <td><span class="fixture-price">${formatCurrency(price)}</span></td>
                    <td><span class="fixture-total">${formatCurrency(lineTotal)}</span></td>
                </tr>
            `;
        }
    }

    elements.resultsBody.innerHTML = tableHTML;
    elements.totalFixtures.textContent = totalFixtures;
    elements.totalRooms.textContent = analysis.rooms?.length || '-';
    elements.totalEstimate.textContent = formatCurrency(totalPrice);
    elements.grandTotal.textContent = formatCurrency(totalPrice);

    // Confidence badge
    const confidence = analysis.confidence || 'medium';
    elements.confidenceBadge.className = `confidence-badge confidence-${confidence}`;
    elements.confidenceBadge.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            ${confidence === 'high' ? '<polyline points="20 6 9 17 4 12"/>' :
              confidence === 'medium' ? '<line x1="5" y1="12" x2="19" y2="12"/>' :
              '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
        </svg>
        ${confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
    `;

    // Room breakdown
    if (analysis.rooms?.length > 0) {
        elements.roomBreakdown.classList.remove('hidden');
        elements.roomList.innerHTML = analysis.rooms.map(room => `
            <div class="room-item">
                <span class="room-name">${room.name}</span>
                <div class="room-fixtures">
                    ${room.fixtures.map(f => `<span class="room-fixture-tag">${FIXTURES[f]?.abbr || f}</span>`).join('')}
                </div>
            </div>
        `).join('');
    } else {
        elements.roomBreakdown.classList.add('hidden');
    }

    showCard('resultsCard');
}

// ══════════════════════════════════════════════════════════════
// SAVE TO DOCUMENTS
// ══════════════════════════════════════════════════════════════
function saveToDocuments() {
    if (!state.analysisResults || !state.currentFile) {
        showToast('No analysis to save', 'error');
        return;
    }

    // Calculate total price
    const totalPrice = Object.entries(state.analysisResults.fixtures).reduce((sum, [key, count]) => {
        return sum + (count * (state.pricing[key] || 0));
    }, 0);

    const document = {
        filename: state.currentFile.name,
        fileSize: state.currentFile.size,
        fileType: state.currentFile.type,
        fileData: state.currentFileData,
        analysis: state.analysisResults,
        totalFixtures: state.analysisResults.total_fixtures,
        totalPrice: totalPrice,
        pricing: { ...state.pricing }, // Save pricing snapshot
        tags: ['blueprint', 'analysis']
    };

    DocumentStore.save(document);
    showToast('Saved to documents successfully!');
}

// ══════════════════════════════════════════════════════════════
// COPY RESULTS
// ══════════════════════════════════════════════════════════════
function copyResults() {
    if (!state.analysisResults) return;

    let text = `PLANSITEOS BLUEPRINT ANALYSIS\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `File: ${state.currentFile?.name || 'Unknown'}\n`;
    text += `${'─'.repeat(50)}\n\n`;
    text += `FIXTURE COUNT:\n`;

    let total = 0;
    for (const [key, count] of Object.entries(state.analysisResults.fixtures)) {
        if (count > 0) {
            const fixture = FIXTURES[key];
            const price = state.pricing[key] || 0;
            const lineTotal = count * price;
            total += lineTotal;
            text += `${fixture.label.padEnd(20)} ${String(count).padStart(3)} x $${String(price).padStart(6)} = $${lineTotal.toLocaleString()}\n`;
        }
    }

    text += `\n${'─'.repeat(50)}\n`;
    text += `ESTIMATED TOTAL: $${total.toLocaleString()}\n`;

    if (state.analysisResults.rooms?.length > 0) {
        text += `\nROOM BREAKDOWN:\n`;
        state.analysisResults.rooms.forEach(room => {
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

// ══════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ══════════════════════════════════════════════════════════════
function initEventListeners() {
    // Drag and drop
    elements.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropZone.classList.add('dragover');
    });

    elements.dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        elements.dropZone.classList.remove('dragover');
    });

    elements.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    });

    // File input
    elements.fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    });

    // Camera button
    elements.cameraBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = (e) => handleFile(e.target.files[0]);
        input.click();
    });

    // Preview actions
    elements.clearBtn.addEventListener('click', clearFile);
    elements.analyzeBtn.addEventListener('click', analyzeBlueprint);

    // Result actions
    elements.saveBtn.addEventListener('click', saveToDocuments);
    elements.copyBtn.addEventListener('click', copyResults);
    elements.newAnalysisBtn.addEventListener('click', () => {
        state.analysisResults = null;
        clearFile();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !elements.uploadCard.classList.contains('hidden')) {
            clearFile();
        }
    });
}

// ══════════════════════════════════════════════════════════════
// INITIALIZE
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    console.log('Blueprint Analysis initialized');
});
