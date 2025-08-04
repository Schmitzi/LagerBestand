import { 
    getFormData, 
    validateBorrowForm, 
    borrowEquipment 
} from './utils.js';

let borrowModal, borrowForm;

function initializeElements() {
    borrowModal = document.getElementById('borrowModal');
    borrowForm = document.getElementById('borrowForm');
}

function setupEventListeners() {
    if (!borrowModal) return;

    // Close modal event listeners
    document.getElementById('closeBorrowModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelBorrowBtn')?.addEventListener('click', closeModal);

    // Close modal when clicking outside
    borrowModal.addEventListener('click', (event) => {
        if (event.target === borrowModal) {
            closeModal();
        }
    });

    // Form submission
    borrowForm?.addEventListener('submit', handleSubmission);

    // Handle ESC key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !borrowModal?.classList.contains('hidden')) {
            closeModal();
        }
    });

    // QR scan button
    document.getElementById('scan-qr-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('QR scan button clicked');
        
        // Import and use QR scanner
        import('./qr-scanner.js').then(qrModule => {
            if (qrModule.openModal) {
                qrModule.openModal();
            } else {
                console.error('QR scanner openModal function not found');
            }
        }).catch(error => {
            console.error('Failed to load QR scanner:', error);
        });
    });

    // Event selection change handler
    document.getElementById('eventSelect')?.addEventListener('change', (e) => {
        const selectedEventId = e.target.value;
        const eventNameField = document.getElementById('eventName');
        const eventLocationField = document.getElementById('eventLocation');
        
        if (selectedEventId && window.appState.events) {
            const selectedEvent = window.appState.events.find(event => event.id === selectedEventId);
            if (selectedEvent) {
                // Update hidden field for backward compatibility
                if (eventNameField) {
                    eventNameField.value = selectedEvent.name;
                }
                // Auto-fill event location
                if (eventLocationField) {
                    eventLocationField.value = selectedEvent.location;
                }
            }
        } else {
            // Clear fields if no event selected
            if (eventNameField) eventNameField.value = '';
            if (eventLocationField) eventLocationField.value = '';
        }
    });

    // Add new event button
    document.getElementById('add-event-from-borrow')?.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Add Event from Borrow button clicked');
        
        // Open events modal
        if (window.eventsModal?.openModal) {
            window.eventsModal.openModal();
        } else {
            console.error('Events modal not available');
        }
    });
}

export async function openModal() {
    initializeElements();
    
    if (!borrowModal) {
        console.error('Borrow modal not found');
        return;
    }
    
    console.log('Opening borrow modal, loading data...');
    
    // Load events and equipment data
    await loadModalData();
    
    // Populate dropdowns
    populateEquipmentDropdown();
    populateEventsDropdown();
    
    // Reset form
    borrowForm?.reset();
    
    // Set default dates
    setDefaultDates();
    
    borrowModal.classList.remove('hidden');
    borrowModal.classList.add('flex');
    
    // Focus on first input
    const firstInput = borrowForm?.querySelector('select');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
    
    // Setup event listeners if not already done
    if (!borrowModal.dataset.initialized) {
        setupEventListeners();
        borrowModal.dataset.initialized = 'true';
    }
}

async function loadModalData() {
    try {
        console.log('Loading data for borrow modal...');
        
        // Load events if not already loaded or if empty
        if (!window.appState.events || window.appState.events.length === 0) {
            if (window.dashboard?.loadEventItems) {
                await window.dashboard.loadEventItems();
            }
        }
        
        // Load equipment if not already loaded or if empty
        if (!window.appState.equipment || window.appState.equipment.length === 0) {
            if (window.dashboard?.loadEquipment) {
                await window.dashboard.loadEquipment();
            }
        }
        
        console.log(`✅ Modal data loaded: ${window.appState.events?.length || 0} events, ${window.appState.equipment?.length || 0} equipment`);
    } catch (error) {
        console.error('Failed to load modal data:', error);
    }
}

export function closeModal() {
    if (!borrowModal) return;
    
    borrowModal.classList.add('hidden');
    borrowModal.classList.remove('flex');
    
    // Reset form
    borrowForm?.reset();
    
    // Reset button state if it was in loading state
    const submitBtn = borrowForm?.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Borrow Equipment';
    }
}

async function handleSubmission(event) {
    event.preventDefault();
    
    if (!borrowForm) return;
    
    const data = getFormData(borrowForm);
    
    // Special handling for event selection
    const eventSelect = document.getElementById('eventSelect');
    const eventNameField = document.getElementById('eventName');
    
    if (eventSelect && eventSelect.value) {
        // If event is selected from dropdown, ensure event_name is set
        const selectedEvent = window.appState.events?.find(e => e.id === eventSelect.value);
        if (selectedEvent) {
            data.event_name = selectedEvent.name;
        }
    }
    
    if (!validateBorrowForm(data)) {
        return;
    }
    
    // Show loading state
    const submitBtn = borrowForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Borrowing...';
    
    try {
        const success = await borrowEquipment(data);
        
        if (success) {
            closeModal();
        }
    } catch (error) {
        console.error('Borrow submission error:', error);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const borrowingDateInput = document.getElementById('borrowingDate');
    const expectedReturnDateInput = document.getElementById('expectedReturnDate');
    
    if (borrowingDateInput && !borrowingDateInput.value) {
        borrowingDateInput.value = today;
    }
    if (expectedReturnDateInput && !expectedReturnDateInput.value) {
        expectedReturnDateInput.value = nextWeek;
    }
}

function populateEquipmentDropdown() {
    const select = document.getElementById('borrowEquipment');
    if (!select) return;
    
    const availableEquipment = window.appState.equipment?.filter(item => item.available_count > 0) || [];
    
    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    select.innerHTML = `
        <option value="">Select equipment to borrow</option>
        ${availableEquipment.map(item => `
            <option value="${item.id}">
                ${escapeHtml(item.name)} (${item.available_count}/${item.total_count} available) - ${escapeHtml(item.rubric)}
            </option>
        `).join('')}
    `;
}

function populateEventsDropdown() {
    const select = document.getElementById('eventSelect');
    if (!select) return;
    
    const events = window.appState.events || [];
    
    console.log('Populating events dropdown with:', events.length, 'events');
    
    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    if (events.length === 0) {
        select.innerHTML = `
            <option value="">No events available - create one first</option>
        `;
        return;
    }
    
    select.innerHTML = `
        <option value="">Select an event</option>
        ${events.map(event => `
            <option value="${event.id}">
                ${escapeHtml(event.name)} - ${escapeHtml(event.location)} (${escapeHtml(event.event_id)})
            </option>
        `).join('')}
    `;
}

// Function called by QR scanner when equipment is found
export function selectEquipmentInDropdown(equipment) {
    const equipmentSelect = document.getElementById('borrowEquipment');
    if (!equipmentSelect) return;
    
    console.log('Selecting equipment in dropdown:', equipment);
    
    // Check if equipment is already in dropdown
    let existingOption = equipmentSelect.querySelector(`option[value="${equipment.id}"]`);
    
    if (!existingOption) {
        // Add new option if it doesn't exist
        const newOption = document.createElement('option');
        newOption.value = equipment.id;
        newOption.textContent = `${equipment.name} (${equipment.available_count}/${equipment.total_count} available) - ${equipment.rubric}`;
        equipmentSelect.appendChild(newOption);
    }
    
    // Select the equipment
    equipmentSelect.value = equipment.id;
    
    // Trigger change event if you have listeners
    equipmentSelect.dispatchEvent(new Event('change'));
    
    // Focus on next field
    const borrowerNameInput = document.getElementById('borrowerName');
    if (borrowerNameInput) {
        setTimeout(() => borrowerNameInput.focus(), 100);
    }
}

// Function to refresh events dropdown when new event is added
export function refreshEventsDropdown() {
    console.log('Refreshing events dropdown...');
    populateEventsDropdown();
}

// Global function for quick borrow (called from dashboard)
window.openBorrowModalWithEquipment = function(equipmentId) {
    openModal().then(() => {
        // Pre-select equipment after modal is open
        setTimeout(() => {
            const equipmentSelect = document.getElementById('borrowEquipment');
            if (equipmentSelect) {
                equipmentSelect.value = equipmentId;
                
                // Focus on borrower name field
                const borrowerNameInput = document.getElementById('borrowerName');
                if (borrowerNameInput) {
                    borrowerNameInput.focus();
                }
            }
        }, 100);
    });
};

console.log('✅ Borrow modal module loaded with events integration');