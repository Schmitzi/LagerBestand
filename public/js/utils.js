// js/utils.js - Utility functions

// API Functions
export async function apiCall(endpoint, options = {}) {
    showLoading();
    try {
        const response = await fetch(`${window.API_BASE}${endpoint}`, {
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

// Loading Functions
export function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('hidden');
        loading.classList.add('flex');
    }
}

export function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
        loading.classList.remove('flex');
    }
}

// Toast Notifications
export function showToast(type, message) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toastIcon');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toastIcon || !toastMessage || !toast) {
        console.log(`${type.toUpperCase()}: ${message}`);
        return;
    }
    
    if (type === 'success') {
        toastIcon.innerHTML = '<i class="fas fa-check-circle text-green-500"></i>';
    } else {
        toastIcon.innerHTML = '<i class="fas fa-exclamation-circle text-red-500"></i>';
    }
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => hideToast(), 5000);
}

export function hideToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.add('hidden');
    }
}

// Form Utilities
export function getFormData(form) {
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

// Validation Functions
export function validateEquipmentForm(data) {
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

export function validateBorrowForm(data) {
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

// Date/Time Utilities
export function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
}

export function getDueDateColor(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600 font-medium';
    if (diffDays <= 2) return 'text-yellow-600 font-medium';
    return 'text-gray-900';
}

export function getDaysOverdue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.ceil((today - due) / (1000 * 60 * 60 * 24));
}

export function getAvailabilityColor(item) {
    const ratio = item.available_count / item.total_count;
    if (ratio === 0) return 'text-red-600';
    if (ratio < 0.5) return 'text-yellow-600';
    return 'text-green-600';
}

// HTML Utilities
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// CRUD Operations
export async function createEquipment(data) {
    try {
        const result = await apiCall('/equipment', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (result.success) {
            showToast('success', 'Equipment added successfully!');
            if (window.dashboard?.loadData) {
                await window.dashboard.loadData();
            }
            return true;
        } else {
            showToast('error', result.error || 'Failed to add equipment');
            return false;
        }
    } catch (error) {
        console.error('Failed to create equipment:', error);
        return false;
    }
}

export async function updateEquipment(id, data) {
    try {
        const result = await apiCall(`/equipment/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (result.success) {
            showToast('success', 'Equipment updated successfully!');
            if (window.dashboard?.loadData) {
                await window.dashboard.loadData();
            }
            return true;
        } else {
            showToast('error', result.error || 'Failed to update equipment');
            return false;
        }
    } catch (error) {
        console.error('Failed to update equipment:', error);
        return false;
    }
}

export async function deleteEquipmentItem(id) {
    try {
        const result = await apiCall(`/equipment/${id}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            showToast('success', 'Equipment deleted successfully!');
            if (window.dashboard?.loadData) {
                await window.dashboard.loadData();
            }
            return true;
        } else {
            showToast('error', result.error || 'Failed to delete equipment');
            return false;
        }
    } catch (error) {
        console.error('Failed to delete equipment:', error);
        return false;
    }
}

export async function borrowEquipment(data) {
    try {
        const result = await apiCall('/borrowings', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        if (result.success) {
            showToast('success', 'Equipment borrowed successfully!');
            if (window.dashboard?.loadData) {
                await window.dashboard.loadData();
            }
            return true;
        } else {
            showToast('error', result.error || 'Failed to borrow equipment');
            return false;
        }
    } catch (error) {
        console.error('Failed to borrow equipment:', error);
        return false;
    }
}

export async function returnEquipmentItem(borrowingId, data) {
    try {
        const result = await apiCall(`/borrowings/${borrowingId}/return`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        if (result.success) {
            showToast('success', 'Equipment returned successfully!');
            if (window.dashboard?.loadData) {
                await window.dashboard.loadData();
            }
            return true;
        } else {
            showToast('error', result.error || 'Failed to return equipment');
            return false;
        }
    } catch (error) {
        console.error('Failed to return equipment:', error);
        return false;
    }
}

// Setup toast close handler
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('closeToast')?.addEventListener('click', hideToast);
});

console.log('✅ Utils module loaded');