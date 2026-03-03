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

        // Background image
        this.backgroundImage = null;
        this.backgroundOpacity = 0.5;
        this.backgroundLocked = true;
        this.backgroundPosition = { x: 0, y: 0 };
        this.backgroundScale = 1;

        // Object snapping
        this.objectSnap = true;
        this.snapDistance = 10;

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

    // Smart snap: try object snapping first, then grid
    smartSnap(x, y, excludeObjects = []) {
        // Try object snapping first if enabled
        if (this.objectSnap) {
            const objectSnap = this.snapToObjects(x, y, excludeObjects);
            if (objectSnap.snapped) {
                return { x: objectSnap.x, y: objectSnap.y, snapInfo: objectSnap };
            }
        }

        // Fall back to grid snapping
        const gridSnap = this.snapToGrid(x, y);
        return { x: gridSnap.x, y: gridSnap.y, snapInfo: null };
    }

    snapToObjects(x, y, excludeObjects = []) {
        const snapThreshold = this.snapDistance / this.viewport.zoom;
        let closestSnap = null;
        let closestDistance = snapThreshold;

        // Get all snap points from all objects
        for (const obj of this.objects) {
            // Skip excluded objects (e.g., the object being dragged)
            if (excludeObjects.includes(obj)) continue;

            const snapPoints = this.getObjectSnapPoints(obj);

            for (const point of snapPoints) {
                const distance = Math.hypot(point.x - x, point.y - y);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestSnap = {
                        x: point.x,
                        y: point.y,
                        type: point.type,
                        object: obj,
                        snapped: true
                    };
                }
            }
        }

        if (closestSnap) {
            return closestSnap;
        }

        return { x, y, snapped: false };
    }

    getObjectSnapPoints(obj) {
        const points = [];

        switch (obj.type) {
            case 'fixture': {
                const symbol = PlumbingSymbols[obj.fixtureType];
                if (!symbol) break;

                const w = symbol.width * (obj.scale || 1);
                const h = symbol.height * (obj.scale || 1);

                // Corner points
                points.push(
                    { x: obj.x, y: obj.y, type: 'corner' },
                    { x: obj.x + w, y: obj.y, type: 'corner' },
                    { x: obj.x, y: obj.y + h, type: 'corner' },
                    { x: obj.x + w, y: obj.y + h, type: 'corner' }
                );

                // Edge midpoints
                points.push(
                    { x: obj.x + w / 2, y: obj.y, type: 'edge' },
                    { x: obj.x + w / 2, y: obj.y + h, type: 'edge' },
                    { x: obj.x, y: obj.y + h / 2, type: 'edge' },
                    { x: obj.x + w, y: obj.y + h / 2, type: 'edge' }
                );

                // Center point
                points.push({ x: obj.x + w / 2, y: obj.y + h / 2, type: 'center' });

                // Connection points (if defined)
                if (symbol.connections) {
                    for (const cp of symbol.connections) {
                        points.push({
                            x: obj.x + cp.x * (obj.scale || 1),
                            y: obj.y + cp.y * (obj.scale || 1),
                            type: 'connection',
                            connectionType: cp.type
                        });
                    }
                }
                break;
            }

            case 'wall': {
                // Start, end, and midpoint
                points.push(
                    { x: obj.x1, y: obj.y1, type: 'endpoint' },
                    { x: obj.x2, y: obj.y2, type: 'endpoint' },
                    { x: (obj.x1 + obj.x2) / 2, y: (obj.y1 + obj.y2) / 2, type: 'midpoint' }
                );
                break;
            }

            case 'pipe': {
                if (obj.points && obj.points.length > 0) {
                    // All points in the pipe path
                    for (const point of obj.points) {
                        points.push({ x: point.x, y: point.y, type: 'endpoint' });
                    }
                } else {
                    points.push(
                        { x: obj.x1, y: obj.y1, type: 'endpoint' },
                        { x: obj.x2, y: obj.y2, type: 'endpoint' }
                    );
                }
                break;
            }

            case 'dimension':
            case 'text': {
                points.push({ x: obj.x || obj.x1, y: obj.y || obj.y1, type: 'point' });
                break;
            }
        }

        return points;
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

        // Draw background image
        if (this.backgroundImage) {
            this.drawBackgroundImage();
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

        // Draw connection points on fixtures
        this.drawConnectionPoints();

        // Draw live measurements while drawing
        this.drawLiveMeasurements();

        // Draw snap indicators
        this.drawSnapIndicators();

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
        if (!symbol || !symbol.draw) return;

        const ctx = this.ctx;
        ctx.save();

        // Apply rotation if present
        if (obj.rotation) {
            const centerX = obj.x + (symbol.width * (obj.scale || 1)) / 2;
            const centerY = obj.y + (symbol.height * (obj.scale || 1)) / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((obj.rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
        }

        // Draw the fixture
        symbol.draw(ctx, obj.x, obj.y, obj.scale || 1);

        ctx.restore();

        // Draw label if present
        if (obj.label) {
            ctx.fillStyle = '#64748b';
            ctx.font = '8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(obj.label, obj.x + (symbol.width / 2), obj.y - 4);
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

            // Draw rotation handle if fixture
            if (obj.type === 'fixture') {
                const rotationHandleY = bounds.y - 20 / this.viewport.zoom;
                ctx.fillStyle = '#10b981';
                ctx.beginPath();
                ctx.arc(bounds.x + bounds.width / 2, rotationHandleY, 4 / this.viewport.zoom, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2 / this.viewport.zoom;
                ctx.stroke();

                // Line to rotation handle
                ctx.strokeStyle = '#94a3b8';
                ctx.lineWidth = 1 / this.viewport.zoom;
                ctx.setLineDash([2, 2]);
                ctx.beginPath();
                ctx.moveTo(bounds.x + bounds.width / 2, bounds.y);
                ctx.lineTo(bounds.x + bounds.width / 2, rotationHandleY);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    drawSnapIndicators() {
        if (!this.currentSnapInfo || !this.currentSnapInfo.snapped) return;

        const ctx = this.ctx;
        const snapPoint = { x: this.currentSnapInfo.x, y: this.currentSnapInfo.y };

        // Draw snap indicator
        ctx.save();
        ctx.strokeStyle = '#10b981';
        ctx.fillStyle = '#10b981';
        ctx.lineWidth = 2 / this.viewport.zoom;

        // Draw crosshair at snap point
        const size = 8 / this.viewport.zoom;
        ctx.beginPath();
        ctx.moveTo(snapPoint.x - size, snapPoint.y);
        ctx.lineTo(snapPoint.x + size, snapPoint.y);
        ctx.moveTo(snapPoint.x, snapPoint.y - size);
        ctx.lineTo(snapPoint.x, snapPoint.y + size);
        ctx.stroke();

        // Draw circle around snap point
        ctx.beginPath();
        ctx.arc(snapPoint.x, snapPoint.y, size / 2, 0, Math.PI * 2);
        ctx.stroke();

        // Draw connection line to snapped object if it's a connection point
        if (this.currentSnapInfo.type === 'connection' && this.currentSnapInfo.object) {
            const objBounds = this.getObjectBounds(this.currentSnapInfo.object);
            if (objBounds) {
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
                ctx.lineWidth = 1 / this.viewport.zoom;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(snapPoint.x, snapPoint.y);
                ctx.lineTo(objBounds.x + objBounds.width / 2, objBounds.y + objBounds.height / 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        ctx.restore();
    }

    drawConnectionPoints() {
        const ctx = this.ctx;
        ctx.save();

        // Show connection points on selected fixtures or when using pipe tools
        const showConnections = this.currentTool.startsWith('pipe-') || this.selectedObjects.length > 0;
        if (!showConnections) {
            ctx.restore();
            return;
        }

        // Get fixtures to show connection points for
        let fixtures = [];
        if (this.currentTool.startsWith('pipe-')) {
            // Show all fixtures when using pipe tool
            fixtures = this.objects.filter(obj => obj.type === 'fixture');
        } else {
            // Show only selected fixtures
            fixtures = this.selectedObjects.filter(obj => obj.type === 'fixture');
        }

        for (const obj of fixtures) {
            const symbol = PlumbingSymbols[obj.fixtureType];
            if (!symbol || !symbol.connections) continue;

            for (const conn of symbol.connections) {
                const x = obj.x + conn.x * (obj.scale || 1);
                const y = obj.y + conn.y * (obj.scale || 1);

                // Color code by connection type
                let color = '#3b82f6'; // Default blue
                if (conn.type === 'waste') {
                    color = '#64748b'; // Gray for waste
                } else if (conn.type === 'supply-hot') {
                    color = '#ef4444'; // Red for hot water
                } else if (conn.type === 'supply-cold') {
                    color = '#3b82f6'; // Blue for cold water
                } else if (conn.type === 'supply') {
                    color = '#8b5cf6'; // Purple for generic supply
                } else if (conn.type === 'vent') {
                    color = '#10b981'; // Green for vent
                }

                // Draw connection point
                ctx.strokeStyle = color;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = 2 / this.viewport.zoom;

                const radius = 3 / this.viewport.zoom;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Draw inner dot
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, radius / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    drawLiveMeasurements() {
        if (!this.tempObject || !this.drawStart) return;

        const ctx = this.ctx;
        ctx.save();

        // Only show for linear objects (walls, pipes, dimensions)
        if (this.tempObject.type === 'wall' || this.tempObject.type === 'pipe' || this.tempObject.type === 'dimension') {
            const x1 = this.tempObject.x1 || this.drawStart.x;
            const y1 = this.tempObject.y1 || this.drawStart.y;
            const x2 = this.tempObject.x2;
            const y2 = this.tempObject.y2;

            // Calculate distance and angle
            const dx = x2 - x1;
            const dy = y2 - y1;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;

            // Format distance as feet and inches
            const totalInches = Math.round(distance);
            const feet = Math.floor(totalInches / 12);
            const inches = totalInches % 12;
            const distanceText = feet > 0 ? `${feet}'-${inches}"` : `${inches}"`;

            // Calculate midpoint for label placement
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            // Draw measurement box
            ctx.fillStyle = 'rgba(59, 130, 246, 0.95)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1 / this.viewport.zoom;

            // Measure text to size box
            ctx.font = `${10 / this.viewport.zoom}px sans-serif`;
            const textWidth = ctx.measureText(distanceText).width;
            const padding = 4 / this.viewport.zoom;
            const boxWidth = textWidth + padding * 2;
            const boxHeight = 16 / this.viewport.zoom;

            // Draw background box
            ctx.fillRect(
                midX - boxWidth / 2,
                midY - boxHeight / 2 - 10 / this.viewport.zoom,
                boxWidth,
                boxHeight
            );
            ctx.strokeRect(
                midX - boxWidth / 2,
                midY - boxHeight / 2 - 10 / this.viewport.zoom,
                boxWidth,
                boxHeight
            );

            // Draw distance text
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                distanceText,
                midX,
                midY - 10 / this.viewport.zoom
            );

            // Draw angle if not horizontal or vertical
            const normalizedAngle = ((angle % 360) + 360) % 360;
            if (Math.abs(normalizedAngle) > 5 && Math.abs(normalizedAngle - 90) > 5 && Math.abs(normalizedAngle - 180) > 5 && Math.abs(normalizedAngle - 270) > 5) {
                const angleText = `${Math.round(normalizedAngle)}°`;
                const angleTextWidth = ctx.measureText(angleText).width;
                const angleBoxWidth = angleTextWidth + padding * 2;

                ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
                ctx.fillRect(
                    midX - angleBoxWidth / 2,
                    midY + 4 / this.viewport.zoom,
                    angleBoxWidth,
                    boxHeight
                );
                ctx.strokeRect(
                    midX - angleBoxWidth / 2,
                    midY + 4 / this.viewport.zoom,
                    angleBoxWidth,
                    boxHeight
                );

                ctx.fillStyle = '#ffffff';
                ctx.fillText(
                    angleText,
                    midX,
                    midY + 4 / this.viewport.zoom + boxHeight / 2
                );
            }
        }

        ctx.restore();
    }

    // ══════════════════════════════════════════════════════════════
    // BACKGROUND IMAGE
    // ══════════════════════════════════════════════════════════════
    drawBackgroundImage() {
        if (!this.backgroundImage) return;

        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = this.backgroundOpacity;

        const imgWidth = this.backgroundImage.width * this.backgroundScale;
        const imgHeight = this.backgroundImage.height * this.backgroundScale;

        ctx.drawImage(
            this.backgroundImage,
            this.backgroundPosition.x,
            this.backgroundPosition.y,
            imgWidth,
            imgHeight
        );

        ctx.restore();
    }

    loadBackgroundImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.backgroundImage = img;
                    // Center the image
                    const centerX = (this.canvas.width / 2 - this.viewport.x) / this.viewport.zoom - (img.width / 2);
                    const centerY = (this.canvas.height / 2 - this.viewport.y) / this.viewport.zoom - (img.height / 2);
                    this.backgroundPosition = { x: centerX, y: centerY };
                    this.backgroundScale = 1;
                    this.render();
                    resolve(img);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    removeBackgroundImage() {
        this.backgroundImage = null;
        this.render();
    }

    setBackgroundOpacity(opacity) {
        this.backgroundOpacity = opacity / 100;
        this.render();
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
        const snapResult = this.smartSnap(world.x, world.y, this.selectedObjects);
        const snapped = { x: snapResult.x, y: snapResult.y };
        this.currentSnapInfo = snapResult.snapInfo;

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
                    this.setSelection([hitObj]);
                } else {
                    if (!this.selectedObjects.includes(hitObj)) {
                        this.selectedObjects.push(hitObj);
                        this.onSelectionChange?.();
                        this.render();
                    }
                }
            } else {
                this.setSelection([]);
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
        const snapResult = this.smartSnap(world.x, world.y, this.selectedObjects);
        const snapped = { x: snapResult.x, y: snapResult.y };
        this.currentSnapInfo = snapResult.snapInfo;

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
    setSelection(objects) {
        this.selectedObjects = Array.isArray(objects) ? objects : [objects];
        this.onSelectionChange?.();
        this.render();
    }

    setTool(tool) {
        this.currentTool = tool;
        this.setSelection([]);
        this.tempObject = null;
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

    rotateSelected(degrees) {
        for (const obj of this.selectedObjects) {
            if (obj.type === 'fixture') {
                obj.rotation = (obj.rotation || 0) + degrees;
                // Normalize to 0-360
                obj.rotation = ((obj.rotation % 360) + 360) % 360;
            }
        }
        this.saveState();
        this.render();
    }

    alignSelected(direction) {
        if (this.selectedObjects.length < 2) return;

        const bounds = this.selectedObjects.map(obj => this.getObjectBounds(obj));

        switch (direction) {
            case 'left':
                const minX = Math.min(...bounds.map(b => b.x));
                this.selectedObjects.forEach((obj, i) => {
                    const offset = minX - bounds[i].x;
                    if (obj.x !== undefined) obj.x += offset;
                    if (obj.x1 !== undefined) {
                        obj.x1 += offset;
                        obj.x2 += offset;
                    }
                });
                break;

            case 'center':
                const avgCenterX = bounds.reduce((sum, b) => sum + (b.x + b.width / 2), 0) / bounds.length;
                this.selectedObjects.forEach((obj, i) => {
                    const currentCenter = bounds[i].x + bounds[i].width / 2;
                    const offset = avgCenterX - currentCenter;
                    if (obj.x !== undefined) obj.x += offset;
                    if (obj.x1 !== undefined) {
                        obj.x1 += offset;
                        obj.x2 += offset;
                    }
                });
                break;

            case 'right':
                const maxX = Math.max(...bounds.map(b => b.x + b.width));
                this.selectedObjects.forEach((obj, i) => {
                    const offset = maxX - (bounds[i].x + bounds[i].width);
                    if (obj.x !== undefined) obj.x += offset;
                    if (obj.x1 !== undefined) {
                        obj.x1 += offset;
                        obj.x2 += offset;
                    }
                });
                break;

            case 'top':
                const minY = Math.min(...bounds.map(b => b.y));
                this.selectedObjects.forEach((obj, i) => {
                    const offset = minY - bounds[i].y;
                    if (obj.y !== undefined) obj.y += offset;
                    if (obj.y1 !== undefined) {
                        obj.y1 += offset;
                        obj.y2 += offset;
                    }
                });
                break;

            case 'middle':
                const avgCenterY = bounds.reduce((sum, b) => sum + (b.y + b.height / 2), 0) / bounds.length;
                this.selectedObjects.forEach((obj, i) => {
                    const currentCenter = bounds[i].y + bounds[i].height / 2;
                    const offset = avgCenterY - currentCenter;
                    if (obj.y !== undefined) obj.y += offset;
                    if (obj.y1 !== undefined) {
                        obj.y1 += offset;
                        obj.y2 += offset;
                    }
                });
                break;

            case 'bottom':
                const maxY = Math.max(...bounds.map(b => b.y + b.height));
                this.selectedObjects.forEach((obj, i) => {
                    const offset = maxY - (bounds[i].y + bounds[i].height);
                    if (obj.y !== undefined) obj.y += offset;
                    if (obj.y1 !== undefined) {
                        obj.y1 += offset;
                        obj.y2 += offset;
                    }
                });
                break;
        }

        this.saveState();
        this.render();
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
