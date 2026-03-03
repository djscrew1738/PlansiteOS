// ══════════════════════════════════════════════════════════════
// PLUMBING PLAN GENERATOR - MAIN UI CONTROLLER
// ══════════════════════════════════════════════════════════════

let engine;
let currentPlan = {
    id: null,
    title: 'Untitled Plumbing Plan',
    data: null
};

// ══════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Initialize canvas engine
    const canvas = $('mainCanvas');
    engine = new PlumbingPlanEngine(canvas);

    // Setup callbacks
    engine.onZoomChange = updateZoomDisplay;
    engine.onCursorMove = updateCursorDisplay;
    engine.onSelectionChange = updatePropertiesPanel;

    // Initialize UI
    initializeTools();
    initializeFixtureLibrary();
    initializeLayers();
    initializeEventListeners();

    // Handle window resize
    window.addEventListener('resize', () => engine.resize());

    // Initial state save
    engine.saveState();

    console.log('Plumbing Plan Generator initialized');
});

// ══════════════════════════════════════════════════════════════
// TOOLS
// ══════════════════════════════════════════════════════════════
function initializeTools() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            selectTool(tool);
        });
    });
}

function selectTool(tool) {
    // Update UI
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    // Update canvas wrapper class for cursor
    const wrapper = $('canvasWrapper');
    wrapper.className = 'canvas-wrapper';
    wrapper.classList.add(`tool-${tool}`);

    // Set tool in engine
    engine.setTool(tool);
}

// ══════════════════════════════════════════════════════════════
// FIXTURE LIBRARY
// ══════════════════════════════════════════════════════════════
function initializeFixtureLibrary() {
    renderFixtureLibrary('all');

    // Category filtering
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            document.querySelectorAll('.category-btn').forEach(b => {
                b.classList.toggle('active', b === btn);
            });
            renderFixtureLibrary(category);
        });
    });

    // Search
    const searchInput = $('fixtureSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            filterFixtures(query);
        });
    }
}

function renderFixtureLibrary(category) {
    const list = $('fixtureList');
    if (!list) return;

    const fixtures = category === 'all'
        ? Object.values(PlumbingSymbols)
        : Object.values(PlumbingSymbols).filter(f => f.category === category);

    list.innerHTML = fixtures.map(fixture => `
        <div class="fixture-item" draggable="true" data-fixture="${fixture.id}">
            <div class="fixture-icon">${fixture.icon}</div>
            <div class="fixture-info">
                <div class="fixture-name">${fixture.name}</div>
            </div>
        </div>
    `).join('');

    // Add drag handlers
    list.querySelectorAll('.fixture-item').forEach(item => {
        item.addEventListener('dragstart', handleFixtureDragStart);
        item.addEventListener('click', () => {
            const fixtureId = item.dataset.fixture;
            placeFixture(fixtureId);
        });
    });
}

function filterFixtures(query) {
    document.querySelectorAll('.fixture-item').forEach(item => {
        const name = item.querySelector('.fixture-name').textContent.toLowerCase();
        item.style.display = name.includes(query) ? 'flex' : 'none';
    });
}

function handleFixtureDragStart(e) {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('fixtureId', e.currentTarget.dataset.fixture);
}

function placeFixture(fixtureId) {
    const fixture = PlumbingSymbols[fixtureId];
    if (!fixture) return;

    // Add to center of viewport
    const centerX = (engine.canvas.width / 2 - engine.viewport.x) / engine.viewport.zoom;
    const centerY = (engine.canvas.height / 2 - engine.viewport.y) / engine.viewport.zoom;

    const obj = {
        type: 'fixture',
        layer: 'fixtures',
        fixtureType: fixtureId,
        x: centerX,
        y: centerY,
        scale: 1
    };

    engine.addObject(obj);
    showToast(`${fixture.name} added`);
}

// Enable canvas drop
document.addEventListener('DOMContentLoaded', () => {
    const wrapper = $('canvasWrapper');
    if (wrapper) {
        wrapper.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        wrapper.addEventListener('drop', (e) => {
            e.preventDefault();
            const fixtureId = e.dataTransfer.getData('fixtureId');
            if (fixtureId) {
                const rect = wrapper.getBoundingClientRect();
                const screenX = e.clientX - rect.left;
                const screenY = e.clientY - rect.top;
                const world = engine.screenToWorld(screenX, screenY);

                const obj = {
                    type: 'fixture',
                    layer: 'fixtures',
                    fixtureType: fixtureId,
                    x: world.x,
                    y: world.y,
                    scale: 1
                };

                engine.addObject(obj);
            }
        });
    }
});

// ══════════════════════════════════════════════════════════════
// PROPERTIES EDITOR
// ══════════════════════════════════════════════════════════════
function updatePropertiesPanel() {
    const panel = $('propertiesPanel');
    if (!panel) return;

    if (engine.selectedObjects.length === 0) {
        panel.innerHTML = '<div class="empty-state-sm"><p>Select an object to view properties</p></div>';
        return;
    }

    if (engine.selectedObjects.length > 1) {
        panel.innerHTML = `
            <div class="property-group">
                <div class="property-label">Multiple Selection</div>
                <div class="property-value">${engine.selectedObjects.length} objects selected</div>
            </div>
        `;
        return;
    }

    const obj = engine.selectedObjects[0];
    let html = '';

    // Object type
    html += `
        <div class="property-group">
            <div class="property-label">Type</div>
            <div class="property-value">${obj.type}</div>
        </div>
    `;

    // Type-specific properties
    if (obj.type === 'fixture') {
        const symbol = PlumbingSymbols[obj.fixtureType];
        html += `
            <div class="property-group">
                <div class="property-label">Fixture</div>
                <div class="property-value">${symbol?.name || obj.fixtureType}</div>
            </div>
            <div class="property-group">
                <div class="property-label">Position X</div>
                <input type="number" class="property-input" data-prop="x" value="${Math.round(obj.x)}" step="1" />
            </div>
            <div class="property-group">
                <div class="property-label">Position Y</div>
                <input type="number" class="property-input" data-prop="y" value="${Math.round(obj.y)}" step="1" />
            </div>
            <div class="property-group">
                <div class="property-label">Scale</div>
                <input type="number" class="property-input" data-prop="scale" value="${obj.scale || 1}" step="0.1" min="0.1" max="5" />
            </div>
            <div class="property-group">
                <div class="property-label">Rotation</div>
                <input type="number" class="property-input" data-prop="rotation" value="${obj.rotation || 0}" step="15" />
            </div>
            <div class="property-group">
                <div class="property-label">Label</div>
                <input type="text" class="property-input" data-prop="label" value="${obj.label || ''}" placeholder="Optional label" />
            </div>
        `;
    } else if (obj.type === 'wall') {
        html += `
            <div class="property-group">
                <div class="property-label">Start X</div>
                <input type="number" class="property-input" data-prop="x1" value="${Math.round(obj.x1)}" step="1" />
            </div>
            <div class="property-group">
                <div class="property-label">Start Y</div>
                <input type="number" class="property-input" data-prop="y1" value="${Math.round(obj.y1)}" step="1" />
            </div>
            <div class="property-group">
                <div class="property-label">End X</div>
                <input type="number" class="property-input" data-prop="x2" value="${Math.round(obj.x2)}" step="1" />
            </div>
            <div class="property-group">
                <div class="property-label">End Y</div>
                <input type="number" class="property-input" data-prop="y2" value="${Math.round(obj.y2)}" step="1" />
            </div>
            <div class="property-group">
                <div class="property-label">Width</div>
                <input type="number" class="property-input" data-prop="width" value="${obj.width || 4}" step="1" min="1" max="12" />
            </div>
        `;
    } else if (obj.type === 'pipe') {
        const pipeType = PipeTypes[obj.pipeType];
        html += `
            <div class="property-group">
                <div class="property-label">Pipe Type</div>
                <div class="property-value">${pipeType?.name || obj.pipeType}</div>
            </div>
            <div class="property-group">
                <div class="property-label">Start X</div>
                <input type="number" class="property-input" data-prop="x1" value="${Math.round(obj.x1)}" step="1" />
            </div>
            <div class="property-group">
                <div class="property-label">Start Y</div>
                <input type="number" class="property-input" data-prop="y1" value="${Math.round(obj.y1)}" step="1" />
            </div>
            <div class="property-group">
                <div class="property-label">End X</div>
                <input type="number" class="property-input" data-prop="x2" value="${Math.round(obj.x2)}" step="1" />
            </div>
            <div class="property-group">
                <div class="property-label">End Y</div>
                <input type="number" class="property-input" data-prop="y2" value="${Math.round(obj.y2)}" step="1" />
            </div>
        `;
    }

    panel.innerHTML = html;

    // Add event listeners to all property inputs
    panel.querySelectorAll('.property-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const prop = e.target.dataset.prop;
            let value = e.target.value;

            // Parse numbers
            if (e.target.type === 'number') {
                value = parseFloat(value);
            }

            // Update object property
            obj[prop] = value;
            engine.render();
        });

        input.addEventListener('change', () => {
            engine.saveState();
        });
    });
}

// ══════════════════════════════════════════════════════════════
// LAYERS
// ══════════════════════════════════════════════════════════════
function initializeLayers() {
    renderLayers();
}

function renderLayers() {
    const list = $('layerList');
    if (!list) return;

    list.innerHTML = engine.layers.map(layer => `
        <div class="layer-item ${layer.id === engine.activeLayer ? 'active' : ''}" data-layer="${layer.id}">
            <div class="layer-visibility" data-action="toggle-visibility">
                ${layer.visible
                    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
                    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
                }
            </div>
            <div class="layer-color" style="background-color: ${layer.color}"></div>
            <div class="layer-name">${layer.name}</div>
            <div class="layer-count">${layer.objects.length}</div>
        </div>
    `).join('');

    // Add click handlers
    list.querySelectorAll('.layer-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="toggle-visibility"]')) {
                toggleLayerVisibility(item.dataset.layer);
            } else {
                setActiveLayer(item.dataset.layer);
            }
        });
    });
}

function setActiveLayer(layerId) {
    engine.activeLayer = layerId;
    renderLayers();
}

function toggleLayerVisibility(layerId) {
    const layer = engine.layers.find(l => l.id === layerId);
    if (layer) {
        layer.visible = !layer.visible;
        engine.render();
        renderLayers();
    }
}

// ══════════════════════════════════════════════════════════════
// TEMPLATES
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.template-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const templateId = btn.dataset.template;
            loadTemplate(templateId);
        });
    });
});

function loadTemplate(templateId) {
    const template = PlumbingTemplates[templateId];
    if (!template) return;

    if (engine.objects.length > 0) {
        if (!confirm('This will replace the current plan. Continue?')) {
            return;
        }
    }

    engine.clear();

    // Add walls
    if (template.walls) {
        template.walls.forEach(wall => {
            engine.addObject({
                type: 'wall',
                layer: 'walls',
                ...wall
            });
        });
    }

    // Add fixtures
    if (template.fixtures) {
        template.fixtures.forEach(fixture => {
            engine.addObject({
                type: 'fixture',
                layer: 'fixtures',
                fixtureType: fixture.type,
                x: fixture.x,
                y: fixture.y,
                scale: 1
            });
        });
    }

    engine.zoomToFit();
    showToast(`${template.name} template loaded`);
}

// ══════════════════════════════════════════════════════════════
// TOOLBAR ACTIONS
// ══════════════════════════════════════════════════════════════
function initializeEventListeners() {
    // Undo/Redo
    $('undoBtn')?.addEventListener('click', () => {
        if (engine.undo()) {
            showToast('Undo');
        }
    });

    $('redoBtn')?.addEventListener('click', () => {
        if (engine.redo()) {
            showToast('Redo');
        }
    });

    // Delete
    $('deleteBtn')?.addEventListener('click', () => {
        engine.deleteSelected();
    });

    // Duplicate
    $('duplicateBtn')?.addEventListener('click', () => {
        engine.duplicateSelected();
    });

    // Zoom controls
    $('zoomInBtn')?.addEventListener('click', () => engine.zoom(1.2));
    $('zoomOutBtn')?.addEventListener('click', () => engine.zoom(0.8));
    $('zoomFitBtn')?.addEventListener('click', () => engine.zoomToFit());

    // Grid toggle
    $('gridToggle')?.addEventListener('change', (e) => {
        engine.grid.enabled = e.target.checked;
        engine.render();
    });

    // Snap toggle
    $('snapToggle')?.addEventListener('change', (e) => {
        engine.grid.snap = e.target.checked;
    });

    // Object snap toggle
    $('objectSnapToggle')?.addEventListener('change', (e) => {
        engine.objectSnap = e.target.checked;
    });

    // Settings
    $('scaleSelect')?.addEventListener('change', (e) => {
        currentPlan.scale = parseFloat(e.target.value);
    });

    $('gridSize')?.addEventListener('input', (e) => {
        engine.grid.size = parseInt(e.target.value);
        engine.render();
    });

    // Plan management
    $('newPlanBtn')?.addEventListener('click', newPlan);
    $('savePlanBtn')?.addEventListener('click', savePlan);
    $('exportBtn')?.addEventListener('click', () => openExportModal());

    // Plan title
    $('planTitle')?.addEventListener('input', (e) => {
        currentPlan.title = e.target.value;
        updatePlanStatus('unsaved');
    });

    // Export modal
    $('closeExportModal')?.addEventListener('click', closeExportModal);
    $('cancelExportBtn')?.addEventListener('click', closeExportModal);
    $('confirmExportBtn')?.addEventListener('click', handleExport);

    // Background image controls
    $('uploadBackgroundBtn')?.addEventListener('click', () => {
        $('backgroundImageInput')?.click();
    });

    $('backgroundImageInput')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await engine.loadBackgroundImage(file);
            $('backgroundImageControls')?.classList.remove('hidden');
            showToast('Background image loaded');
        }
    });

    $('backgroundOpacity')?.addEventListener('input', (e) => {
        engine.backgroundOpacity = parseInt(e.target.value) / 100;
        engine.render();
    });

    $('lockBackground')?.addEventListener('change', (e) => {
        engine.backgroundLocked = e.target.checked;
    });

    $('removeBackgroundBtn')?.addEventListener('click', () => {
        engine.backgroundImage = null;
        $('backgroundImageControls')?.classList.add('hidden');
        $('backgroundImageInput').value = '';
        engine.render();
        showToast('Background image removed');
    });

    // Rotation controls
    $('rotateLeftBtn')?.addEventListener('click', () => {
        engine.rotateSelected(-90);
        showToast('Rotated 90° left');
    });

    $('rotateRightBtn')?.addEventListener('click', () => {
        engine.rotateSelected(90);
        showToast('Rotated 90° right');
    });

    // Alignment controls
    $('alignLeftBtn')?.addEventListener('click', () => {
        engine.alignSelected('left');
        showToast('Aligned left');
    });

    $('alignCenterBtn')?.addEventListener('click', () => {
        engine.alignSelected('center');
        showToast('Aligned center');
    });

    $('alignRightBtn')?.addEventListener('click', () => {
        engine.alignSelected('right');
        showToast('Aligned right');
    });

    $('alignTopBtn')?.addEventListener('click', () => {
        engine.alignSelected('top');
        showToast('Aligned top');
    });

    $('alignMiddleBtn')?.addEventListener('click', () => {
        engine.alignSelected('middle');
        showToast('Aligned middle');
    });

    $('alignBottomBtn')?.addEventListener('click', () => {
        engine.alignSelected('bottom');
        showToast('Aligned bottom');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Skip if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key.toLowerCase()) {
            case 'q':
                engine.rotateSelected(-90);
                break;
            case 'e':
                engine.rotateSelected(90);
                break;
            case 'delete':
            case 'backspace':
                e.preventDefault();
                engine.deleteSelected();
                break;
        }
    });
}

function updateZoomDisplay(zoom) {
    const zoomLevel = $('zoomLevel');
    if (zoomLevel) {
        zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
    }
}

function updateCursorDisplay(x, y) {
    const cursorPos = $('cursorPosition');
    if (cursorPos) {
        const feet = Math.floor(Math.abs(x) / 12);
        const inches = Math.round(Math.abs(x) % 12);
        const feetY = Math.floor(Math.abs(y) / 12);
        const inchesY = Math.round(Math.abs(y) % 12);

        cursorPos.textContent = `X: ${feet}'-${inches}" | Y: ${feetY}'-${inchesY}"`;
    }
}

// ══════════════════════════════════════════════════════════════
// PLAN MANAGEMENT
// ══════════════════════════════════════════════════════════════
function newPlan() {
    if (engine.objects.length > 0) {
        if (!confirm('Start a new plan? Unsaved changes will be lost.')) {
            return;
        }
    }

    engine.clear();
    currentPlan = {
        id: null,
        title: 'Untitled Plumbing Plan',
        data: null
    };

    $('planTitle').value = currentPlan.title;
    updatePlanStatus('saved');
    showToast('New plan created');
}

function savePlan() {
    const planData = {
        id: currentPlan.id || Date.now(),
        title: currentPlan.title,
        createdAt: currentPlan.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: engine.exportData(),
        thumbnail: generateThumbnail()
    };

    currentPlan.id = planData.id;
    currentPlan.createdAt = planData.createdAt;

    // Save to document store
    DocumentStore.save({
        ...planData,
        type: 'plumbing-plan',
        tags: ['plumbing-plan', 'design']
    });

    updatePlanStatus('saved');
    showToast('Plan saved successfully');
}

function updatePlanStatus(status) {
    const statusEl = $('planStatus');
    if (statusEl) {
        statusEl.textContent = status === 'saved' ? 'Saved' : 'Unsaved';
        statusEl.className = `plan-status ${status}`;
    }
}

function generateThumbnail() {
    // Generate a data URL thumbnail of current canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 300;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw scaled version of main canvas
    tempCtx.fillStyle = '#0c1929';
    tempCtx.fillRect(0, 0, 400, 300);
    tempCtx.drawImage(engine.canvas, 0, 0, 400, 300);

    return tempCanvas.toDataURL('image/png');
}

// ══════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════
function openExportModal() {
    $('exportModal')?.classList.add('active');
}

function closeExportModal() {
    $('exportModal')?.classList.remove('active');
}

async function handleExport() {
    const format = document.querySelector('input[name="exportFormat"]:checked')?.value;

    if (!format) return;

    closeExportModal();

    try {
        switch (format) {
            case 'pdf':
                await exportPDF();
                break;
            case 'png':
                await exportPNG();
                break;
            case 'json':
                savePlan();
                break;
        }
    } catch (error) {
        console.error('Export error:', error);
        showToast('Export failed', 'error');
    }
}

async function exportPDF() {
    showToast('Generating PDF...');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'in',
        format: 'letter'
    });

    // Add title
    pdf.setFontSize(20);
    pdf.text(currentPlan.title, 0.5, 0.5);

    // Add timestamp
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 0.5, 0.8);

    // Add canvas as image
    const canvasData = engine.canvas.toDataURL('image/png');
    pdf.addImage(canvasData, 'PNG', 0.5, 1.2, 10, 7.5);

    // Add footer
    pdf.setFontSize(8);
    pdf.text('CTL Plumbing LLC • Johnson County, TX', 0.5, 7.9);
    pdf.text('Powered by PlansiteOS', 0.5, 8.1);

    // Download
    pdf.save(`${currentPlan.title}.pdf`);
    showToast('PDF exported successfully');
}

async function exportPNG() {
    const link = document.createElement('a');
    link.download = `${currentPlan.title}.png`;
    link.href = engine.canvas.toDataURL('image/png');
    link.click();
    showToast('PNG exported successfully');
}

console.log('Plumbing Plan Generator UI loaded');
