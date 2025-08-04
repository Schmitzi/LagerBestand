// Create this as a separate file named debug.js and include it in your HTML

// This will help identify which specific line is causing the error
window.onerror = function(message, source, lineno, colno, error) {
    console.error('JavaScript Error:', {
        message: message,
        source: source,
        line: lineno,
        column: colno,
        error: error && error.stack ? error.stack : error
    });
    return false; // Let the default error handler run as well
};

// Check for missing HTML elements
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Loaded - Checking critical elements...');
    
    // Check for events modal elements
    const elementsToCheck = [
        'eventsModal', 'eventsForm', 'eventName', 'eventId', 
        'location', 'beginDate', 'endDate', 'managedBy',
        'submitEventsBtn', 'cancelEventBtn', 'closeEventsModal'
    ];
    
    const missingElements = [];
    elementsToCheck.forEach(id => {
        if (!document.getElementById(id)) {
            missingElements.push(id);
            console.error(`Missing critical element: #${id}`);
        }
    });
    
    if (missingElements.length > 0) {
        console.error('Missing HTML elements detected:', missingElements);
    } else {
        console.log('All critical HTML elements are present');
    }
    
    // Check for duplicate IDs
    const allElements = document.querySelectorAll('[id]');
    const ids = {};
    const duplicates = [];
    
    Array.from(allElements).forEach(el => {
        if (ids[el.id]) {
            duplicates.push(el.id);
        } else {
            ids[el.id] = true;
        }
    });
    
    if (duplicates.length > 0) {
        console.error('Duplicate IDs detected:', duplicates);
    } else {
        console.log('No duplicate IDs detected');
    }
});