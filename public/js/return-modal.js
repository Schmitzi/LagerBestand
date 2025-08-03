// js/return-modal.js - Return modal functionality

import { getFormData, returnEquipmentItem, showToast } from './utils.js';

let returnModal, returnForm;

function initializeElements() {
    returnModal = document.getElementById('returnModal');
    returnForm = document.getElementById('returnForm');
}

function setupEventListeners() {
    if (!returnModal) return;

    // Close modal event listeners
    document.getElementById('closeReturnModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelReturnBtn')?.addEventListener('click', closeModal);

    // Close modal when clicking outside
    returnModal.addEventListener('click', (event) => {
        if (event.target === returnModal) {
            closeModal();
        }
    });

    // Form submission
    returnForm?.addEventListener('submit', handleSubmission);

    // Handle ESC key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !returnModal?.classList.contains('hidden')) {
            closeModal();
        }
    });
}

export function openModal() {
    initializeElements();
    
    if (!returnModal) {
        console.error('Return modal not found');
        return;
    }
    
    console.log('Opening return modal, loading borrowings first...');
    
    // Load borrowings data first, then populate dropdown
    if (window.dashboard?.loadBorrowings) {
        window.dashboard.loadBorrowings().then(() => {
            populateReturnDropdown();
            showModal();
        }).catch(error => {
            console.error('Failed to load borrowings for return modal:', error);
            showToast('error', 'Failed to load borrowed items');
        });
    } else {
        // Fallback if dashboard not available
        populateReturnDropdown();
        showModal();
    }
}

export function openModalWithSelection(borrowingId) {
    initializeElements();
    
    if (!returnModal) {
        console.error('Return modal not found');
        return;
    }
    
    // Load borrowings first, then open modal with pre-selection
    if (window.dashboard?.loadBorrowings) {
        window.dashboard.loadBorrowings().then(() => {
            populateReturnDropdown();
            
            // Pre-select the borrowing
            const returnSelect = document.getElementById('returnBorrowing');
            if (returnSelect) {
                returnSelect.value = borrowingId;
            }
            
            showModal();
        });
    } else {
        // Fallback
        populateReturnDropdown();
        
        const returnSelect = document.getElementById('returnBorrowing');
        if (returnSelect) {
            returnSelect.value = borrowingId;
        }
        
        showModal();
    }
}

function showModal() {
    // Reset form
    returnForm?.reset();
    
    // Set default return date
    setDefaultReturnDate();
    
    returnModal.classList.remove('hidden');
    returnModal.classList.add('flex');
    
    // Focus on first input
    const firstSelect = returnForm?.querySelector('select');
    if (firstSelect) {
        setTimeout(() => firstSelect.focus(), 100);
    }
    
    // Setup event listeners if not already done
    if (!returnModal.dataset.initialized) {
        setupEventListeners();
        returnModal.dataset.initialized = 'true';
    }
}

export function closeModal() {
    if (!returnModal) return;
    
    returnModal.classList.add('hidden');
    returnModal.classList.remove('flex');
    
    // Reset form
    returnForm?.reset();
    
    // Reset button state if it was in loading state
    const submitBtn = returnForm?.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Return Equipment';
    }
}

async function handleSubmission(event) {
    event.preventDefault();
    
    if (!returnForm) return;
    
    const data = getFormData(returnForm);
    
    if (!data.borrowing_id) {
        showToast('error', 'Please select an item to return');
        return;
    }
    
    if (!data.returner_name) {
        showToast('error', 'Please enter who is returning the item');
        return;
    }
    
    if (!data.actual_return_date) {
        showToast('error', 'Please enter the return date');
        return;
    }
    
    // Show loading state
    const submitBtn = returnForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Returning...';
    
    try {
        const success = await returnEquipmentItem(data.borrowing_id, data);
        
        if (success) {
            closeModal();
        }
    } catch (error) {
        console.error('Return submission error:', error);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function populateReturnDropdown() {
    const select = document.getElementById('returnBorrowing');
    if (!select) return;
    
    console.log('Populating return dropdown with borrowings:', window.appState.borrowings.length);
    
    if (window.appState.borrowings.length === 0) {
        select.innerHTML = `<option value="">No items currently borrowed</option>`;
        return;
    }
    
    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString();
    };
    
    select.innerHTML = `
        <option value="">Select item to return</option>
        ${window.appState.borrowings.map(item => `
            <option value="${item.id}">
                ${escapeHtml(item.equipment_name)} → ${escapeHtml(item.borrower_name)} (${escapeHtml(item.event_name)}) - Due: ${formatDate(item.expected_return_date)}
            </option>
        `).join('')}
    `;
}

function setDefaultReturnDate() {
    const returnDate = document.getElementById('actualReturnDate');
    if (returnDate && !returnDate.value) {
        returnDate.value = new Date().toISOString().split('T')[0];
    }
}

console.log('✅ Return modal module loaded');