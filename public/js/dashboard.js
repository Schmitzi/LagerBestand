// js/dashboard.js - Dashboard and table management

import { apiCall, formatDate, getDueDateColor, getDaysOverdue, getAvailabilityColor, escapeHtml, deleteEquipmentItem } from './utils.js';

// Data Loading Functions
export async function loadData() {
    await Promise.all([
        loadEquipment(),
        loadDashboardStats()
    ]);
}

export async function loadEquipment() {
    try {
        console.log('Loading equipment...');
        const result = await apiCall('/equipment');
        window.appState.equipment = result.data || [];
        renderEquipment(window.appState.equipment);
        populateEquipmentDropdown();
        console.log(`✅ Loaded ${window.appState.equipment.length} equipment items`);
    } catch (error) {
        console.error('Failed to load equipment:', error);
        renderEquipmentError();
    }
}

export async function loadBorrowings() {
    try {
        console.log('Loading borrowings...');
        const result = await apiCall('/borrowings/current');
        window.appState.borrowings = result.data || [];
        console.log(`✅ Loaded ${window.appState.borrowings.length} active borrowings`);
        renderBorrowings(window.appState.borrowings);
        populateReturnDropdown();
    } catch (error) {
        console.error('Failed to load borrowings:', error);
        window.appState.borrowings = [];
    }
}

export async function loadOverdueItems() {
    try {
        console.log('Loading overdue items...');
        const result = await apiCall('/borrowings/overdue');
        window.appState.overdueItems = result.data || [];
        console.log(`✅ Loaded ${window.appState.overdueItems.length} overdue items`);
        renderOverdueItems(window.appState.overdueItems);
    } catch (error) {
        console.error('Failed to load overdue items:', error);
        window.appState.overdueItems = [];
    }
}

async function loadDashboardStats() {
    try {
        console.log('Loading dashboard stats...');
        const result = await apiCall('/dashboard');
        if (result.success && result.data) {
            updateDashboardStats(result.data);
            console.log('✅ Dashboard stats updated');
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
    }
}

// Rendering Functions
function renderEquipment(items) {
    const equipmentTable = document.getElementById('equipmentTable');
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

function renderEquipmentError() {
    const equipmentTable = document.getElementById('equipmentTable');
    if (!equipmentTable) return;
    
    equipmentTable.innerHTML = `
        <tr>
            <td colspan="5" class="px-6 py-12 text-center text-red-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-4 block"></i>
                <p class="text-lg">Failed to load equipment</p>
                <p class="text-sm">Check your connection and try again</p>
                <button onclick="window.dashboard.loadEquipment()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Retry
                </button>
            </td>
        </tr>
    `;
}

function renderBorrowings(items) {
    const borrowingsTable = document.getElementById('borrowingsTable');
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
    const overdueTable = document.getElementById('overdueTable');
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

// Dropdown Population Functions
export function populateEquipmentDropdown() {
    const select = document.getElementById('borrowEquipment');
    if (!select) return;
    
    const availableEquipment = window.appState.equipment.filter(item => item.available_count > 0);
    
    select.innerHTML = `
        <option value="">Select equipment to borrow</option>
        ${availableEquipment.map(item => `
            <option value="${item.id}">
                ${escapeHtml(item.name)} (${item.available_count}/${item.total_count} available) - ${escapeHtml(item.rubric)}
            </option>
        `).join('')}
    `;
}

export function populateReturnDropdown() {
    const select = document.getElementById('returnBorrowing');
    if (!select) return;
    
    console.log('Populating return dropdown with borrowings:', window.appState.borrowings.length);
    
    if (window.appState.borrowings.length === 0) {
        select.innerHTML = `<option value="">No items currently borrowed</option>`;
        return;
    }
    
    select.innerHTML = `
        <option value="">Select item to return</option>
        ${window.appState.borrowings.map(item => `
            <option value="${item.id}">
                ${escapeHtml(item.equipment_name)} → ${escapeHtml(item.borrower_name)} (${escapeHtml(item.event_name)}) - Due: ${formatDate(item.expected_return_date)}
            </option>
        `).join('')}
    `;
}

// Dashboard Stats
function updateDashboardStats(stats) {
    document.getElementById('totalEquipment').textContent = stats.total_equipment_types || 0;
    document.getElementById('availableItems').textContent = stats.available_items || 0;
    document.getElementById('borrowedItems').textContent = stats.borrowed_items || 0;
    document.getElementById('overdueItems').textContent = stats.overdue_borrowings || 0;
    document.getElementById('activeEvents').textContent = stats.active_borrowings || 0;
    document.getElementById('totalItems').textContent = stats.total_items || 0;
}

// Search Functionality
export function handleSearch(query) {
    if (!query) {
        // Show all items if search is empty
        if (window.appState.currentView === 'equipment') {
            renderEquipment(window.appState.equipment);
        } else if (window.appState.currentView === 'borrowings') {
            renderBorrowings(window.appState.borrowings);
        } else if (window.appState.currentView === 'overdue') {
            renderOverdueItems(window.appState.overdueItems);
        }
        return;
    }

    const lowerQuery = query.toLowerCase();

    if (window.appState.currentView === 'equipment') {
        const filtered = window.appState.equipment.filter(item =>
            item.name.toLowerCase().includes(lowerQuery) ||
            item.description?.toLowerCase().includes(lowerQuery) ||
            item.rubric.toLowerCase().includes(lowerQuery) ||
            item.storage_area.toLowerCase().includes(lowerQuery)
        );
        renderEquipment(filtered);
    } else if (window.appState.currentView === 'borrowings') {
        const filtered = window.appState.borrowings.filter(item =>
            item.equipment_name.toLowerCase().includes(lowerQuery) ||
            item.borrower_name.toLowerCase().includes(lowerQuery) ||
            item.event_name.toLowerCase().includes(lowerQuery) ||
            item.event_location.toLowerCase().includes(lowerQuery)
        );
        renderBorrowings(filtered);
    } else if (window.appState.currentView === 'overdue') {
        const filtered = window.appState.overdueItems.filter(item =>
            item.equipment_name.toLowerCase().includes(lowerQuery) ||
            item.borrower_name.toLowerCase().includes(lowerQuery) ||
            item.event_name.toLowerCase().includes(lowerQuery) ||
            item.event_location.toLowerCase().includes(lowerQuery)
        );
        renderOverdueItems(filtered);
    }
}

// Global functions for onclick handlers (maintain compatibility)
window.editEquipment = function(id) {
    const item = window.appState.equipment.find(e => e.id === id);
    if (item && window.equipmentModal?.openModal) {
        window.equipmentModal.openModal(item);
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
    if (window.borrowModal?.openModal) {
        window.borrowModal.openModal();
    }
};

window.returnEquipment = function(borrowingId) {
    // Load borrowings first, then open modal with pre-selection
    loadBorrowings().then(() => {
        populateReturnDropdown();
        const returnSelect = document.getElementById('returnBorrowing');
        if (returnSelect) {
            returnSelect.value = borrowingId;
        }
        if (window.returnModal?.openModal) {
            window.returnModal.openModal();
        }
    });
};

console.log('✅ Dashboard module loaded');