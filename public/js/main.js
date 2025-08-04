// js/main.js - Main application loader
console.log('🚀 Starting Equipment Borrowing System...');

// Configuration
const API_BASE = '/api';

// Global state
window.appState = {
    equipment: [],
    borrowings: [],
    overdueItems: [],
    currentView: 'equipment',
    currentEditId: null
};

// Make API_BASE available globally
window.API_BASE = API_BASE;

class EquipmentBorrowingApp {
    constructor() {
        this.initialized = false;
        this.modules = {};
    }

    async init() {
        try {
            console.log('Initializing app...');
            
            // Load modules dynamically
            await this.loadModules();
            
            // Add modals to page
            this.addModalsToPage();
            
            // Setup event listeners AFTER modules are loaded
            this.setupEventListeners();
            
            // Load initial data
            await this.loadInitialData();
            
            // Set default dates
            this.setDefaultDates();
            
            this.initialized = true;
            console.log('✅ Equipment Borrowing System loaded successfully!');
            
        } catch (error) {
            console.error('❌ Error initializing app:', error);
        }
    }

    async loadModules() {
        console.log('Loading modules...');
        
        try {
            // Load utility functions first
            const utilsModule = await import('./utils.js');
            this.modules.utils = utilsModule;
            window.utils = utilsModule;
            
            // Load dashboard module
            const dashboardModule = await import('./dashboard.js');
            this.modules.dashboard = dashboardModule;
            window.dashboard = dashboardModule;
            
            // Load modal modules
            const equipmentModalModule = await import('./equipment-modal.js');
            this.modules.equipmentModal = equipmentModalModule;
            
            const borrowModalModule = await import('./borrow-modal.js');
            this.modules.borrowModal = borrowModalModule;
            
            const returnModalModule = await import('./return-modal.js');
            this.modules.returnModal = returnModalModule;

            const eventsModalModule = await import('./events-modal.js');
            this.modules.eventsModal = eventsModalModule;
            
            // Load QR scanner
            const qrModule = await import('./qr-scanner.js');
            this.modules.qrScanner = qrModule;
            
            console.log('✅ All modules loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading modules:', error);
            throw error;
        }
    }

    addModalsToPage() {
        const modalsHTML = `
            <!-- Add Equipment Modal -->
            <div id="equipmentModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl p-6 m-4 max-w-2xl w-full max-h-screen overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h3 id="equipmentModalTitle" class="text-lg font-semibold text-gray-900">Add Equipment</h3>
                        <button id="closeEquipmentModal" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <form id="equipmentForm" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="equipmentName" class="block text-sm font-medium text-gray-700 mb-1">Equipment Name *</label>
                                <input type="text" id="equipmentName" name="name" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label for="totalCount" class="block text-sm font-medium text-gray-700 mb-1">Total Count *</label>
                                <input type="number" id="totalCount" name="total_count" required min="1" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                        </div>
                        <div>
                            <label for="equipmentDescription" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea id="equipmentDescription" name="description" rows="3" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="storageArea" class="block text-sm font-medium text-gray-700 mb-1">Storage Area *</label>
                                <input type="text" id="storageArea" name="storage_area" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g., Room A-1">
                            </div>
                            <div>
                                <label for="rubric" class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <select id="rubric" name="rubric" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">Select category</option>
                                    <option value="Projectors">Projectors</option>
                                    <option value="Cables">Cables</option>
                                    <option value="Monitors">Monitors</option>
                                    <option value="Audio">Audio Equipment</option>
                                    <option value="Cameras">Cameras</option>
                                    <option value="Lighting">Lighting</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div class="flex justify-end space-x-3 pt-6">
                            <button type="button" id="cancelEquipmentBtn" class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" id="submitEquipmentBtn" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                Add Equipment
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Add Event Modal -->
            <div id="eventsModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl p-6 m-4 max-w-2xl w-full max-h-screen overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h3 id="eventsModalTitle" class="text-lg font-semibold text-gray-900">Add Event</h3>
                        <button id="closeEventsModal" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <form id="eventsForm" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="eventsName" class="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                                <input type="text" id="eventName" name="name" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label for="eventId" class="block text-sm font-medium text-gray-700 mb-1">Event ID *</label>
                                <input type="text" id="eventId" name="event_id" required min="1" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                        </div>
                        
                        <!-- <div>
                            <label for="eventDescription" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea id="eventDescription" name="description" rows="3" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                        </div> -->
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="location" class="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                                <input type="text" id="location" name="location" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g., Hörsaal 1">
                            </div>
                        </div>
                        
                        <div class="flex justify-end space-x-3 pt-6">
                            <button type="button" id="cancelEventBtn" class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" id="submitEventsBtn" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                                Add Equipment
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Borrow Equipment Modal -->
            <div id="borrowModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl p-6 m-4 max-w-2xl w-full max-h-screen overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-semibold text-gray-900">Borrow Equipment</h3>
                        <button id="closeBorrowModal" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <form id="borrowForm" class="space-y-4">
                        <div>
                            <label for="borrowEquipment" class="block text-sm font-medium text-gray-700 mb-1">Equipment *</label>
                            <div class="flex gap-2">
                                <select id="borrowEquipment" name="equipment_id" required class="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">Select equipment to borrow</option>
                                </select>
                                <button type="button" id="scan-qr-btn" class="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2">
                                    <i class="fas fa-qrcode"></i>
                                    Scan QR
                                </button>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="borrowerName" class="block text-sm font-medium text-gray-700 mb-1">Borrower Name *</label>
                                <input type="text" id="borrowerName" name="borrower_name" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label for="eventName" class="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                                <input type="text" id="eventName" name="event_name" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                        </div>
                        <div>
                            <label for="eventLocation" class="block text-sm font-medium text-gray-700 mb-1">Event Location *</label>
                            <input type="text" id="eventLocation" name="event_location" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="borrowingDate" class="block text-sm font-medium text-gray-700 mb-1">Borrowing Date *</label>
                                <input type="date" id="borrowingDate" name="borrowing_date" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label for="expectedReturnDate" class="block text-sm font-medium text-gray-700 mb-1">Expected Return Date *</label>
                                <input type="date" id="expectedReturnDate" name="expected_return_date" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                        </div>
                        <div>
                            <label for="borrowNotes" class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea id="borrowNotes" name="notes" rows="3" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Any additional notes..."></textarea>
                        </div>
                        <div class="flex justify-end space-x-3 pt-6">
                            <button type="button" id="cancelBorrowBtn" class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                                Borrow Equipment
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Return Equipment Modal -->
            <div id="returnModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden items-center justify-center z-50">
                <div class="bg-white rounded-lg shadow-xl p-6 m-4 max-w-2xl w-full max-h-screen overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="text-lg font-semibold text-gray-900">Return Equipment</h3>
                        <button id="closeReturnModal" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <form id="returnForm" class="space-y-4">
                        <div>
                            <label for="returnBorrowing" class="block text-sm font-medium text-gray-700 mb-1">Select Borrowing to Return *</label>
                            <select id="returnBorrowing" name="borrowing_id" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">Select item to return</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="returnerName" class="block text-sm font-medium text-gray-700 mb-1">Returned By *</label>
                                <input type="text" id="returnerName" name="returner_name" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label for="actualReturnDate" class="block text-sm font-medium text-gray-700 mb-1">Return Date *</label>
                                <input type="date" id="actualReturnDate" name="actual_return_date" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                        </div>
                        <div>
                            <label for="returnNotes" class="block text-sm font-medium text-gray-700 mb-1">Return Notes</label>
                            <textarea id="returnNotes" name="notes" rows="3" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Condition notes, damages, etc..."></textarea>
                        </div>
                        <div class="flex justify-end space-x-3 pt-6">
                            <button type="button" id="cancelReturnBtn" class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" class="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                                Return Equipment
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- QR Scanner Modal -->
            <div id="qr-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden items-center justify-center z-[60]">
                <div class="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">Scan QR Code</h3>
                        <button id="qr-close" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    <div class="text-center">
                        <video id="qr-video" class="w-full max-w-sm mx-auto border-2 border-gray-300 rounded-lg mb-4"></video>
                        <div id="qr-result" class="text-sm text-gray-600 min-h-[40px] p-2"></div>
                        <div class="text-xs text-gray-500 mt-2">
                            Point your camera at a QR code to scan
                        </div>
                    </div>
                </div>
            </div>

            <!-- Loading Modal -->
            <div id="loading" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6">
                    <div class="flex items-center">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                        <span>Loading...</span>
                    </div>
                </div>
            </div>

            <!-- Toast Notification -->
            <div id="toast" class="fixed top-4 right-4 z-50 hidden">
                <div class="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
                    <div class="flex items-center">
                        <div id="toastIcon" class="mr-3"></div>
                        <div>
                            <p id="toastMessage" class="text-sm font-medium"></p>
                        </div>
                        <button id="closeToast" class="ml-auto text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalsHTML);
        console.log('✅ Modals added to page');
    }

    setupEventListeners() {
        console.log('Setting up main event listeners...');
        
        // Header buttons - NOW with proper module references

        document.getElementById('addEquipmentBtn')?.addEventListener('click', () => {
            console.log('Add Equipment button clicked');
            if (this.modules.equipmentModal?.openModal) {
                console.log('Opening equipment modal...');
                this.modules.equipmentModal.openModal();
            } else {
                console.error('Equipment modal module not available');
            }
        });
        
        document.getElementById('borrowBtn')?.addEventListener('click', () => {
            console.log('Borrow button clicked');
            if (this.modules.borrowModal?.openModal) {
                console.log('Opening borrow modal...');
                this.modules.borrowModal.openModal();
            } else {
                console.error('Borrow modal module not available');
            }
        });
        
        document.getElementById('returnBtn')?.addEventListener('click', () => {
            console.log('Return button clicked');
            if (this.modules.returnModal?.openModal) {
                console.log('Opening return modal...');
                this.modules.returnModal.openModal();
            } else {
                console.error('Return modal module not available');
            }
        });

        document.getElementById('addEventBtn')?.addEventListener('click', () => {
            console.log('Add Event button clicked');
            if (this.modules.eventsModal?.openModal) {
                console.log('Opening events modal...');
                this.modules.eventsModal.openModal();
            } else {
                console.error('Event modal module not available');
            }
        });
        
        // Tab navigation
        document.getElementById('equipmentTab')?.addEventListener('click', () => this.switchTab('equipment'));
        document.getElementById('borrowingsTab')?.addEventListener('click', () => this.switchTab('borrowings'));
        document.getElementById('overdueTab')?.addEventListener('click', () => this.switchTab('overdue'));
        document.getElementById('eventTab')?.addEventListener('click', () => this.switchTab('events'));
        
        // Search
        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            if (this.modules.dashboard?.handleSearch) {
                this.modules.dashboard.handleSearch(e.target.value);
            }
        });
        
        console.log('✅ Main event listeners setup complete');
    }

    async loadInitialData() {
        console.log('Loading initial data...');
        
        if (this.modules.dashboard?.loadData) {
            await this.modules.dashboard.loadData();
        }
    }

    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const borrowingDateInput = document.getElementById('borrowingDate');
        const expectedReturnDateInput = document.getElementById('expectedReturnDate');
        const actualReturnDateInput = document.getElementById('actualReturnDate');
        
        if (borrowingDateInput) borrowingDateInput.value = today;
        if (expectedReturnDateInput) expectedReturnDateInput.value = nextWeek;
        if (actualReturnDateInput) actualReturnDateInput.value = today;
    }

    switchTab(view) {
        window.appState.currentView = view;
        
        // Update tab styling
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active', 'border-b-2', 'border-blue-600', 'text-blue-600');
            btn.classList.add('text-gray-500', 'hover:text-gray-700');
        });
        
        const activeTab = document.getElementById(`${view}Tab`);
        if (activeTab) {
            activeTab.classList.add('active', 'border-b-2', 'border-blue-600', 'text-blue-600');
            activeTab.classList.remove('text-gray-500', 'hover:text-gray-700');
        }
        
        // Show/hide content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        const activeSection = document.getElementById(`${view}Section`);
        if (activeSection) {
            activeSection.classList.remove('hidden');
        }
        
        // Load appropriate data
        if (this.modules.dashboard) {
            if (view === 'borrowings') {
                this.modules.dashboard.loadBorrowings?.();
            } else if (view === 'overdue') {
                this.modules.dashboard.loadOverdueItems?.();
            } else if (view === 'events') {
                this.modules.dashboard.loadEventItems?. ();
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new EquipmentBorrowingApp();
    await app.init();
});

export { EquipmentBorrowingApp };