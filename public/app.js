// Equipment Borrowing System JavaScript

// Configuration
const API_BASE = '/api';

// Global state
let currentEditId = null;
let equipment = [];
let borrowings = [];
let overdueItems = [];
let currentView = 'equipment';

// DOM elements
let equipmentModal, borrowModal, returnModal, loading, toast;
let equipmentForm, borrowForm, returnForm;
let equipmentTable, borrowingsTable, overdueTable;
let searchInput;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('Equipment Borrowing System loading...');
    initializeElements();
    loadData();
    setupEventListeners();
    setupTabNavigation();
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const borrowingDateInput = document.getElementById('borrowingDate');
    const expectedReturnDateInput = document.getElementById('expectedReturnDate');
    const actualReturnDateInput = document.getElementById('actualReturnDate');
    
    if (borrowingDateInput) borrowingDateInput.value = today;
    if (expectedReturnDateInput) expectedReturnDateInput.value = nextWeek;
    if (actualReturnDateInput) actualReturnDateInput.value = today;
});

function initializeElements() {
    // Modals
    equipmentModal = document.getElementById('equipmentModal');
    borrowModal = document.getElementById('borrowModal');
    returnModal = document.getElementById('returnModal');
    loading = document.getElementById('loading');
    toast = document.getElementById('toast');
    
    // Forms
    equipmentForm = document.getElementById('equipmentForm');
    borrowForm = document.getElementById('borrowForm');
    returnForm = document.getElementById('returnForm');
    
    // Tables
    equipmentTable = document.getElementById('equipmentTable');
    borrowingsTable = document.getElementById('borrowingsTable');
    overdueTable = document.getElementById('overdueTable');
    
    // Other elements
    searchInput = document.getElementById('searchInput');
    
    console.log('Elements initialized');
}

function setupEventListeners() {
    // Header buttons
    document.getElementById('addEquipmentBtn')?.addEventListener('click', () => openEquipmentModal());
    document.getElementById('borrowBtn')?.addEventListener('click', () => openBorrowModal());
    document.getElementById('returnBtn')?.addEventListener('click', () => openReturnModal());
    
    // Equipment modal
    document.getElementById('closeEquipmentModal')?.addEventListener('click', closeEquipmentModal);
    document.getElementById('cancelEquipmentBtn')?.addEventListener('click', closeEquipmentModal);
    equipmentForm?.addEventListener('submit', handleEquipmentSubmit);
    
    // Borrow modal
    document.getElementById('closeBorrowModal')?.addEventListener('click', closeBorrowModal);
    document.getElementById('cancelBorrowBtn')?.addEventListener('click', closeBorrowModal);
    borrowForm?.addEventListener('submit', handleBorrowSubmit);
    
    // Return modal
    document.getElementById('closeReturnModal')?.addEventListener('click', closeReturnModal);
    document.getElementById('cancelReturnBtn')?.addEventListener('click', closeReturnModal);
    returnForm?.addEventListener('submit', handleReturnSubmit);
    
    // Toast
    document.getElementById('closeToast')?.addEventListener('click', hideToast);
    
    // Search
    searchInput?.addEventListener('input', handleSearch);
    
    console.log('Event listeners set up');
}

function setupTabNavigation() {
    document.getElementById('equipmentTab')?.addEventListener('click', () => switchTab('equipment'));
    document.getElementById('borrowingsTab')?.addEventListener('click', () => switchTab('borrowings'));
    document.getElementById('overdueTab')?.addEventListener('click', () => switchTab('overdue'));
}

function switchTab(view) {
    currentView = view;
    
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
    if (view === 'borrowings') {
        loadBorrowings();
    } else if (view === 'overdue') {
        loadOverdueItems();
    }
}

// API functions
async function apiCall(endpoint, options = {}) {
    showLoading();
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showToast('error', 'Connection error: ' + error.message);
        throw error;
    } finally {
        hideLoading();
    }
}

async function loadData() {
    await Promise.all([
        loadEquipment(),
        loadDashboardStats()
    ]);
}

async function loadEquipment() {
    try {
        const result = await apiCall('/equipment');
        equipment = result.data || [];
        renderEquipment(equipment);
        populateEquipmentDropdown();
    } catch (error) {
        console.error('Failed to load equipment:', error);
    }
}

async function loadBorrowings() {
    try {
        console.log('Loading current borrowings...');
        const result = await apiCall('/borrowings/current');
        borrowings = result.data || [];
        console.log('Loaded borrowings:', borrowings.length, borrowings);
        renderBorrowings(borrowings);
        populateReturnDropdown();
    } catch (error) {
        console.error('Failed to load borrowings:', error);
    }
}

async function loadOverdueItems() {
    try {
        const result = await apiCall('/borrowings/overdue');
        overdueItems = result.data || [];
        renderOverdueItems(overdueItems);
    } catch (error) {
        console.error('Failed to load overdue items:', error);
    }
}

async function loadDashboardStats() {
    try {
        const result = await apiCall('/dashboard');
        if (result.success && result.data) {
            updateDashboardStats(result.data);
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
    }
}

// Rendering functions
function renderEquipment(items) {
    if (!equipmentTable) return;
    
    if (items.length === 0) {
        equipmentTable.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-video text-4xl mb-4 block text-gray-300"></i>
                    <p class="text-lg">No equipment found</p>
                    <p class="text-sm">Add your first equipment to get started</p>
                </td>
            </tr>
        `;
        return;
    }
    
    equipmentTable.innerHTML = items.map(item => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
                <div>
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(item.name)}</div>
                    ${item.description ? `<div class="text-sm text-gray-500">${escapeHtml(item.description)}</div>` : ''}
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ${escapeHtml(item.rubric)}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <span class="text-sm font-medium ${getAvailabilityColor(item)}">
                        ${item.available_count}/${item.total_count} available
                    </span>
                    <div class="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div class="bg-green-600 h-2 rounded-full" style="width: ${(item.available_count/item.total_count)*100}%"></div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center text-sm text-gray-900">
                    <i class="fas fa-warehouse text-gray-400 mr-1"></i>
                    ${escapeHtml(item.storage_area)}
                </span>
            </td>
            <td class="px-6 py-4 text-sm font-medium">
                <div class="flex space-x-2">
                    <button 
                        onclick="editEquipment('${item.id}')" 
                        class="action-btn text-blue-600 hover:text-blue-900"
                        title="Edit equipment"
                    >
                        <i class="fas fa-edit"></i>
                    </button>
                    <button 
                        onclick="deleteEquipment('${item.id}', '${escapeHtml(item.name)}')" 
                        class="action-btn text-red-600 hover:text-red-900"
                        title="Delete equipment"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                    ${item.available_count > 0 ? `
                        <button 
                            onclick="quickBorrow('${item.id}')" 
                            class="action-btn text-green-600 hover:text-green-900"
                            title="Quick borrow"
                        >
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function renderBorrowings(items) {
    if (!borrowingsTable) return;
    
    if (items.length === 0) {
        borrowingsTable.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-clipboard-list text-4xl mb-4 block text-gray-300"></i>
                    <p class="text-lg">No active borrowings</p>
                    <p class="text-sm">All equipment is currently available</p>
                </td>
            </tr>
        `;
        return;
    }
    
    borrowingsTable.innerHTML = items.map(item => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
                <div>
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(item.equipment_name)}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(item.equipment_rubric)}</div>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-900">${escapeHtml(item.borrower_name)}</div>
            </td>
            <td class="px-6 py-4">
                <div>
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(item.event_name)}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(item.event_location)}</div>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${formatDate(item.borrowing_date)}
            </td>
            <td class="px-6 py-4">
                <span class="text-sm ${getDueDateColor(item.expected_return_date)}">
                    ${formatDate(item.expected_return_date)}
                </span>
            </td>
            <td class="px-6 py-4 text-sm font-medium">
                <button 
                    onclick="returnEquipment('${item.id}')" 
                    class="action-btn text-orange-600 hover:text-orange-900"
                    title="Return equipment"
                >
                    <i class="fas fa-arrow-left mr-1"></i>
                    Return
                </button>
            </td>
        </tr>
    `).join('');
}

function renderOverdueItems(items) {
    if (!overdueTable) return;
    
    if (items.length === 0) {
        overdueTable.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-check-circle text-4xl mb-4 block text-green-300"></i>
                    <p class="text-lg">No overdue items</p>
                    <p class="text-sm">All borrowed equipment is returned on time!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    overdueTable.innerHTML = items.map(item => `
        <tr class="hover:bg-red-50 transition-colors bg-red-25">
            <td class="px-6 py-4">
                <div>
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(item.equipment_name)}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(item.equipment_rubric)}</div>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-900">${escapeHtml(item.borrower_name)}</div>
            </td>
            <td class="px-6 py-4">
                <div>
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(item.event_name)}</div>
                    <div class="text-xs text-gray-500">${escapeHtml(item.event_location)}</div>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-red-600 font-medium">
                ${formatDate(item.expected_return_date)}
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ${getDaysOverdue(item.expected_return_date)} days
                </span>
            </td>
            <td class="px-6 py-4 text-sm font-medium">
                <button 
                    onclick="returnEquipment('${item.id}')" 
                    class="action-btn text-red-600 hover:text-red-900"
                    title="Return overdue equipment"
                >
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    Return Now
                </button>
            </td>
        </tr>
    `).join('');
}

function populateEquipmentDropdown() {
    const select = document.getElementById('borrowEquipment');
    if (!select) return;
    
    const availableEquipment = equipment.filter(item => item.available_count > 0);
    
    select.innerHTML = `
        <option value="">Select equipment to borrow</option>
        ${availableEquipment.map(item => `
            <option value="${item.id}">
                ${escapeHtml(item.name)} (${item.available_count}/${item.total_count} available) - ${escapeHtml(item.rubric)}
            </option>
        `).join('')}
    `;
}

function populateReturnDropdown() {
    const select = document.getElementById('returnBorrowing');
    if (!select) return;
    
    console.log('Populating return dropdown with borrowings:', borrowings.length);
    
    if (borrowings.length === 0) {
        select.innerHTML = `<option value="">No items currently borrowed</option>`;
        return;
    }
    
    select.innerHTML = `
        <option value="">Select item to return</option>
        ${borrowings.map(item => `
            <option value="${item.id}">
                ${escapeHtml(item.equipment_name)} → ${escapeHtml(item.borrower_name)} (${escapeHtml(item.event_name)}) - Due: ${formatDate(item.expected_return_date)}
            </option>
        `).join('')}
    `;
}

// Modal functions
function openEquipmentModal(item = null) {
    currentEditId = item ? item.id : null;
    const modalTitle = document.getElementById('equipmentModalTitle');
    const submitBtn = document.getElementById('submitEquipmentBtn');
    
    if (item) {
        modalTitle.textContent = 'Edit Equipment';
        submitBtn.textContent = 'Update Equipment';
        fillEquipmentForm(item);
    } else {
        modalTitle.textContent = 'Add Equipment';
        submitBtn.textContent = 'Add Equipment';
        equipmentForm.reset();
    }
    
    equipmentModal.classList.remove('hidden');
    equipmentModal.classList.add('flex');
}

function closeEquipmentModal() {
    equipmentModal.classList.add('hidden');
    equipmentModal.classList.remove('flex');
    currentEditId = null;
    equipmentForm.reset();
}

function openBorrowModal() {
    console.log('Opening borrow modal, available equipment:', equipment.filter(item => item.available_count > 0).length);
    populateEquipmentDropdown();
    borrowModal.classList.remove('hidden');
    borrowModal.classList.add('flex');
}

function closeBorrowModal() {
    borrowModal.classList.add('hidden');
    borrowModal.classList.remove('flex');
    borrowForm.reset();
}

function openReturnModal() {
    console.log('Opening return modal, loading borrowings first...');
    // Load borrowings data first, then populate dropdown
    loadBorrowings().then(() => {
        populateReturnDropdown();
        returnModal.classList.remove('hidden');
        returnModal.classList.add('flex');
    }).catch(error => {
        console.error('Failed to load borrowings for return modal:', error);
        showToast('error', 'Failed to load borrowed items');
    });
}

function closeReturnModal() {
    returnModal.classList.add('hidden');
    returnModal.classList.remove('flex');
    returnForm.reset();
}

// Form handlers
async function handleEquipmentSubmit(e) {
    e.preventDefault();
    const data = getFormData(equipmentForm);
    
    if (!validateEquipmentForm(data)) return;
    
    if (currentEditId) {
        await updateEquipment(currentEditId, data);
    } else {
        await createEquipment(data);
    }
}

async function handleBorrowSubmit(e) {
    e.preventDefault();
    const data = getFormData(borrowForm);
    
    if (!validateBorrowForm(data)) return;
    
    await borrowEquipment(data);
}

async function handleReturnSubmit(e) {
    e.preventDefault();
    const data = getFormData(returnForm);
    
    if (!data.borrowing_id) {
        showToast('error', 'Please select an item to return');
        return;
    }
    
    await returnEquipmentItem(data.borrowing_id, data);
}

// CRUD operations
async function createEquipment(data) {
    try {
        const result = await apiCall('/equipment', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (result.success) {
            showToast('success', 'Equipment added successfully!');
            await loadData();
            closeEquipmentModal();
        } else {
            showToast('error', result.error || 'Failed to add equipment');
        }
    } catch (error) {
        console.error('Failed to create equipment:', error);
    }
}

async function updateEquipment(id, data) {
    try {
        const result = await apiCall(`/equipment/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (result.success) {
            showToast('success', 'Equipment updated successfully!');
            await loadData();
            closeEquipmentModal();
        } else {
            showToast('error', result.error || 'Failed to update equipment');
        }
    } catch (error) {
        console.error('Failed to update equipment:', error);
    }
}

async function borrowEquipment(data) {
    try {
        const result = await apiCall('/borrowings', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (result.success) {
            showToast('success', 'Equipment borrowed successfully!');
            await loadData();
            if (currentView === 'borrowings') await loadBorrowings();
            closeBorrowModal();
        } else {
            showToast('error', result.error || 'Failed to borrow equipment');
        }
    } catch (error) {
        console.error('Failed to borrow equipment:', error);
    }
}

async function returnEquipmentItem(borrowingId, data) {
    try {
        const result = await apiCall(`/borrowings/${borrowingId}/return`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (result.success) {
            showToast('success', 'Equipment returned successfully!');
            await loadData();
            if (currentView === 'borrowings') await loadBorrowings();
            if (currentView === 'overdue') await loadOverdueItems();
            closeReturnModal();
        } else {
            showToast('error', result.error || 'Failed to return equipment');
        }
    } catch (error) {
        console.error('Failed to return equipment:', error);
    }
}

// Utility functions
function fillEquipmentForm(item) {
    document.getElementById('equipmentName').value = item.name || '';
    document.getElementById('equipmentDescription').value = item.description || '';
    document.getElementById('totalCount').value = item.total_count || '';
    document.getElementById('storageArea').value = item.storage_area || '';
    document.getElementById('rubric').value = item.rubric || '';
}

function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string' && value.trim() !== '') {
            if (key === 'total_count') {
                data[key] = parseInt(value);
            } else {
                data[key] = value.trim();
            }
        }
    }
    
    return data;
}

function validateEquipmentForm(data) {
    const required = ['name', 'total_count', 'storage_area', 'rubric'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
        showToast('error', `Please fill in: ${missing.join(', ')}`);
        return false;
    }
    
    if (data.total_count < 1) {
        showToast('error', 'Total count must be at least 1');
        return false;
    }
    
    return true;
}

function validateBorrowForm(data) {
    const required = ['equipment_id', 'borrower_name', 'event_name', 'event_location', 'borrowing_date', 'expected_return_date'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
        showToast('error', `Please fill in: ${missing.join(', ')}`);
        return false;
    }
    
    if (new Date(data.expected_return_date) <= new Date(data.borrowing_date)) {
        showToast('error', 'Return date must be after borrowing date');
        return false;
    }
    
    return true;
}

function updateDashboardStats(stats) {
    document.getElementById('totalEquipment').textContent = stats.total_equipment_types || 0;
    document.getElementById('availableItems').textContent = stats.available_items || 0;
    document.getElementById('borrowedItems').textContent = stats.borrowed_items || 0;
    document.getElementById('overdueItems').textContent = stats.overdue_borrowings || 0;
    document.getElementById('activeEvents').textContent = stats.active_borrowings || 0;
    document.getElementById('totalItems').textContent = stats.total_items || 0;
}

function getAvailabilityColor(item) {
    const ratio = item.available_count / item.total_count;
    if (ratio === 0) return 'text-red-600';
    if (ratio < 0.5) return 'text-yellow-600';
    return 'text-green-600';
}

function getDueDateColor(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600 font-medium';
    if (diffDays <= 2) return 'text-yellow-600 font-medium';
    return 'text-gray-900';
}

function getDaysOverdue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.ceil((today - due) / (1000 * 60 * 60 * 24));
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading() {
    if (loading) {
        loading.classList.remove('hidden');
        loading.classList.add('flex');
    }
}

function hideLoading() {
    if (loading) {
        loading.classList.add('hidden');
        loading.classList.remove('flex');
    }
}

function showToast(type, message) {
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toastIcon || !toastMessage || !toast) return;
    
    if (type === 'success') {
        toastIcon.innerHTML = '<i class="fas fa-check-circle text-green-500"></i>';
    } else {
        toastIcon.innerHTML = '<i class="fas fa-exclamation-circle text-red-500"></i>';
    }
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => hideToast(), 5000);
}

function hideToast() {
    if (toast) {
        toast.classList.add('hidden');
    }
}

function handleSearch(e) {
    const query = e.target.value;
    // Implement search functionality based on current view
    console.log('Search:', query);
}

// Global functions for onclick handlers
window.editEquipment = function(id) {
    const item = equipment.find(e => e.id === id);
    if (item) {
        openEquipmentModal(item);
    }
};

window.deleteEquipment = function(id, name) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
        deleteEquipmentItem(id);
    }
};

window.quickBorrow = function(equipmentId) {
    const equipmentSelect = document.getElementById('borrowEquipment');
    if (equipmentSelect) {
        equipmentSelect.value = equipmentId;
    }
    openBorrowModal();
};

window.returnEquipment = function(borrowingId) {
    // Load borrowings first, then open modal with pre-selection
    loadBorrowings().then(() => {
        populateReturnDropdown();
        const returnSelect = document.getElementById('returnBorrowing');
        if (returnSelect) {
            returnSelect.value = borrowingId;
        }
        returnModal.classList.remove('hidden');
        returnModal.classList.add('flex');
    });
};

async function deleteEquipmentItem(id) {
    try {
        const result = await apiCall(`/equipment/${id}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            showToast('success', 'Equipment deleted successfully!');
            await loadData();
        } else {
            showToast('error', result.error || 'Failed to delete equipment');
        }
    } catch (error) {
        console.error('Failed to delete equipment:', error);
    }
}

console.log('Equipment Borrowing System loaded successfully!');