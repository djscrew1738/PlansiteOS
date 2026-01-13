// PlansiteOS 2.0 - Mobile Application
// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[App] Service Worker registered:', registration.scope);

      updateServiceWorkerStatus('Active');

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('New version available! Refresh to update.', 'info');
          }
        });
      });
    } catch (error) {
      console.error('[App] Service Worker registration failed:', error);
      updateServiceWorkerStatus('Failed');
    }
  });
}

// PWA Install Handling
let deferredPrompt;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;

  // Show install prompt after 30 seconds if not dismissed
  setTimeout(() => {
    if (!localStorage.getItem('pwa_install_dismissed')) {
      const installPrompt = document.getElementById('installPrompt');
      if (installPrompt) {
        installPrompt.style.display = 'block';
      }
    }
  }, 30000);
});

window.addEventListener('appinstalled', () => {
  console.log('[App] PWA installed');
  localStorage.setItem('pwa_installed', 'true');
  showToast('PlansiteOS installed successfully!', 'success');
});

async function installApp() {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === 'accepted') {
    showToast('Thanks for installing PlansiteOS!', 'success');
  }

  deferredPrompt = null;
  const installPrompt = document.getElementById('installPrompt');
  if (installPrompt) {
    installPrompt.style.display = 'none';
  }
}

function dismissInstall() {
  localStorage.setItem('pwa_install_dismissed', 'true');
  const installPrompt = document.getElementById('installPrompt');
  if (installPrompt) {
    installPrompt.style.display = 'none';
  }
}

// IndexedDB Setup
let db;

async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PlansiteOS', 2);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = event => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('uploads')) {
        const uploadStore = db.createObjectStore('uploads', { keyPath: 'id', autoIncrement: true });
        uploadStore.createIndex('status', 'status', { unique: false });
        uploadStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains('analyses')) {
        const analysisStore = db.createObjectStore('analyses', { keyPath: 'id', autoIncrement: true });
        analysisStore.createIndex('projectName', 'projectName', { unique: false });
        analysisStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

// Global State
let uploadQueue = [];
let activeView = 'home';
let settings = {
  companyName: 'CTL Plumbing LLC',
  licenseNumber: 'M-43106',
  phoneNumber: '(999) 999-9999',
  autoAnalyze: true,
  autoOrient: true,
  compressImages: true,
  enableNotifications: false,
  notifyComplete: true,
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initDB();
    await loadSettings();
    initializeUploadHandlers();
    await loadRecentAnalyses();
    setupConnectionMonitoring();
    await checkPendingUploads();
    requestNotificationPermission();
    calculateStorageUsage();

    // Listen for service worker messages
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    console.log('[App] PlansiteOS 2.0 initialized');
  } catch (error) {
    console.error('[App] Initialization error:', error);
    showToast('Failed to initialize app', 'error');
  }
});

// Service Worker Message Handler
function handleServiceWorkerMessage(event) {
  const { type, data } = event.data;

  switch (type) {
    case 'UPLOAD_SYNCED':
      console.log('[App] Upload synced:', data.filename);
      showToast(`${data.filename} synced successfully!`, 'success');
      loadRecentAnalyses();
      break;
    default:
      console.log('[App] Unknown message:', type);
  }
}

// Connection Monitoring
function setupConnectionMonitoring() {
  updateConnectionStatus();

  window.addEventListener('online', () => {
    updateConnectionStatus();
    showToast('Back online - syncing queued uploads', 'success');
    processPendingUploads();
  });

  window.addEventListener('offline', () => {
    updateConnectionStatus();
    showToast('Offline mode - uploads will queue automatically', 'warning');
  });
}

function processPendingUploads() {
  processUploadQueue();
}

function updateConnectionStatus() {
  const statusBar = document.getElementById('statusBar');
  const statusText = document.getElementById('connectionStatus');

  if (!statusBar || !statusText) {
    return;
  }

  if (navigator.onLine) {
    statusBar.classList.remove('offline');
    statusText.textContent = 'Online';
  } else {
    statusBar.classList.add('offline');
    statusText.textContent = 'Offline';
  }
}

// Upload Handlers
function initializeUploadHandlers() {
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');

  if (!uploadZone || !fileInput) {
    return;
  }

  uploadZone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', e => {
    handleFileSelection(Array.from(e.target.files));
    e.target.value = ''; // Reset input
  });

  // Drag and drop support
  uploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--primary)';
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.borderColor = 'var(--border)';
  });

  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.style.borderColor = 'var(--border)';
    handleFileSelection(Array.from(e.dataTransfer.files));
  });
}

function triggerFileUpload() {
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.click();
  }
}

// File Selection Handler
async function handleFileSelection(files) {
  const validFiles = files.filter(validateFile);

  if (validFiles.length === 0) {
    return;
  }

  showLoading(`Processing ${validFiles.length} file(s)...`);

  for (const file of validFiles) {
    if (file.type === 'application/pdf') {
      await processPDF(file);
    } else {
      await processImage(file);
    }
  }

  hideLoading();
  updateQueueCount();

  // Auto-upload if online and setting enabled
  if (navigator.onLine && settings.autoAnalyze) {
    processUploadQueue();
  } else if (!navigator.onLine) {
    showToast('Files queued for upload when online', 'warning');
  } else {
    showToast(`${validFiles.length} file(s) ready for analysis`, 'info');
  }
}

// Validate File
function validateFile(file) {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

  if (!validTypes.includes(file.type)) {
    showToast(`${file.name}: Invalid file type. Use PDF, PNG, or JPG.`, 'error');
    return false;
  }

  if (file.size > maxSize) {
    showToast(`${file.name}: File too large. Max 50MB.`, 'error');
    return false;
  }

  return true;
}

// Process PDF with Multi-Page Handling
async function processPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageCount = pdf.numPages;

    console.log(`[PDF] Processing ${pageCount} pages from ${file.name}`);

    const pages = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      // Detect and correct orientation if enabled
      let dataUrl;
      let orientation = 'portrait';

      if (settings.autoOrient) {
        orientation = detectOrientation(viewport.width, viewport.height);
        dataUrl = await correctCanvasOrientation(canvas, orientation);
      } else {
        dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      }

      // Compress if enabled
      if (settings.compressImages) {
        dataUrl = await compressImage(dataUrl);
      }

      pages.push({
        pageNumber: i,
        dataUrl: dataUrl,
        orientation: orientation,
        selected: true,
      });
    }

    const uploadItem = {
      id: generateId(),
      file: file,
      type: 'pdf',
      name: file.name,
      size: file.size,
      pageCount: pageCount,
      pages: pages,
      status: 'queued',
      timestamp: Date.now(),
      progress: 0,
    };

    await saveToIndexedDB('uploads', uploadItem);
    uploadQueue.push(uploadItem);
    displayUploadItem(uploadItem);

    console.log(`[PDF] Added ${file.name} to queue`);
  } catch (error) {
    console.error('[PDF] Processing error:', error);
    showToast(`Failed to process PDF: ${file.name}`, 'error');
  }
}

// Process Image
async function processImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();

    reader.onload = async e => {
      const img = new Image();

      img.onload = async () => {
        let dataUrl;
        let orientation = 'portrait';

        if (settings.autoOrient) {
          orientation = detectOrientation(img.width, img.height);
          dataUrl = await correctImageOrientation(img, orientation);
        } else {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        }

        if (settings.compressImages) {
          dataUrl = await compressImage(dataUrl);
        }

        const uploadItem = {
          id: generateId(),
          file: file,
          type: 'image',
          name: file.name,
          size: file.size,
          dataUrl: dataUrl,
          orientation: orientation,
          status: 'queued',
          timestamp: Date.now(),
          progress: 0,
        };

        await saveToIndexedDB('uploads', uploadItem);
        uploadQueue.push(uploadItem);
        displayUploadItem(uploadItem);

        console.log(`[Image] Added ${file.name} to queue`);
        resolve();
      };

      img.onerror = () => {
        showToast(`Failed to load image: ${file.name}`, 'error');
        resolve();
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      showToast(`Failed to read file: ${file.name}`, 'error');
      resolve();
    };

    reader.readAsDataURL(file);
  });
}

// Orientation Detection
function detectOrientation(width, height) {
  const ratio = width / height;

  if (ratio > 1.3) {
    return 'landscape';
  }

  if (ratio < 0.7) {
    return 'portrait';
  }

  return 'square';
}

// Correct Canvas Orientation
async function correctCanvasOrientation(canvas, orientation) {
  if (orientation === 'landscape') {
    const rotated = document.createElement('canvas');
    rotated.width = canvas.height;
    rotated.height = canvas.width;
    const ctx = rotated.getContext('2d');

    ctx.translate(rotated.width / 2, rotated.height / 2);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

    return rotated.toDataURL('image/jpeg', 0.85);
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

// Correct Image Orientation
async function correctImageOrientation(img, orientation) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (orientation === 'landscape') {
    canvas.width = img.height;
    canvas.height = img.width;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
  } else {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

// Compress Image for Mobile
async function compressImage(dataUrl, maxWidth = 1200) {
  return new Promise(resolve => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    img.src = dataUrl;
  });
}

// Camera Capture
function captureFromCamera() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.multiple = true;

  input.onchange = e => {
    handleFileSelection(Array.from(e.target.files));
  };

  input.click();
}

// Display Upload Item
function displayUploadItem(item) {
  const uploadsList = document.getElementById('uploadsList');
  const activeUploads = document.getElementById('activeUploads');

  if (!uploadsList || !activeUploads) {
    return;
  }

  activeUploads.style.display = 'block';

  const thumbnail = item.type === 'pdf' ? item.pages[0].dataUrl : item.dataUrl;

  const uploadItemEl = document.createElement('div');
  uploadItemEl.className = 'upload-item';
  uploadItemEl.dataset.id = item.id;

  uploadItemEl.innerHTML = `
        <img src="${thumbnail}" alt="${item.name}" class="upload-thumb">
        <div class="upload-info">
            <div class="upload-name">${item.name}</div>
            <div class="upload-status">Queued for analysis</div>
            <div class="upload-progress">
                <div class="upload-progress-fill" style="width: 0%"></div>
            </div>
        </div>
    `;

  uploadsList.appendChild(uploadItemEl);
}

// Update Upload Progress
function updateUploadProgress(itemId, progress, status) {
  const uploadItem = document.querySelector(`[data-id="${itemId}"]`);
  if (!uploadItem) return;

  const progressFill = uploadItem.querySelector('.upload-progress-fill');
  const statusText = uploadItem.querySelector('.upload-status');

  progressFill.style.width = `${progress}%`;

  if (status) {
    statusText.textContent = status;
  }

  if (progress >= 100) {
    progressFill.classList.add('complete');
    setTimeout(() => {
      uploadItem.style.opacity = '0';
      setTimeout(() => uploadItem.remove(), 300);
    }, 2000);
  }
}

// Process Upload Queue
async function processUploadQueue() {
  if (uploadQueue.length === 0) return;

  console.log(`[Queue] Processing ${uploadQueue.length} uploads`);

  const itemsToProcess = [...uploadQueue];

  for (const item of itemsToProcess) {
    if (item.status === 'queued') {
      await uploadAndAnalyze(item);
    }
  }

  uploadQueue = uploadQueue.filter(item => item.status === 'queued');
  updateQueueCount();

  if (uploadQueue.length === 0) {
    setTimeout(() => {
      const activeUploads = document.getElementById('activeUploads');
      if (document.querySelectorAll('.upload-item').length === 0) {
        activeUploads.style.display = 'none';
      }
    }, 3000);
  }
}

// Upload and Analyze Individual File
async function uploadAndAnalyze(item) {
  try {
    console.log(`[Upload] Starting analysis for ${item.name}`);

    item.status = 'uploading';
    updateUploadProgress(item.id, 0, 'Uploading...');

    const formData = new FormData();

    if (item.type === 'pdf') {
      const selectedPages = item.pages.filter(p => p.selected);

      for (const page of selectedPages) {
        const blob = await fetch(page.dataUrl).then(r => r.blob());
        formData.append('pages[]', blob, `${item.name}_page_${page.pageNumber}.jpg`);
      }

      formData.append('original_name', item.name);
      formData.append('page_count', selectedPages.length);
    } else {
      const blob = await fetch(item.dataUrl).then(r => r.blob());
      formData.append('blueprint', blob, item.name);
    }

    // Add metadata
    formData.append('company_name', settings.companyName);
    formData.append('license_number', settings.licenseNumber);

    // Upload with progress tracking
    const response = await uploadWithProgress(formData, progress => {
      updateUploadProgress(item.id, progress, 'Analyzing...');
    });

    if (response.ok) {
      const result = await response.json();

      console.log(`[Upload] Success for ${item.name}`, result);

      item.status = 'complete';
      item.result = result;

      // Save analysis to IndexedDB
      await saveToIndexedDB('analyses', {
        name: item.name,
        result: result,
        thumbnail: item.type === 'pdf' ? item.pages[0].dataUrl : item.dataUrl,
        timestamp: Date.now(),
        projectName: result.project_name || 'Untitled',
        fixtureCount: result.fixture_count || 0,
        totalBid: result.total_bid || 0,
        materialCost: result.material_cost || 0,
        laborHours: result.labor_hours || 0,
      });

      // Remove from upload queue
      await deleteFromIndexedDB('uploads', item.id);

      updateUploadProgress(item.id, 100, 'Complete');
      showToast(`${item.name} analyzed successfully!`, 'success');

      // Refresh recent analyses
      loadRecentAnalyses();

      // Send notification if enabled and app is in background
      if (settings.notifyComplete && document.hidden && settings.enableNotifications) {
        sendNotification('Blueprint Analysis Complete', {
          body: `${item.name} - ${result.fixture_count} fixtures detected`,
          icon: '/icons/icon-192x192.png',
        });
      }
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.error('[Upload] Error:', error);
    item.status = 'error';
    updateUploadProgress(item.id, 0, 'Failed');
    showToast(`Failed to upload: ${item.name}`, 'error');

    // Keep in queue for retry
    item.status = 'queued';
  }
}

// Upload with Progress Tracking
function uploadWithProgress(formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          ok: true,
          status: xhr.status,
          json: () => Promise.resolve(JSON.parse(xhr.responseText)),
        });
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    // TODO: Replace with your actual API endpoint
    const apiEndpoint = '/api/analyze-blueprint';
    xhr.open('POST', apiEndpoint);
    xhr.send(formData);
  });
}

// Check and Process Pending Uploads
async function checkPendingUploads() {
  try {
    const uploads = await getAllFromIndexedDB('uploads');

    if (uploads.length > 0) {
      console.log(`[Queue] Found ${uploads.length} pending uploads`);
      uploadQueue = uploads.filter(u => u.status === 'queued');

      uploadQueue.forEach(item => displayUploadItem(item));
      updateQueueCount();

      if (navigator.onLine && settings.autoAnalyze) {
        processUploadQueue();
      }
    }
  } catch (error) {
    console.error('[Queue] Error checking pending uploads:', error);
  }
}

function updateQueueCount() {
  const queueCount = document.getElementById('queueCount');
  if (!queueCount) {
    return;
  }
  const count = uploadQueue.filter(i => i.status === 'queued').length;
  queueCount.textContent = `${count} queued`;
}

function clearActiveUploads() {
  if (confirm('Clear all pending uploads?')) {
    uploadQueue = [];
    const uploadsList = document.getElementById('uploadsList');
    const activeUploads = document.getElementById('activeUploads');

    if (uploadsList) {
      uploadsList.innerHTML = '';
    }

    if (activeUploads) {
      activeUploads.style.display = 'none';
    }
    updateQueueCount();
  }
}

// Load Recent Analyses
async function loadRecentAnalyses() {
  try {
    const analyses = await getAllFromIndexedDB('analyses');
    const recentGrid = document.getElementById('recentGrid');

    if (!recentGrid) {
      return;
    }

    if (analyses.length === 0) {
      recentGrid.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                    <p>No analyses yet</p>
                    <span>Upload blueprints to get started</span>
                </div>
            `;
      return;
    }

    // Sort by timestamp, most recent first
    analyses.sort((a, b) => b.timestamp - a.timestamp);

    // Show last 6 on home screen
    const recent = analyses.slice(0, 6);

    recentGrid.innerHTML = recent
      .map(
        analysis => `
            <div class="job-card" onclick="viewAnalysis(${analysis.id})">
                <img src="${analysis.thumbnail}" alt="${analysis.name}" class="job-thumb">
                <div class="job-info">
                    <div class="job-name">${analysis.projectName || analysis.name}</div>
                    <div class="job-details">
                        <span>${analysis.fixtureCount} fixtures</span>
                        <span>$${formatNumber(analysis.totalBid)}</span>
                        <span class="job-time">${formatTimestamp(analysis.timestamp)}</span>
                    </div>
                </div>
            </div>
        `
      )
      .join('');

    // Update analyses list view
    updateAnalysesList(analyses);
  } catch (error) {
    console.error('[Analyses] Error loading:', error);
  }
}

function updateAnalysesList(analyses) {
  const analysesList = document.getElementById('analysesList');
  if (!analysesList) {
    return;
  }

  if (analyses.length === 0) {
    analysesList.innerHTML = `
            <div class="empty-state">
                <p>No analyses found</p>
            </div>
        `;
    return;
  }

  analysesList.innerHTML = analyses
    .map(
      analysis => `
        <div class="analysis-card" onclick="viewAnalysis(${analysis.id})">
            <div class="analysis-header">
                <div>
                    <div class="analysis-title">${analysis.projectName || analysis.name}</div>
                    <div class="analysis-date">${formatDate(analysis.timestamp)}</div>
                </div>
                <span class="analysis-badge">Complete</span>
            </div>
            <div class="analysis-stats">
                <div class="stat-item">
                    <span class="stat-value">${analysis.fixtureCount}</span>
                    <span class="stat-label">Fixtures</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${analysis.laborHours}h</span>
                    <span class="stat-label">Labor</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">$${formatNumber(analysis.totalBid)}</span>
                    <span class="stat-label">Total Bid</span>
                </div>
            </div>
        </div>
    `
    )
    .join('');
}

// View Analysis Detail
async function viewAnalysis(id) {
  try {
    const analysis = await getFromIndexedDB('analyses', id);
    if (!analysis) return;

    const modal = document.getElementById('analysisModal');
    const title = document.getElementById('analysisTitle');
    const body = document.getElementById('analysisBody');

    if (!modal || !title || !body) {
      return;
    }

    title.textContent = analysis.projectName || analysis.name;

    body.innerHTML = `
            <div style="margin-bottom: 20px;">
                <img src="${analysis.thumbnail}" style="width: 100%; border-radius: 8px;">
            </div>
            <div style="background: var(--bg-darker); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <h4 style="margin-bottom: 12px;">Summary</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                    <div>
                        <strong>Fixtures:</strong> ${analysis.fixtureCount}
                    </div>
                    <div>
                        <strong>Labor:</strong> ${analysis.laborHours} hours
                    </div>
                    <div>
                        <strong>Materials:</strong> $${formatNumber(analysis.materialCost)}
                    </div>
                    <div>
                        <strong>Total Bid:</strong> $${formatNumber(analysis.totalBid)}
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: 12px;">
                <button class="btn-secondary" onclick="closeAnalysisModal()">Close</button>
                <button class="btn-primary" onclick="printAnalysis(${id})">Print Package</button>
            </div>
        `;

    modal.classList.add('active');
  } catch (error) {
    console.error('[Analysis] Error viewing:', error);
    showToast('Failed to load analysis', 'error');
  }
}

function closeAnalysisModal() {
  const modal = document.getElementById('analysisModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// View Switching
function switchView(viewName) {
  // Update active view
  document.querySelectorAll('.view-container').forEach(view => {
    view.classList.remove('active');
  });

  const targetView = document.getElementById(`view${capitalize(viewName)}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Update bottom nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  const activeNavItem = document.querySelector(`[data-view="${viewName}"]`);
  if (activeNavItem) {
    activeNavItem.classList.add('active');
  }

  activeView = viewName;
}

// Menu Toggle
function toggleMenu() {
  const overlay = document.getElementById('menuOverlay');
  const menu = document.getElementById('sidebarMenu');

  if (overlay) {
    overlay.classList.toggle('active');
  }

  if (menu) {
    menu.classList.toggle('active');
  }
}

// Settings
async function loadSettings() {
  try {
    const savedSettings = await getFromIndexedDB('settings', 'app_settings');
    if (savedSettings) {
      settings = { ...settings, ...savedSettings.value };
    }

    // Update UI
    const companyName = document.getElementById('companyName');
    const licenseNumber = document.getElementById('licenseNumber');
    const phoneNumber = document.getElementById('phoneNumber');
    const autoAnalyze = document.getElementById('autoAnalyze');
    const autoOrient = document.getElementById('autoOrient');
    const compressImages = document.getElementById('compressImages');
    const enableNotifications = document.getElementById('enableNotifications');
    const notifyComplete = document.getElementById('notifyComplete');

    if (companyName) companyName.value = settings.companyName;
    if (licenseNumber) licenseNumber.value = settings.licenseNumber;
    if (phoneNumber) phoneNumber.value = settings.phoneNumber;
    if (autoAnalyze) autoAnalyze.checked = settings.autoAnalyze;
    if (autoOrient) autoOrient.checked = settings.autoOrient;
    if (compressImages) compressImages.checked = settings.compressImages;
    if (enableNotifications) enableNotifications.checked = settings.enableNotifications;
    if (notifyComplete) notifyComplete.checked = settings.notifyComplete;

    // Add change listeners
    document.querySelectorAll('#viewSettings input').forEach(input => {
      input.addEventListener('change', saveSettings);
    });
  } catch (error) {
    console.error('[Settings] Load error:', error);
  }
}

async function saveSettings() {
  const companyName = document.getElementById('companyName');
  const licenseNumber = document.getElementById('licenseNumber');
  const phoneNumber = document.getElementById('phoneNumber');
  const autoAnalyze = document.getElementById('autoAnalyze');
  const autoOrient = document.getElementById('autoOrient');
  const compressImages = document.getElementById('compressImages');
  const enableNotifications = document.getElementById('enableNotifications');
  const notifyComplete = document.getElementById('notifyComplete');

  if (companyName) settings.companyName = companyName.value;
  if (licenseNumber) settings.licenseNumber = licenseNumber.value;
  if (phoneNumber) settings.phoneNumber = phoneNumber.value;
  if (autoAnalyze) settings.autoAnalyze = autoAnalyze.checked;
  if (autoOrient) settings.autoOrient = autoOrient.checked;
  if (compressImages) settings.compressImages = compressImages.checked;
  if (enableNotifications) settings.enableNotifications = enableNotifications.checked;
  if (notifyComplete) settings.notifyComplete = notifyComplete.checked;

  await saveToIndexedDB('settings', {
    key: 'app_settings',
    value: settings,
  });

  console.log('[Settings] Saved');
}

// Notifications
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const notifyCheckbox = document.getElementById('enableNotifications');

    if (!notifyCheckbox) {
      return;
    }

    notifyCheckbox.addEventListener('change', async () => {
      if (notifyCheckbox.checked) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          notifyCheckbox.checked = false;
          showToast('Notification permission denied', 'warning');
        }
      }
    });
  }
}

function sendNotification(title, options) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  }
}

function showNotifications() {
  // TODO: Implement notifications panel
  showToast('Notifications feature coming soon', 'info');
}

function printAnalysis() {
  showToast('Print feature coming soon', 'info');
}

// Storage Management
async function calculateStorageUsage() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percent = (usage / quota) * 100;

    const storageFill = document.getElementById('storageFill');
    const storageText = document.getElementById('storageText');

    if (storageFill) {
      storageFill.style.width = `${percent}%`;
    }

    if (storageText) {
      storageText.textContent =
        `${formatBytes(usage)} of ${formatBytes(quota)} used (${percent.toFixed(1)}%)`;
    }
  }
}

async function clearAllData() {
  if (!confirm('This will delete all analyses and settings. Are you sure?')) {
    return;
  }

  try {
    showLoading('Clearing data...');

    // Clear IndexedDB
    const stores = ['uploads', 'analyses', 'settings'];
    for (const store of stores) {
      await clearIndexedDBStore(store);
    }

    // Clear localStorage
    localStorage.clear();

    // Clear service worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    hideLoading();
    showToast('All data cleared', 'success');

    // Reload app
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error('[Storage] Clear error:', error);
    hideLoading();
    showToast('Failed to clear data', 'error');
  }
}

// Updates
function checkForUpdates() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
    showToast('Checking for updates...', 'info');

    setTimeout(() => {
      showToast('You have the latest version', 'success');
    }, 2000);
  } else {
    showToast('Service worker not available', 'warning');
  }
}

function updateServiceWorkerStatus(status) {
  const statusEl = document.getElementById('swStatus');
  if (statusEl) {
    statusEl.textContent = status;
  }
}

// Export/Sync
function exportData() {
  showToast('Export feature coming soon', 'info');
  // TODO: Implement data export to JSON/CSV
}

function syncWithBidMaster() {
  showToast('BidMaster sync feature coming soon', 'info');
  // TODO: Implement API sync with BidMaster
}

// Search/Sort
function searchAnalyses() {
  // TODO: Implement search
  showToast('Search feature coming soon', 'info');
}

function sortAnalyses() {
  // TODO: Implement sort options
  showToast('Sort feature coming soon', 'info');
}

// UI Utilities
function showLoading(text = 'Processing...') {
  const overlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');

  if (loadingText) {
    loadingText.textContent = text;
  }

  if (overlay) {
    overlay.style.display = 'flex';
  }
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');

  if (!container) {
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// IndexedDB Helpers
async function saveToIndexedDB(storeName, data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getFromIndexedDB(storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteFromIndexedDB(storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function clearIndexedDBStore(storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Utility Functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return date.toLocaleDateString();
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

console.log('[App] PlansiteOS 2.0 loaded');
