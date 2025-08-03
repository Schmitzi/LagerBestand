// js/qr-scanner.js - QR Scanner functionality

let qrScanner = null;
let QrScannerClass = null;
let qrModal, video, qrResult, qrCloseBtn;

async function initializeElements() {
    qrModal = document.getElementById('qr-modal');
    video = document.getElementById('qr-video');
    qrResult = document.getElementById('qr-result');
    qrCloseBtn = document.getElementById('qr-close');
    
    if (!qrModal || !video || !qrResult) {
        console.warn('QR Scanner elements not found');
        return false;
    }
    
    return true;
}

async function loadQRScannerLibrary() {
    try {
        // Try to load from CDN (more reliable than npm in this setup)
        if (window.QrScanner) {
            QrScannerClass = window.QrScanner;
            console.log('✅ QR Scanner already loaded from CDN');
            return true;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/qr-scanner@1.4.2/qr-scanner.umd.min.js';
            script.onload = () => {
                QrScannerClass = window.QrScanner;
                console.log('✅ QR Scanner loaded from CDN');
                resolve(true);
            };
            script.onerror = () => {
                console.error('❌ Failed to load QR Scanner from CDN');
                reject(new Error('Failed to load QR Scanner'));
            };
            document.head.appendChild(script);
        });
    } catch (error) {
        console.error('Failed to load QR Scanner:', error);
        return false;
    }
}

function setupEventListeners() {
    if (!qrModal) return;

    // Close QR scanner modal
    qrCloseBtn?.addEventListener('click', closeModal);

    // Close modal when clicking outside
    qrModal.addEventListener('click', (event) => {
        if (event.target === qrModal) {
            closeModal();
        }
    });

    // Handle escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !qrModal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

export async function openModal() {
    console.log('Opening QR scanner...');
    
    // Initialize elements
    const elementsReady = await initializeElements();
    if (!elementsReady) {
        console.error('QR Scanner elements not ready');
        return;
    }
    
    // Load QR Scanner library if not already loaded
    if (!QrScannerClass) {
        try {
            await loadQRScannerLibrary();
        } catch (error) {
            console.error('Failed to load QR Scanner library:', error);
            if (qrResult) {
                qrResult.innerHTML = `
                    <div class="text-red-600">
                        <i class="fas fa-exclamation-triangle mb-2"></i><br>
                        Failed to load QR Scanner<br>
                        <span class="text-xs">Please check your internet connection</span>
                    </div>
                `;
            }
            return;
        }
    }
    
    if (!QrScannerClass) {
        console.error('QR Scanner not available');
        return;
    }
    
    qrModal.classList.remove('hidden');
    qrModal.classList.add('flex');
    startScanning();
    
    // Setup event listeners if not already done
    if (!qrModal.dataset.initialized) {
        setupEventListeners();
        qrModal.dataset.initialized = 'true';
    }
}

export function closeModal() {
    if (!qrModal) return;
    
    qrModal.classList.add('hidden');
    qrModal.classList.remove('flex');
    
    if (qrScanner) {
        qrScanner.stop();
        qrScanner = null;
    }
    
    if (qrResult) {
        qrResult.innerHTML = '';
    }
}

function startScanning() {
    if (!video || !qrResult || !QrScannerClass) return;
    
    qrResult.innerHTML = '<div class="text-blue-600"><i class="fas fa-spinner fa-spin mr-2"></i>Starting camera...</div>';
    
    qrScanner = new QrScannerClass(
        video,
        result => onScanSuccess(result.data),
        {
            highlightScanRegion: true,
            highlightCodeOutline: true,
        }
    );
    
    qrScanner.start().then(() => {
        qrResult.innerHTML = '<div class="text-green-600"><i class="fas fa-camera mr-2"></i>Camera ready - point at QR code</div>';
    }).catch(err => {
        console.error('QR Scanner start error:', err);
        
        // Show helpful message based on error
        if (err.name === 'NotAllowedError') {
            qrResult.innerHTML = `
                <div class="text-red-600">
                    <i class="fas fa-exclamation-circle mb-2"></i><br>
                    Camera access denied<br>
                    <span class="text-xs">Please allow camera access and try again</span>
                </div>
            `;
        } else if (err.name === 'NotFoundError') {
            qrResult.innerHTML = `
                <div class="text-red-600">
                    <i class="fas fa-video-slash mb-2"></i><br>
                    No camera found<br>
                    <span class="text-xs">Please connect a camera and try again</span>
                </div>
            `;
        } else {
            qrResult.innerHTML = `
                <div class="text-red-600">
                    <i class="fas fa-exclamation-triangle mb-2"></i><br>
                    Camera error<br>
                    <span class="text-xs">${err.message || 'Unknown error'}</span>
                </div>
            `;
        }
    });
}

async function onScanSuccess(qrCodeData) {
    console.log('QR Code scanned:', qrCodeData);
    
    qrResult.innerHTML = '<div class="text-blue-600"><i class="fas fa-spinner fa-spin mr-2"></i>Processing...</div>';
    
    try {
        // Call your equipment API to look up the equipment
        const response = await fetch(`${window.API_BASE}/equipment/${qrCodeData}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                qrResult.innerHTML = `
                    <div class="text-red-600">
                        <i class="fas fa-exclamation-circle mb-2"></i><br>
                        Equipment not found<br>
                        <span class="text-xs">QR Code: ${escapeHtml(qrCodeData)}</span>
                    </div>
                `;
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        }
        
        const equipment = await response.json();
        
        if (equipment && equipment.success && equipment.data) {
            const equipmentData = equipment.data;
            
            // Success - show found equipment
            qrResult.innerHTML = `
                <div class="text-green-600">
                    <i class="fas fa-check-circle mb-2"></i><br>
                    <strong>Found:</strong> ${escapeHtml(equipmentData.name)}<br>
                    <span class="text-xs">${escapeHtml(equipmentData.rubric)} - ${equipmentData.available_count}/${equipmentData.total_count} available</span>
                </div>
            `;
            
            // Check if equipment is available
            if (equipmentData.available_count > 0) {
                // Add equipment to borrow modal dropdown and select it
                if (window.borrowModal?.selectEquipmentInDropdown) {
                    window.borrowModal.selectEquipmentInDropdown(equipmentData);
                }
                
                // Close QR modal after short delay
                setTimeout(closeModal, 1500);
            } else {
                qrResult.innerHTML = `
                    <div class="text-orange-600">
                        <i class="fas fa-exclamation-triangle mb-2"></i><br>
                        <strong>Found:</strong> ${escapeHtml(equipmentData.name)}<br>
                        <span class="text-xs text-red-600">Currently not available (0/${equipmentData.total_count})</span>
                    </div>
                `;
            }
            
        } else {
            qrResult.innerHTML = `
                <div class="text-red-600">
                    <i class="fas fa-exclamation-circle mb-2"></i><br>
                    Equipment not found<br>
                    <span class="text-xs">QR Code: ${escapeHtml(qrCodeData)}</span>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Equipment lookup error:', error);
        qrResult.innerHTML = `
            <div class="text-red-600">
                <i class="fas fa-exclamation-triangle mb-2"></i><br>
                Error looking up equipment<br>
                <span class="text-xs">${error.message}</span>
            </div>
        `;
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check if QR Scanner is supported
export function isQRScannerSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

console.log('✅ QR Scanner module loaded');