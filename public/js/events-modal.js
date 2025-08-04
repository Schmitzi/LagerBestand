// js/events-modal.js - Events modal functionality (FIXED)

import { 
    getFormData, 
    validateEventsForm, 
    createEvent, 
    updateEvent 
} from './utils.js';

let eventsModal, eventsForm;

function initializeElements() {
    eventsModal = document.getElementById('eventsModal');
    eventsForm = document.getElementById('eventsForm');
}

function setupEventListeners() {
    if (!eventsModal) return;

    // Close modal event listeners
    document.getElementById('closeEventsModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelEventBtn')?.addEventListener('click', closeModal);

    // Close modal when clicking outside
    eventsModal.addEventListener('click', (event) => {
        if (event.target === eventsModal) {
            closeModal();
        }
    });

    // Form submission
    eventsForm?.addEventListener('submit', handleSubmission);

    // Handle ESC key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !eventsModal?.classList.contains('hidden')) {
            closeModal();
        }
    });
}

export function openModal(item = null) {
    initializeElements();
    
    if (!eventsModal) {
        console.error('Events modal not found');
        return;
    }
    
    console.log('Opening events modal...');
    
    // Set edit mode
    window.appState.currentEditId = item ? item.id : null;
    
    // Update modal title and button text
    const modalTitle = document.getElementById('eventsModalTitle');
    const submitBtn = document.getElementById('submitEventsBtn');
    
    if (item) {
        modalTitle.textContent = 'Edit Event';
        submitBtn.textContent = 'Update Event';
        fillEventsForm(item);
    } else {
        modalTitle.textContent = 'Add Event';
        submitBtn.textContent = 'Add Event';
        eventsForm?.reset();
        setDefaultDates();
    }
    
    eventsModal.classList.remove('hidden');
    eventsModal.classList.add('flex');
    
    // Focus on first input
    const firstInput = eventsForm?.querySelector('input');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
    
    // Setup event listeners if not already done
    if (!eventsModal.dataset.initialized) {
        setupEventListeners();
        eventsModal.dataset.initialized = 'true';
    }
}

export function closeModal() {
    if (!eventsModal) return;
    
    eventsModal.classList.add('hidden');
    eventsModal.classList.remove('flex');
    
    // Reset form and state
    eventsForm?.reset();
    window.appState.currentEditId = null;
    
    // Reset button state if it was in loading state
    const submitBtn = eventsForm?.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Add Event';
    }
}

async function handleSubmission(event) {
    event.preventDefault();
    
    if (!eventsForm) return;
    
    const data = getFormData(eventsForm);
    console.log('Form data collected:', data); // Debug log
    
    if (!validateEventsForm(data)) {
        return;
    }
    
    // Show loading state
    const submitBtn = eventsForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
    
    try {
        let success = false;
        
        if (window.appState.currentEditId) {
            success = await updateEvent(window.appState.currentEditId, data);
        } else {
            success = await createEvent(data);
        }
        
        if (success) {
            closeModal();
        }
    } catch (error) {
        console.error('Event submission error:', error);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function fillEventsForm(item) {
    if (!item || !eventsForm) return;
    
    // Use the correct IDs that match the HTML
    const eventNameInput = document.getElementById('eventName');
    const eventIdInput = document.getElementById('eventId');
    const eventDescriptionInput = document.getElementById('eventDescription');
    const locationInput = document.getElementById('location');
    const managedByInput = document.getElementById('managedBy');
    const beginDateInput = document.getElementById('beginDate');
    const endDateInput = document.getElementById('endDate');
    
    if (eventNameInput) eventNameInput.value = item.name || '';
    if (eventIdInput) eventIdInput.value = item.event_id || '';
    if (eventDescriptionInput) eventDescriptionInput.value = item.description || '';
    if (locationInput) locationInput.value = item.location || '';
    if (managedByInput) managedByInput.value = item.managed_by || '';
    if (beginDateInput) beginDateInput.value = item.begin_date || '';
    if (endDateInput) endDateInput.value = item.end_date || '';
}

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const beginDateInput = document.getElementById('beginDate');
    const endDateInput = document.getElementById('endDate');
    
    if (beginDateInput && !beginDateInput.value) {
        beginDateInput.value = today;
    }
    if (endDateInput && !endDateInput.value) {
        endDateInput.value = nextWeek;
    }
}

console.log('✅ Events modal module loaded');