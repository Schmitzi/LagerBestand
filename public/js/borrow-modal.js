// js/borrow-modal.js - Borrow modal functionality with QR integration

import { 
    getFormData, 
    validateBorrowForm, 
    borrowEquipment 
} from './utils.js';

let borrowModal, borrowForm;

export function initialize() {
    borrowModal = document.getElementById('borrowModal');
    borrowForm = document.getElementById('borrowForm');

    if (!borrowModal) {
        console.warn('Borrow modal not found, skipping initialization');
        return;
    }

    setupEventListeners();
    
    // Make modal functions available globally
    window.borrowModal = {
        open: openBorrowModal,
        close: closeBorrowModal,
        selectEquipment: selectEquipmentInDropdown
    };
    
    console.log('✅ Borrow modal module initialized');
}

function setupEventListeners() {
    // Close modal event listeners
    document.getElementById('closeBorrowModal')?.addEventListener('click', closeBorrowModal);
    document.getElementById('cancelBorrowBtn')?.addEventListener('click', closeBorrowModal);

    // Close modal when clicking outside
    borrowModal?.addEventListener('click', (event) => {
        if (event.target === borrowModal) {
            closeBorrowModal();
        }
    });

    // Form submission
    borrowForm?.addEventListener('submit', handleBorrowSubmission);

    // Handle ESC key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !borrowModal?.classList.contains('hidden')) {
            closeBorrowModal();
        }
    });

    // QR scan button
    document.getElementById('scan-qr-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.qrScanner && window.qrScanner.open) {
            window.qrScanner.open();
        }
    });
}

function openBorrowModal() {
    if (!borrowModal) return;
    
    console.log('Opening borrow modal, available equipment:', window.appState.equipment.filter(item => item.available_count > 0).length);
    
    // Populate equipment dropdown
    if (window.dashboard && window.dashboard.populateEquipmentDropdown) {
        window.dashboard.populateEquipmentDropdown();
    }
    
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
}

function closeBorrowModal() {
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

async function handleBorrowSubmission(event) {
    event.preventDefault();
    
    if (!borrowForm) return;
    
    const data = getFormData(borrowForm);
    
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
            closeBorrowModal();
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

// Function called by QR scanner when equipment is found
export function selectEquipmentInDropdown(equipment) {
    const equipmentSelect = document.getElementById('borrowEquipment');
    if (!equipmentSelect) return;
    
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

// Global function for quick borrow (called from dashboard)
window.openBorrowModalWithEquipment = function(equipmentId) {
    openBorrowModal();
    
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
};

console.log('Borrow modal module loaded');