// js/main.js - Main application loader
console.log('🚀 Starting Equipment Borrowing System...');

// Configuration
const API_BASE = '/api';

// Global state
window.appState = {
    equipment: [],
    borrowings: [],
    overdueItems: [],
    events: [], // Make sure this is initialized
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
            
            // Add modals to page FIRST
            this.addModalsToPage();
            
            // Then load modules dynamically
            await this.loadModules();
            
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
            
            // Add modals to page BEFORE loading their JS modules
            await this.addModalsToPage();
            
            // Now load modal modules
            const equipmentModalModule = await import('./equipment-modal.js');
            this.modules.equipmentModal = equipmentModalModule;
            window.equipmentModal = equipmentModalModule;
            
            const borrowModalModule = await import('./borrow-modal.js');
            this.modules.borrowModal = borrowModalModule;
            window.borrowModal = borrowModalModule;
            
            const returnModalModule = await import('./return-modal.js');
            this.modules.returnModal = returnModalModule;
            window.returnModal = returnModalModule;

            console.log("Loading events modal module...");
            try {
                const eventsModalModule = await import('./events-modal.js');
                this.modules.eventsModal = eventsModalModule;
                window.eventsModal = eventsModalModule;
                console.log("✅ Events modal module loaded successfully");
            } catch (eventError) {
                console.error("❌ Error loading events modal module:", eventError);
            }
            
            // Load QR scanner
            const qrModule = await import('./qr-scanner.js');
            this.modules.qrScanner = qrModule;
            window.qrScanner = qrModule;
            
            console.log('✅ All modules loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading modules:', error);
            throw error;
        }
    }

    // New method to load modal HTML from external files
    async addModalsToPage() {
        console.log('Adding modals to page...');
        
        try {
            // Load all modal HTML files
            const modalFiles = [
                { name: 'equipment-modal.html', required: true },
                { name: 'borrow-modal.html', required: true },
                { name: 'return-modal.html', required: true },
                { name: 'events-modal.html', required: true },
                { name: 'qr-modal.html', required: false },
                { name: 'loading-toast.html', required: true }
            ];
            
            for (const modal of modalFiles) {
                try {
                    const response = await fetch(`modals/${modal.name}`);
                    if (!response.ok) {
                        throw new Error(`Failed to load ${modal.name}: ${response.status} ${response.statusText}`);
                    }
                    
                    const html = await response.text();
                    document.body.insertAdjacentHTML('beforeend', html);
                    console.log(`✅ Added ${modal.name} to page`);
                } catch (modalError) {
                    console.error(`❌ Error adding ${modal.name} to page:`, modalError);
                    if (modal.required) {
                        throw modalError; // Re-throw if this modal is required
                    }
                }
            }
            
            console.log('✅ All modals added to page');
            return true;
        } catch (error) {
            console.error('❌ Error adding modals to page:', error);
            return false;
        }
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
                this.modules.dashboard.loadEventItems?.();
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