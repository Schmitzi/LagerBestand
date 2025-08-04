// js/equipment-modal.js - Equipment modal functionality

import { 
    getFormData, 
    validateEquipmentForm, 
    createEquipment, 
    updateEquipment 
} from './utils.js';

let equipmentModal, equipmentForm;

function initializeElements() {
    equipmentModal = document.getElementById('equipmentModal');
    equipmentForm = document.getElementById('equipmentForm');
}

function setupEventListeners() {
    if (!equipmentModal) return;

    // Close modal event listeners
    document.getElementById('closeEquipmentModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelEquipmentBtn')?.addEventListener('click', closeModal);

    // Close modal when clicking outside
    equipmentModal.addEventListener('click', (event) => {
        if (event.target === equipmentModal) {
            closeModal();
        }
    });

    // Form submission
    equipmentForm?.addEventListener('submit', handleSubmission);

    // Handle ESC key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !equipmentModal?.classList.contains('hidden')) {
            closeModal();
        }
    });
}

export function openModal(item = null) {
    initializeElements();
    
    if (!equipmentModal) {
        console.error('Equipment modal not found');
        return;
    }
    
    console.log('Opening equipment modal...');
    
    // Set edit mode
    window.appState.currentEditId = item ? item.id : null;
    
    // Update modal title and button text
    const modalTitle = document.getElementById('equipmentModalTitle');
    const submitBtn = document.getElementById('submitEquipmentBtn');
    
    if (item) {
        modalTitle.textContent = 'Edit Equipment';
        submitBtn.textContent = 'Update Equipment';
        fillEquipmentForm(item);
    } else {
        modalTitle.textContent = 'Add Equipment';
        submitBtn.textContent = 'Add Equipment';
        equipmentForm?.reset();
    }
    
    equipmentModal.classList.remove('hidden');
    equipmentModal.classList.add('flex');
    
    // Focus on first input
    const firstInput = equipmentForm?.querySelector('input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
    
    // Setup event listeners if not already done
    if (!equipmentModal.dataset.initialized) {
        setupEventListeners();
        equipmentModal.dataset.initialized = 'true';
    }
}

export function closeModal() {
    if (!equipmentModal) return;
    
    equipmentModal.classList.add('hidden');
    equipmentModal.classList.remove('flex');
    
    // Reset form and state
    equipmentForm?.reset();
    window.appState.currentEditId = null;
    
    // Reset button state if it was in loading state
    const submitBtn = equipmentForm?.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Add Equipment';
    }
}

async function handleSubmission(event) {
    event.preventDefault();
    
    if (!equipmentForm) return;
    
    const data = getFormData(equipmentForm);
    
    if (!validateEquipmentForm(data)) {
        return;
    }
    
    // Show loading state
    const submitBtn = equipmentForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
    
    try {
        let success = false;
        
        if (window.appState.currentEditId) {
            success = await updateEquipment(window.appState.currentEditId, data);
        } else {
            success = await createEquipment(data);
        }
        
        if (success) {
            closeModal();
        }
    } catch (error) {
        console.error('Equipment submission error:', error);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function fillEquipmentForm(item) {
    if (!item || !equipmentForm) return;
    
    document.getElementById('equipmentName').value = item.name || '';
    document.getElementById('equipmentDescription').value = item.description || '';
    document.getElementById('totalCount').value = item.total_count || '';
    document.getElementById('storageArea').value = item.storage_area || '';
    document.getElementById('rubric').value = item.rubric || '';
}

console.log('✅ Equipment modal module loaded');