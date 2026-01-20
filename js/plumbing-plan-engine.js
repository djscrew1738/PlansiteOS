// ══════════════════════════════════════════════════════════════
// PLUMBING PLAN DRAWING ENGINE
// Core drawing and interaction engine
// ══════════════════════════════════════════════════════════════

class PlumbingPlanEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Viewport
        this.viewport = {
            x: 0,
            y: 0,
            zoom: 1,
            minZoom: 0.1,
            maxZoom: 5
        };

        // Drawing state
        this.objects = [];
        this.selectedObjects = [];
        this.layers = this.initializeLayers();
        this.activeLayer = 'fixtures';
        this.currentTool = 'select';

        // Grid settings
        this.grid = {
            enabled: true,
            size: 12,
            snap: true
        };

        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;

        // Drawing state
        this.isDrawing = false;
        this.isPanning = false;
        this.drawStart = null;
        this.panStart = null;
        this.tempObject = null;

        // Initialize
        this.resize();
        this.setupEventListeners();
        this.render();
    }

    // ══════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ══════════════════════════════════════════════════════════════
    initializeLayers() {
        return [
            { id: 'walls', name: 'Walls', visible: true, locked: false, color: '#1e293b', objects: [] },
            { id: 'fixtures', name: 'Fixtures', visible: true, locked: false, color: '#3b82f6', objects: [] },
            { id: 'supply', name: 'Supply Pipes', visible: true, locked: false, color: '#3b82f6', objects: [] },
            { id: 'waste', name: 'Waste Pipes', visible: true, locked: false, color: '#64748b', objects: [] },
            { id: 'vent', name: 'Vent Pipes', visible: true, locked: false, color: '#10b981', objects: [] },
            { id: 'dimensions', name: 'Dimensions', visible: true, locked: false, color: '#f59e0b', objects: [] },
            { id: 'annotations', name: 'Annotations', visible: true, locked: false, color: '#475569', objects: [] }
        ];
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    resize() {
        const wrapper = this.canvas.parentElement;
        this.canvas.width = wrapper.clientWidth;
        this.canvas.height = wrapper.clientHeight;
        this.render();
    }

    // ══════════════════════════════════════════════════════════════
    // COORDINATE TRANSFORMATION
    // ══════════════════════════════════════════════════════════════
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.viewport.x) / this.viewport.zoom,
            y: (screenY - this.viewport.y) / this.viewport.zoom
        };
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.viewport.zoom + this.viewport.x,
            y: worldY * this.viewport.zoom + this.viewport.y
        };
    }

    snapToGrid(x, y) {
        if (!this.grid.snap) return { x, y };

        const gridSize = this.grid.size;
        return {
            x: Math.round(x / gridSize) * gridSize,
            y: Math.round(y / gridSize) * gridSize
        };
    }

    // ══════════════════════════════════════════════════════════════
    // RENDERING
    // ══════════════════════════════════════════════════════════════
    render() {
        const ctx = this.ctx;
        const { width, height } = this.canvas;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Save context
        ctx.save();

        // Apply viewport transform
        ctx.translate(this.viewport.x, this.viewport.y);
        ctx.scale(this.viewport.zoom, this.viewport.zoom);

        // Draw grid
        if (this.grid.enabled) {
            this.drawGrid();
        }

        // Draw all layers in order
        for (const layer of this.layers) {
            if (layer.visible) {
                this.drawLayer(layer);
            }
        }

        // Draw temp object being created
        if (this.tempObject) {
            this.drawObject(this.tempObject);
        }

        // Draw selection handles
        this.drawSelectionHandles();

        // Restore context
        ctx.restore();
    }

    drawGrid() {
        const ctx = this.ctx;
        const gridSize = this.grid.size;
        const { width, height } = this.canvas;

        // Calculate visible grid bounds
        const startX = Math.floor(-this.viewport.x / this.viewport.zoom / gridSize) * gridSize;
        const startY = Math.floor(-this.viewport.y / this.viewport.zoom / gridSize) * gridSize;
        const endX = startX + (width / this.viewport.zoom) + gridSize;
        const endY = startY + (height / this.viewport.zoom) + gridSize;

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 0.5 / this.viewport.zoom;

        // Draw vertical lines
        for (let x = startX; x < endX; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let y = startY; y < endY; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
            ctx.stroke();
        }

        // Draw origin
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 1 / this.viewport.zoom;
        ctx.beginPath();
        ctx.moveTo(0, startY);
        ctx.lineTo(0, endY);
        ctx.moveTo(startX, 0);
        ctx.lineTo(endX, 0);
        ctx.stroke();
    }

    drawLayer(layer) {
        for (const obj of layer.objects) {
            this.drawObject(obj);
        }
    }

    drawObject(obj) {
        const ctx = this.ctx;

        ctx.save();

        switch (obj.type) {
            case 'fixture':
                this.drawFixture(obj);
                break;
            case 'wall':
                this.drawWall(obj);
                break;
            case 'pipe':
                this.drawPipe(obj);
                break;
            case 'dimension':
                this.drawDimension(obj);
                break;
            case 'text':
                this.drawText(obj);
                break;
        }

        ctx.restore();
    }

    drawFixture(obj) {
        const symbol = PlumbingSymbols[obj.fixtureType];
        if (symbol && symbol.draw) {
            symbol.draw(this.ctx, obj.x, obj.y, obj.scale || 1);
        }

        // Draw label if present
        if (obj.label) {
            this.ctx.fillStyle = '#64748b';
            this.ctx.font = '8px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(obj.label, obj.x + (symbol.width / 2), obj.y - 4);
        }
    }

    drawWall(obj) {
        const ctx = this.ctx;

        ctx.strokeStyle = obj.color || '#1e293b';
        ctx.lineWidth = obj.width || 4;
        ctx.lineCap = 'square';

        ctx.beginPath();
        ctx.moveTo(obj.x1, obj.y1);
        ctx.lineTo(obj.x2, obj.y2);
        ctx.stroke();
    }

    drawPipe(obj) {
        const ctx = this.ctx;
        const pipeType = PipeTypes[obj.pipeType] || PipeTypes.supply;

        ctx.strokeStyle = obj.color || pipeType.color;
        ctx.lineWidth = obj.width || pipeType.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (pipeType.style === 'dashed') {
            ctx.setLineDash([4, 2]);
        }

        ctx.beginPath();
        if (obj.points && obj.points.length > 0) {
            ctx.moveTo(obj.points[0].x, obj.points[0].y);
            for (let i = 1; i < obj.points.length; i++) {
                ctx.lineTo(obj.points[i].x, obj.points[i].y);
            }
        } else {
            ctx.moveTo(obj.x1, obj.y1);
            ctx.lineTo(obj.x2, obj.y2);
        }
        ctx.stroke();

        ctx.setLineDash([]);
    }

    drawDimension(obj) {
        const ctx = this.ctx;

        ctx.strokeStyle = '#f59e0b';
        ctx.fillStyle = '#f59e0b';
        ctx.lineWidth = 1;

        // Draw line
        ctx.beginPath();
        ctx.moveTo(obj.x1, obj.y1);
        ctx.lineTo(obj.x2, obj.y2);
        ctx.stroke();

        // Draw arrows
        const angle = Math.atan2(obj.y2 - obj.y1, obj.x2 - obj.x1);
        const arrowSize = 5;

        // Start arrow
        ctx.beginPath();
        ctx.moveTo(obj.x1, obj.y1);
        ctx.lineTo(
            obj.x1 + arrowSize * Math.cos(angle + Math.PI * 0.8),
            obj.y1 + arrowSize * Math.sin(angle + Math.PI * 0.8)
        );
        ctx.lineTo(
            obj.x1 + arrowSize * Math.cos(angle - Math.PI * 0.8),
            obj.y1 + arrowSize * Math.sin(angle - Math.PI * 0.8)
        );
        ctx.closePath();
        ctx.fill();

        // End arrow
        ctx.beginPath();
        ctx.moveTo(obj.x2, obj.y2);
        ctx.lineTo(
            obj.x2 - arrowSize * Math.cos(angle + Math.PI * 0.8),
            obj.y2 - arrowSize * Math.sin(angle + Math.PI * 0.8)
        );
        ctx.lineTo(
            obj.x2 - arrowSize * Math.cos(angle - Math.PI * 0.8),
            obj.y2 - arrowSize * Math.sin(angle - Math.PI * 0.8)
        );
        ctx.closePath();
        ctx.fill();

        // Draw measurement text
        if (obj.text) {
            const midX = (obj.x1 + obj.x2) / 2;
            const midY = (obj.y1 + obj.y2) / 2;

            ctx.save();
            ctx.translate(midX, midY);
            ctx.rotate(angle);

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-20, -8, 40, 12);

            ctx.fillStyle = '#f59e0b';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(obj.text, 0, 0);

            ctx.restore();
        }
    }

    drawText(obj) {
        const ctx = this.ctx;

        ctx.fillStyle = obj.color || '#475569';
        ctx.font = `${obj.fontSize || 12}px ${obj.fontFamily || 'sans-serif'}`;
        ctx.textAlign = obj.align || 'left';
        ctx.fillText(obj.text, obj.x, obj.y);
    }

    drawSelectionHandles() {
        if (this.selectedObjects.length === 0) return;

        const ctx = this.ctx;
        ctx.strokeStyle = '#3b82f6';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = 1 / this.viewport.zoom;

        for (const obj of this.selectedObjects) {
            const bounds = this.getObjectBounds(obj);
            if (!bounds) continue;

            // Draw selection box
            ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

            // Draw corner handles
            const handleSize = 6 / this.viewport.zoom;
            const corners = [
                { x: bounds.x, y: bounds.y },
                { x: bounds.x + bounds.width, y: bounds.y },
                { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
                { x: bounds.x, y: bounds.y + bounds.height }
            ];

            for (const corner of corners) {
                ctx.fillRect(
                    corner.x - handleSize / 2,
                    corner.y - handleSize / 2,
                    handleSize,
                    handleSize
                );
                ctx.strokeRect(
                    corner.x - handleSize / 2,
                    corner.y - handleSize / 2,
                    handleSize,
                    handleSize
                );
            }
        }
    }

    // ══════════════════════════════════════════════════════════════
    // OBJECT MANAGEMENT
    // ══════════════════════════════════════════════════════════════
    addObject(obj) {
        const layer = this.layers.find(l => l.id === (obj.layer || this.activeLayer));
        if (layer) {
            obj.id = this.generateId();
            layer.objects.push(obj);
            this.objects.push(obj);
            this.saveState();
            this.render();
            return obj;
        }
        return null;
    }

    removeObject(obj) {
        // Remove from layer
        for (const layer of this.layers) {
            const index = layer.objects.indexOf(obj);
            if (index >= 0) {
                layer.objects.splice(index, 1);
            }
        }

        // Remove from global objects
        const index = this.objects.indexOf(obj);
        if (index >= 0) {
            this.objects.splice(index, 1);
        }

        // Remove from selection
        const selIndex = this.selectedObjects.indexOf(obj);
        if (selIndex >= 0) {
            this.selectedObjects.splice(selIndex, 1);
        }

        this.saveState();
        this.render();
    }

    getObjectBounds(obj) {
        switch (obj.type) {
            case 'fixture':
                const symbol = PlumbingSymbols[obj.fixtureType];
                return {
                    x: obj.x,
                    y: obj.y,
                    width: symbol.width * (obj.scale || 1),
                    height: symbol.height * (obj.scale || 1)
                };
            case 'wall':
            case 'pipe':
                return {
                    x: Math.min(obj.x1, obj.x2) - 2,
                    y: Math.min(obj.y1, obj.y2) - 2,
                    width: Math.abs(obj.x2 - obj.x1) + 4,
                    height: Math.abs(obj.y2 - obj.y1) + 4
                };
            case 'text':
                return {
                    x: obj.x - 10,
                    y: obj.y - 10,
                    width: 100,
                    height: 20
                };
            default:
                return null;
        }
    }

    hitTest(x, y) {
        // Test in reverse order (top to bottom)
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            const bounds = this.getObjectBounds(obj);

            if (bounds &&
                x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                return obj;
            }
        }
        return null;
    }

    // ══════════════════════════════════════════════════════════════
    // HISTORY (UNDO/REDO)
    // ══════════════════════════════════════════════════════════════
    saveState() {
        const state = {
            objects: JSON.parse(JSON.stringify(this.objects)),
            layers: JSON.parse(JSON.stringify(this.layers))
        };

        // Remove future history
        this.history = this.history.slice(0, this.historyIndex + 1);

        // Add new state
        this.history.push(state);

        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
            return true;
        }
        return false;
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
            return true;
        }
        return false;
    }

    restoreState(state) {
        this.objects = JSON.parse(JSON.stringify(state.objects));
        this.layers = JSON.parse(JSON.stringify(state.layers));
        this.selectedObjects = [];
        this.render();
    }

    // ══════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ══════════════════════════════════════════════════════════════
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = this.screenToWorld(screenX, screenY);
        const snapped = this.snapToGrid(world.x, world.y);

        if (this.currentTool === 'pan' || e.button === 1) {
            // Pan mode
            this.isPanning = true;
            this.panStart = { x: screenX, y: screenY };
            this.canvas.style.cursor = 'grabbing';
        } else if (this.currentTool === 'select') {
            // Selection
            const hitObj = this.hitTest(world.x, world.y);
            if (hitObj) {
                if (!e.shiftKey) {
                    this.selectedObjects = [hitObj];
                } else {
                    if (!this.selectedObjects.includes(hitObj)) {
                        this.selectedObjects.push(hitObj);
                    }
                }
                this.render();
            } else {
                this.selectedObjects = [];
                this.render();
            }
        } else {
            // Drawing mode
            this.isDrawing = true;
            this.drawStart = snapped;
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = this.screenToWorld(screenX, screenY);
        const snapped = this.snapToGrid(world.x, world.y);

        // Update cursor position display
        this.onCursorMove?.(snapped.x, snapped.y);

        if (this.isPanning && this.panStart) {
            // Pan viewport
            const dx = screenX - this.panStart.x;
            const dy = screenY - this.panStart.y;
            this.viewport.x += dx;
            this.viewport.y += dy;
            this.panStart = { x: screenX, y: screenY };
            this.render();
        } else if (this.isDrawing && this.drawStart) {
            // Update temp object
            this.updateTempObject(snapped);
            this.render();
        }
    }

    handleMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this.panStart = null;
            this.canvas.style.cursor = 'grab';
        } else if (this.isDrawing && this.tempObject) {
            // Finalize object
            this.addObject(this.tempObject);
            this.tempObject = null;
            this.isDrawing = false;
            this.drawStart = null;
        }
    }

    handleWheel(e) {
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Zoom
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(this.viewport.minZoom, Math.min(this.viewport.maxZoom, this.viewport.zoom * zoomFactor));

        // Zoom towards mouse position
        const worldBefore = this.screenToWorld(mouseX, mouseY);
        this.viewport.zoom = newZoom;
        const worldAfter = this.screenToWorld(mouseX, mouseY);

        this.viewport.x += (worldAfter.x - worldBefore.x) * this.viewport.zoom;
        this.viewport.y += (worldAfter.y - worldBefore.y) * this.viewport.zoom;

        this.onZoomChange?.(this.viewport.zoom);
        this.render();
    }

    handleTouchStart(e) {
        // Handle touch events for mobile support
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0 });
        }
    }

    handleTouchMove(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    handleTouchEnd(e) {
        this.handleMouseUp({});
    }

    handleKeyDown(e) {
        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    this.undo();
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 'd':
                    e.preventDefault();
                    this.duplicateSelected();
                    break;
            }
        } else {
            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    this.deleteSelected();
                    break;
            }
        }
    }

    updateTempObject(currentPos) {
        if (!this.drawStart) return;

        switch (this.currentTool) {
            case 'wall':
                this.tempObject = {
                    type: 'wall',
                    layer: 'walls',
                    x1: this.drawStart.x,
                    y1: this.drawStart.y,
                    x2: currentPos.x,
                    y2: currentPos.y
                };
                break;
            case 'pipe-supply':
            case 'pipe-waste':
            case 'pipe-vent':
                const pipeType = this.currentTool.replace('pipe-', '');
                this.tempObject = {
                    type: 'pipe',
                    layer: pipeType,
                    pipeType: pipeType,
                    x1: this.drawStart.x,
                    y1: this.drawStart.y,
                    x2: currentPos.x,
                    y2: currentPos.y
                };
                break;
            case 'dimension':
                const dx = currentPos.x - this.drawStart.x;
                const dy = currentPos.y - this.drawStart.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const feet = Math.floor(distance / 12);
                const inches = Math.round(distance % 12);

                this.tempObject = {
                    type: 'dimension',
                    layer: 'dimensions',
                    x1: this.drawStart.x,
                    y1: this.drawStart.y,
                    x2: currentPos.x,
                    y2: currentPos.y,
                    text: feet > 0 ? `${feet}'-${inches}"` : `${inches}"`
                };
                break;
        }
    }

    // ══════════════════════════════════════════════════════════════
    // PUBLIC METHODS
    // ══════════════════════════════════════════════════════════════
    setTool(tool) {
        this.currentTool = tool;
        this.selectedObjects = [];
        this.tempObject = null;
        this.render();
    }

    zoom(factor) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const worldBefore = this.screenToWorld(centerX, centerY);
        this.viewport.zoom = Math.max(this.viewport.minZoom, Math.min(this.viewport.maxZoom, this.viewport.zoom * factor));
        const worldAfter = this.screenToWorld(centerX, centerY);

        this.viewport.x += (worldAfter.x - worldBefore.x) * this.viewport.zoom;
        this.viewport.y += (worldAfter.y - worldBefore.y) * this.viewport.zoom;

        this.onZoomChange?.(this.viewport.zoom);
        this.render();
    }

    zoomToFit() {
        if (this.objects.length === 0) {
            this.viewport.zoom = 1;
            this.viewport.x = 0;
            this.viewport.y = 0;
            this.render();
            return;
        }

        // Calculate bounds of all objects
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        for (const obj of this.objects) {
            const bounds = this.getObjectBounds(obj);
            if (bounds) {
                minX = Math.min(minX, bounds.x);
                minY = Math.min(minY, bounds.y);
                maxX = Math.max(maxX, bounds.x + bounds.width);
                maxY = Math.max(maxY, bounds.y + bounds.height);
            }
        }

        const width = maxX - minX;
        const height = maxY - minY;
        const padding = 50;

        const zoomX = (this.canvas.width - padding * 2) / width;
        const zoomY = (this.canvas.height - padding * 2) / height;
        this.viewport.zoom = Math.min(zoomX, zoomY, this.viewport.maxZoom);

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        this.viewport.x = this.canvas.width / 2 - centerX * this.viewport.zoom;
        this.viewport.y = this.canvas.height / 2 - centerY * this.viewport.zoom;

        this.onZoomChange?.(this.viewport.zoom);
        this.render();
    }

    deleteSelected() {
        for (const obj of this.selectedObjects) {
            this.removeObject(obj);
        }
        this.selectedObjects = [];
    }

    duplicateSelected() {
        const newSelection = [];
        for (const obj of this.selectedObjects) {
            const duplicate = JSON.parse(JSON.stringify(obj));
            duplicate.x = (duplicate.x || 0) + 20;
            duplicate.y = (duplicate.y || 0) + 20;
            if (duplicate.x1 !== undefined) {
                duplicate.x1 += 20;
                duplicate.y1 += 20;
                duplicate.x2 += 20;
                duplicate.y2 += 20;
            }
            this.addObject(duplicate);
            newSelection.push(duplicate);
        }
        this.selectedObjects = newSelection;
    }

    clear() {
        this.objects = [];
        this.layers.forEach(layer => layer.objects = []);
        this.selectedObjects = [];
        this.saveState();
        this.render();
    }

    exportData() {
        return {
            objects: this.objects,
            layers: this.layers,
            viewport: this.viewport,
            grid: this.grid
        };
    }

    importData(data) {
        this.objects = data.objects || [];
        this.layers = data.layers || this.initializeLayers();
        if (data.viewport) {
            this.viewport = data.viewport;
        }
        if (data.grid) {
            this.grid = data.grid;
        }
        this.selectedObjects = [];
        this.saveState();
        this.render();
    }

    generateId() {
        return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
