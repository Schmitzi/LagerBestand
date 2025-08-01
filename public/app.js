// Inventory Tracker - Simple JavaScript Version (no modules)

// Configuration
const API_BASE = '/api';

// Global state
let currentEditId = null;
let inventoryItems = [];

// DOM elements
let modal, deleteModal, loading, toast, itemForm, searchInput, inventoryTable;

// Search timeout reference
let searchTimeout;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    loadInventory();
    setupEventListeners();
});

// Helper function to get element by ID with error handling
function getElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.error(`Required element not found: ${id}`);
        return null;
    }
    return element;
}

// Initialize DOM elements
function initializeElements() {
    modal = getElementById('modal');
    deleteModal = getElementById('deleteModal');
    loading = getElementById('loading');
    toast = getElementById('toast');
    itemForm = getElementById('itemForm');
    searchInput = getElementById('searchInput');
    inventoryTable = getElementById('inventoryTable');
}

// Event listeners setup
function setupEventListeners() {
    const addItemBtn = document.getElementById('addItemBtn');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const closeToastBtn = document.getElementById('closeToast');
    
    if (addItemBtn) addItemBtn.addEventListener('click', () => openModal());
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
    if (closeToastBtn) closeToastBtn.addEventListener('click', hideToast);
    
    if (itemForm) itemForm.addEventListener('submit', handleFormSubmit);
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeModal();
        });
    }
    
    if (deleteModal) {
        deleteModal.addEventListener('click', function(e) {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closeDeleteModal();
        }
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            openModal();
        }
    });
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
        showToast('error', 'Connection error. Please check if the server is running.');
        throw error;
    } finally {
        hideLoading();
    }
}

async function loadInventory() {
    try {
        console.log('Loading inventory...');
        const result = await apiCall('/inventory');
        console.log('Inventory loaded:', result);
        inventoryItems = result.data || [];
        renderInventory(inventoryItems);
        updateStats(inventoryItems);
    } catch (error) {
        console.error('Failed to load inventory:', error);
        showToast('error', 'Failed to load inventory items');
    }
}

async function createItem(itemData) {
    try {
        console.log('Creating item:', itemData);
        const result = await apiCall('/inventory', {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
        
        console.log('Create result:', result);
        
        if (result.success) {
            showToast('success', 'Item added successfully!');
            await loadInventory();
            closeModal();
        } else {
            showToast('error', result.error || 'Failed to add item');
        }
    } catch (error) {
        console.error('Failed to create item:', error);
    }
}

async function updateItem(id, itemData) {
    try {
        const result = await apiCall(`/inventory/${id}`, {
            method: 'PUT',
            body: JSON.stringify(itemData)
        });
        
        if (result.success) {
            showToast('success', 'Item updated successfully!');
            await loadInventory();
            closeModal();
        } else {
            showToast('error', result.error || 'Failed to update item');
        }
    } catch (error) {
        console.error('Failed to update item:', error);
    }
}

async function deleteItem(id) {
    try {
        const result = await apiCall(`/inventory/${id}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            showToast('success', 'Item deleted successfully!');
            await loadInventory();
        } else {
            showToast('error', result.error || 'Failed to delete item');
        }
    } catch (error) {
        console.error('Failed to delete item:', error);
    }
}

async function searchItems(query) {
    if (!query.trim()) {
        renderInventory(inventoryItems);
        return;
    }
    
    try {
        const result = await apiCall(`/inventory/search/${encodeURIComponent(query)}`);
        renderInventory(result.data || []);
    } catch (error) {
        console.error('Search failed:', error);
        showToast('error', 'Search failed');
    }
}

// UI Rendering functions
function renderInventory(items) {
    if (!inventoryTable) return;
    
    if (items.length === 0) {
        inventoryTable.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-4 block text-gray-300"></i>
                    <p class="text-lg">No items found</p>
                    <p class="text-sm">Add your first item to get started</p>
                </td>
            </tr>
        `;
        return;
    }
    
    inventoryTable.innerHTML = items.map(item => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
                <div>
                    <div class="text-sm font-medium text-gray-900">${escapeHtml(item.name)}</div>
                    ${item.description ? `<div class="text-sm text-gray-500">${escapeHtml(item.description)}</div>` : ''}
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${item.sku ? `<code class="bg-gray-100 px-2 py-1 rounded">${escapeHtml(item.sku)}</code>` : '-'}
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQuantityBadgeClass(item.quantity)}">
                    ${item.quantity}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center text-sm text-gray-900">
                    <i class="fas fa-map-marker-alt text-gray-400 mr-1"></i>
                    ${escapeHtml(item.location)}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ${escapeHtml(item.category)}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${item.price ? `<span class="font-medium">$${parseFloat(item.price).toFixed(2)}</span>` : '-'}
            </td>
            <td class="px-6 py-4 text-sm font-medium">
                <div class="flex space-x-2">
                    <button 
                        onclick="editItem('${item.id}')" 
                        class="action-btn text-blue-600 hover:text-blue-900"
                        title="Edit item"
                        type="button"
                    >
                        <i class="fas fa-edit"></i>
                    </button>
                    <button 
                        onclick="openDeleteModal('${item.id}', '${escapeHtml(item.name)}')" 
                        class="action-btn delete text-red-600 hover:text-red-900"
                        title="Delete item"
                        type="button"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateStats(items) {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const categories = new Set(items.map(item => item.category)).size;
    const locations = new Set(items.map(item => item.location)).size;
    
    animateCounter('totalItems', totalItems);
    animateCounter('totalQuantity', totalQuantity);
    animateCounter('totalCategories', categories);
    animateCounter('totalLocations', locations);
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = parseInt(element.textContent || '0') || 0;
    const increment = Math.ceil((targetValue - currentValue) / 20);
    
    if (currentValue !== targetValue) {
        const timer = setInterval(() => {
            const current = parseInt(element.textContent || '0') || 0;
            if (current < targetValue) {
                element.textContent = Math.min(current + increment, targetValue).toString();
            } else {
                element.textContent = targetValue.toString();
                clearInterval(timer);
            }
        }, 50);
    }
}

function openModal(item = null) {
    currentEditId = item ? item.id : null;
    const modalTitle = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtn');
    
    if (!modalTitle || !submitBtn || !modal || !itemForm) return;
    
    if (item) {
        modalTitle.textContent = 'Edit Item';
        submitBtn.textContent = 'Update Item';
        submitBtn.className = 'px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors';
        fillForm(item);
    } else {
        modalTitle.textContent = 'Add New Item';
        submitBtn.textContent = 'Add Item';
        submitBtn.className = 'px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors';
        itemForm.reset();
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const modalContent = modal.querySelector('.bg-white');
    if (modalContent) {
        modalContent.classList.add('modal-enter');
    }
    
    setTimeout(() => {
        const nameInput = document.getElementById('name');
        if (nameInput) nameInput.focus();
    }, 100);
}

function closeModal() {
    if (!modal) return;
    
    const modalContent = modal.querySelector('.bg-white');
    if (modalContent) {
        modalContent.classList.add('modal-exit');
    }
    
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        if (modalContent) {
            modalContent.classList.remove('modal-enter', 'modal-exit');
        }
        currentEditId = null;
        if (itemForm) itemForm.reset();
    }, 200);
}

function openDeleteModal(id, name) {
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.setAttribute('data-id', id);
    }
    
    if (!deleteModal) return;
    
    const modalContent = deleteModal.querySelector('.bg-white');
    deleteModal.classList.remove('hidden');
    deleteModal.classList.add('flex');
    if (modalContent) {
        modalContent.classList.add('modal-enter');
    }
}

function closeDeleteModal() {
    if (!deleteModal) return;
    
    const modalContent = deleteModal.querySelector('.bg-white');
    if (modalContent) {
        modalContent.classList.add('modal-exit');
    }
    
    setTimeout(() => {
        deleteModal.classList.add('hidden');
        deleteModal.classList.remove('flex');
        if (modalContent) {
            modalContent.classList.remove('modal-enter', 'modal-exit');
        }
    }, 200);
}

function fillForm(item) {
    const setValue = (id, value) => {
        const element = document.getElementById(id);
        if (element && value !== undefined && value !== null) {
            element.value = value.toString();
        }
    };
    
    setValue('name', item.name);
    setValue('sku', item.sku);
    setValue('description', item.description);
    setValue('quantity', item.quantity);
    setValue('price', item.price);
    setValue('category', item.category);
    setValue('location', item.location);
    setValue('supplier', item.supplier);
}

function getFormData() {
    if (!itemForm) return {};
    
    const formData = new FormData(itemForm);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
            const stringValue = value.trim();
            if (stringValue !== '') {
                if (key === 'quantity') {
                    data[key] = parseInt(stringValue);
                } else if (key === 'price') {
                    data[key] = parseFloat(stringValue);
                } else {
                    data[key] = stringValue;
                }
            }
        }
    }
    
    return data;
}

function validateForm(data) {
    const required = ['name', 'quantity', 'location', 'category'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
        showToast('error', `Please fill in required fields: ${missing.join(', ')}`);
        return false;
    }
    
    if (data.quantity !== undefined && data.quantity < 0) {
        showToast('error', 'Quantity cannot be negative');
        return false;
    }
    
    if (data.price !== undefined && data.price < 0) {
        showToast('error', 'Price cannot be negative');
        return false;
    }
    
    return true;
}

function getQuantityBadgeClass(quantity) {
    if (quantity === 0) return 'badge-out-of-stock bg-red-100 text-red-800';
    if (quantity < 10) return 'badge-low-stock bg-yellow-100 text-yellow-800';
    return 'badge-in-stock bg-green-100 text-green-800';
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
    const toastElement = toast ? toast.querySelector('div') : null;
    
    if (!toastIcon || !toastMessage || !toastElement || !toast) return;
    
    const iconConfigs = {
        success: {
            icon: '<i class="fas fa-check-circle text-green-500"></i>',
            className: 'bg-white border-l-4 border-green-500 rounded-lg shadow-lg p-4 max-w-sm'
        },
        error: {
            icon: '<i class="fas fa-exclamation-circle text-red-500"></i>',
            className: 'bg-white border-l-4 border-red-500 rounded-lg shadow-lg p-4 max-w-sm'
        },
        warning: {
            icon: '<i class="fas fa-exclamation-triangle text-yellow-500"></i>',
            className: 'bg-white border-l-4 border-yellow-500 rounded-lg shadow-lg p-4 max-w-sm'
        },
        info: {
            icon: '<i class="fas fa-info-circle text-blue-500"></i>',
            className: 'bg-white border-l-4 border-blue-500 rounded-lg shadow-lg p-4 max-w-sm'
        }
    };
    
    const config = iconConfigs[type];
    toastIcon.innerHTML = config.icon;
    toastElement.className = config.className;
    toastMessage.textContent = message;
    
    toast.classList.remove('hidden');
    toastElement.classList.add('toast-enter');
    
    setTimeout(() => {
        hideToast();
    }, 5000);
}

function hideToast() {
    if (!toast) return;
    
    const toastElement = toast.querySelector('div');
    if (toastElement) {
        toastElement.classList.add('toast-exit');
        
        setTimeout(() => {
            toast.classList.add('hidden');
            toastElement.classList.remove('toast-enter', 'toast-exit');
        }, 200);
    }
}

// Event handlers
async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('Form submitted');
    
    const data = getFormData();
    console.log('Form data:', data);
    
    if (!validateForm(data)) {
        return;
    }
    
    if (currentEditId) {
        await updateItem(currentEditId, data);
    } else {
        await createItem(data);
    }
}

function handleSearch(e) {
    const query = e.target.value;
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        if (query.length > 2 || query.length === 0) {
            searchItems(query);
        }
    }, 300);
}

async function handleConfirmDelete() {
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const id = confirmDeleteBtn ? confirmDeleteBtn.getAttribute('data-id') : null;
    if (id) {
        await deleteItem(id);
        closeDeleteModal();
    }
}

// Global functions for inline event handlers
window.editItem = async function(id) {
    const item = inventoryItems.find(item => item.id === id);
    if (item) {
        openModal(item);
    } else {
        try {
            const result = await apiCall(`/inventory/${id}`);
            if (result.success && result.data) {
                openModal(result.data);
            }
        } catch (error) {
            showToast('error', 'Failed to load item details');
        }
    }
};

window.openDeleteModal = function(id, name) {
    openDeleteModal(id, name);
};

window.confirmDelete = async function() {
    await handleConfirmDelete();
};

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showToast('error', 'An unexpected error occurred');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showToast('error', 'A network error occurred');
});

console.log('App.js loaded successfully');