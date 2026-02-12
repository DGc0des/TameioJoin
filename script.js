// Currency denominations and other fields
const denominations = {
    bills: ['bill-100', 'bill-50', 'bill-20', 'bill-10', 'bill-5'],
    coins: ['coin-2', 'coin-1', 'coin-0-5', 'coin-0-2', 'coin-0-1', 'coin-0-05'],
    other: ['kermata', 'wolt', 'efood', 'mypos', 'eurobank']
};

// Denomination values map (shared across functions)
const denominationValues = {
    'bill-100': 100,
    'bill-50': 50,
    'bill-20': 20,
    'bill-10': 10,
    'bill-5': 5,
    'coin-2': 2,
    'coin-1': 1,
    'coin-0-5': 0.5,
    'coin-0-2': 0.2,
    'coin-0-1': 0.1,
    'coin-0-05': 0.05
};

// All denomination field IDs (bills + coins)
const denominationFields = [...denominations.bills, ...denominations.coins];

// Count mode state
let isCountMode = false;

// Track current number of exoda fields
let currentExodaCount = 1;

// Cache DOM elements
let cachedInputs = {};
let cachedOutputs = {};

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize event listeners
function init() {
    // Add input listeners for all fields
    const allFields = [...denominations.bills, ...denominations.coins, ...denominations.other];

    // Cache all input elements
    allFields.forEach(id => {
        cachedInputs[id] = document.getElementById(id);
    });

    // Cache output elements
    cachedOutputs.grandTotal = document.getElementById('grand-total');
    cachedOutputs.totalExoda = document.getElementById('total-exoda');
    cachedOutputs.cashTotal = document.getElementById('cash-total');
    cachedOutputs.cashLimTotal = document.getElementById('cash-lim-total');
    cachedOutputs.incomeLimTotal = document.getElementById('income-lim-total');

    // Debounced update function (50ms delay)
    const debouncedUpdate = debounce(updateTotals, 50);

    // Debounced save function (300ms delay to avoid excessive writes)
    const debouncedSave = debounce(saveAllValues, 300);

    // Add input listeners with debouncing and validation
    allFields.forEach(id => {
        cachedInputs[id].addEventListener('input', (e) => {
            handleCommaInput(e);
            validateInput(id);
            debouncedUpdate();
            debouncedSave();
        });
    });

    // Restore exoda count and values from localStorage
    const savedExodaCount = localStorage.getItem('exodaCount');
    const exodaCountDropdown = document.getElementById('exoda-count');

    if (savedExodaCount) {
        exodaCountDropdown.value = savedExodaCount;
    }

    const initialCount = parseInt(exodaCountDropdown.value) || 1;
    createExodaFields(initialCount);

    // Add listener for exoda count dropdown
    exodaCountDropdown.addEventListener('change', (e) => {
        const count = parseInt(e.target.value);
        localStorage.setItem('exodaCount', count);
        createExodaFields(count);
        updateTotals();
    });

    // Save all values to localStorage on page hide (when switching apps)
    window.addEventListener('pagehide', saveAllValues);

    // Restore all field values from localStorage
    restoreAllValues();

    // Button listeners
    document.getElementById('reset-btn').addEventListener('click', resetAll);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('fakelos-btn').addEventListener('click', calculateFakelos);
    document.getElementById('stelno-btn').addEventListener('click', showStelno);
    document.getElementById('stelno-close').addEventListener('click', closeStelno);
    document.getElementById('stelno-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeStelno();
    });

    // Load saved theme preference
    loadTheme();

    // Initial calculation
    updateTotals();
}

// Handle comma as decimal separator and filter non-numeric input
function handleCommaInput(event) {
    const input = event.target;
    const cursorPosition = input.selectionStart;
    let value = input.value;

    // Replace commas with dots
    value = value.replace(/,/g, '.');

    // Allow only numbers, dots, and minus sign at the beginning
    // Remove any characters that aren't digits, dots, or minus
    value = value.replace(/[^\d.-]/g, '');

    // Ensure only one dot
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }

    // Update the input value
    input.value = value;

    // Restore cursor position
    input.setSelectionRange(cursorPosition, cursorPosition);
}

// Toggle between amount mode and count mode
function toggleInputMode(countMode) {
    if (isCountMode === countMode) return;

    // Convert existing denomination values
    denominationFields.forEach(id => {
        const input = cachedInputs[id];
        if (!input || !input.value) return;
        const val = parseFloat(input.value);
        if (isNaN(val) || val === 0) return;

        const denom = denominationValues[id];
        if (countMode) {
            // Amount → Count: divide by denomination
            const count = Math.round(val / denom);
            input.value = count;
        } else {
            // Count → Amount: multiply by denomination
            const amount = val * denom;
            // Round to avoid floating point artifacts
            input.value = parseFloat(amount.toFixed(2));
        }
    });

    isCountMode = countMode;

    // Update toggle button active state
    document.getElementById('mode-amount').classList.toggle('active', !isCountMode);
    document.getElementById('mode-count').classList.toggle('active', isCountMode);

    // Re-validate all denomination fields
    denominationFields.forEach(id => validateInput(id));

    updateTotals();
    saveAllValues();
}

// Create dynamic exoda input fields
function createExodaFields(count) {
    const container = document.getElementById('exoda-container');

    // Save existing values before clearing
    const existingValues = {};
    for (let i = 1; i <= currentExodaCount; i++) {
        const input = cachedInputs[`exoda-${i}`];
        if (input && input.value) {
            existingValues[i] = input.value;
        }
    }

    // Clear container and remove old cached inputs
    container.innerHTML = '';
    for (let i = 1; i <= currentExodaCount; i++) {
        delete cachedInputs[`exoda-${i}`];
    }

    currentExodaCount = count;

    // Debounced update function (50ms delay)
    const debouncedUpdate = debounce(updateTotals, 50);

    for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = 'input-group';

        const label = document.createElement('label');
        label.setAttribute('for', `exoda-${i}`);
        label.textContent = `ΈΞΟΔΑ ${i}`;

        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'decimal';
        input.id = `exoda-${i}`;
        input.placeholder = '0';
        input.autocomplete = 'off';

        // Restore value if it existed
        if (existingValues[i]) {
            input.value = existingValues[i];
        }

        const span = document.createElement('span');
        span.className = 'currency';
        span.textContent = '€';

        div.appendChild(label);
        div.appendChild(input);
        div.appendChild(span);
        container.appendChild(div);

        // Cache the input element
        cachedInputs[`exoda-${i}`] = input;

        // Debounced save for exoda fields
        const debouncedSave = debounce(saveAllValues, 300);

        // Add event listeners
        input.addEventListener('input', (e) => {
            handleCommaInput(e);
            validateInput(`exoda-${i}`);
            debouncedUpdate();
            debouncedSave();
        });
    }
}

// Get total exoda amount (sum of all exoda fields)
function getTotalExoda() {
    let total = 0;
    for (let i = 1; i <= currentExodaCount; i++) {
        const input = cachedInputs[`exoda-${i}`];
        if (input) {
            const amount = parseFloat(input.value) || 0;
            total += amount;
        }
    }
    return total;
}

// Save all field values to localStorage
function saveAllValues() {
    const values = {};

    // Save all main fields (bills, coins, other)
    const allFields = [...denominations.bills, ...denominations.coins, ...denominations.other];
    allFields.forEach(id => {
        if (cachedInputs[id] && cachedInputs[id].value) {
            values[id] = cachedInputs[id].value;
        }
    });

    // Save exoda fields
    for (let i = 1; i <= currentExodaCount; i++) {
        const input = cachedInputs[`exoda-${i}`];
        if (input && input.value) {
            values[`exoda-${i}`] = input.value;
        }
    }

    localStorage.setItem('allValues', JSON.stringify(values));
    localStorage.setItem('allValuesSavedAt', Date.now());
    localStorage.setItem('countMode', isCountMode);
}

// Restore all field values from localStorage (expires after 1 hour)
function restoreAllValues() {
    const savedAt = localStorage.getItem('allValuesSavedAt');
    if (savedAt && (Date.now() - parseInt(savedAt)) > 3600000) {
        localStorage.removeItem('allValues');
        localStorage.removeItem('allValuesSavedAt');
        localStorage.removeItem('exodaCount');
        return;
    }

    // Restore count mode
    const savedCountMode = localStorage.getItem('countMode');
    if (savedCountMode === 'true') {
        isCountMode = true;
        document.getElementById('mode-amount').classList.remove('active');
        document.getElementById('mode-count').classList.add('active');
    }

    const saved = localStorage.getItem('allValues');
    if (!saved) return;

    const values = JSON.parse(saved);

    // Restore main fields
    const allFields = [...denominations.bills, ...denominations.coins, ...denominations.other];
    allFields.forEach(id => {
        if (cachedInputs[id] && values[id]) {
            cachedInputs[id].value = values[id];
        }
    });

    // Restore exoda fields
    for (let i = 1; i <= currentExodaCount; i++) {
        const input = cachedInputs[`exoda-${i}`];
        if (input && values[`exoda-${i}`]) {
            input.value = values[`exoda-${i}`];
        }
    }
}

// Validate input based on field type
function validateInput(id) {
    const input = cachedInputs[id];
    const value = parseFloat(input.value);

    // Skip validation if empty
    if (!input.value) {
        input.classList.remove('invalid');
        return;
    }

    // Check if this is a denomination field (bills and coins)
    if (denominationValues.hasOwnProperty(id)) {
        if (isCountMode) {
            // Count mode: must be a non-negative integer
            const isValid = !isNaN(value) && Number.isInteger(value) && value >= 0;
            input.classList.toggle('invalid', !isValid);
        } else {
            // Amount mode: must be a valid multiple of the denomination
            const denomination = denominationValues[id];
            const epsilon = 0.001;
            const remainder = (value % denomination);
            const isValidMultiple = remainder < epsilon || (denomination - remainder) < epsilon;

            if (!isNaN(value) && !isValidMultiple) {
                input.classList.add('invalid');
            } else {
                input.classList.remove('invalid');
            }
        }
    } else {
        // For "Other Amounts" fields, no denomination validation
        input.classList.remove('invalid');
    }
}

// Update all totals
function updateTotals() {
    let grandTotal = 0;

    // Calculate total from all fields using cached elements
    const allFields = [...denominations.bills, ...denominations.coins, ...denominations.other];

    allFields.forEach(id => {
        const rawValue = parseFloat(cachedInputs[id].value) || 0;
        // In count mode, denomination fields need to be multiplied by their value
        if (isCountMode && denominationValues.hasOwnProperty(id)) {
            grandTotal += rawValue * denominationValues[id];
        } else {
            grandTotal += rawValue;
        }
    });

    // Add all exoda amounts to grand total
    const totalExoda = getTotalExoda();
    grandTotal += totalExoda;

    // Calculate ΜΕΤΡΗΤΑ (cash) = ΤΑΜΕΙΟ - (1000 + ΈΞΟΔΑ + WOLT + EFOOD + myPos + Eurobank)
    const deductions = ['wolt', 'efood', 'mypos', 'eurobank'];
    let deductionsTotal = 1000; // Start with fixed 1000
    deductionsTotal += totalExoda; // Add total exoda

    deductions.forEach(id => {
        const amount = parseFloat(cachedInputs[id].value) || 0;
        deductionsTotal += amount;
    });

    const cashTotal = grandTotal - deductionsTotal;

    // Calculate ΜΕΤΡΗΤΑ LIM = ΜΕΤΡΗΤΑ + ΈΞΟΔΑ
    const cashLimTotal = cashTotal + totalExoda;

    // Calculate ΕΣΟΔΑ LIM = ΜΕΤΡΗΤΑ + ΈΞΟΔΑ + myPos + Eurobank
    const myposAmount = parseFloat(cachedInputs.mypos.value) || 0;
    const eurobankAmount = parseFloat(cachedInputs.eurobank.value) || 0;
    const incomeLimTotal = cashTotal + totalExoda + myposAmount + eurobankAmount;

    // Update totals using cached elements
    cachedOutputs.grandTotal.textContent = formatCurrency(grandTotal);
    cachedOutputs.totalExoda.textContent = formatCurrency(totalExoda);
    cachedOutputs.cashTotal.textContent = formatCurrency(cashTotal);
    cachedOutputs.cashLimTotal.textContent = formatCurrency(cashLimTotal);
    cachedOutputs.incomeLimTotal.textContent = formatCurrency(incomeLimTotal);
}

// Format currency
function formatCurrency(amount) {
    return amount.toFixed(2) + '€';
}

// Reset all inputs
function resetAll() {
    if (confirm('Είστε σίγουροι ότι θέλετε να καθαρίσετε όλα τα πεδία;')) {
        // Reset all inputs
        document.querySelectorAll('input[type="text"]').forEach(input => {
            input.value = '';
            input.classList.remove('invalid');
        });

        // Clear localStorage
        localStorage.removeItem('allValues');
        localStorage.removeItem('allValuesSavedAt');
        localStorage.removeItem('exodaCount');
        localStorage.removeItem('countMode');

        // Reset to amount mode
        isCountMode = false;
        document.getElementById('mode-amount').classList.add('active');
        document.getElementById('mode-count').classList.remove('active');

        updateTotals();
    }
}

// Toggle dark mode
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');

    // Update icon
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = isDarkMode ? '☀️' : '🌙';

    // Save preference
    localStorage.setItem('darkMode', isDarkMode);
}

// Load saved theme preference
function loadTheme() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.querySelector('.theme-icon').textContent = '☀️';
    }
}

// Show Στέλνω popup with summary and remaining bill/coin counts after fakelos
function showStelno() {
    const tameioVal = cachedOutputs.grandTotal.textContent;
    const cashVal = cachedOutputs.cashTotal.textContent;
    const exodaVal = cachedOutputs.totalExoda.textContent;

    // Get current counts for all denominations
    const billDenoms = [100, 50, 20, 10, 5];
    const coinDenoms = [2, 1, 0.5, 0.2, 0.1, 0.05];

    const billCounts = {};
    for (const id of denominations.bills) {
        const denom = denominationValues[id];
        const rawValue = parseFloat(cachedInputs[id].value) || 0;
        billCounts[denom] = isCountMode ? Math.round(rawValue) : Math.round(rawValue / denom);
    }

    const coinCounts = {};
    for (const id of denominations.coins) {
        const denom = denominationValues[id];
        const rawValue = parseFloat(cachedInputs[id].value) || 0;
        coinCounts[denom] = isCountMode ? Math.round(rawValue) : Math.round(rawValue / denom);
    }

    // Run the same greedy fakelos algorithm to find what goes in the envelope
    const cashTotal = parseFloat(cachedOutputs.cashTotal.textContent.replace('€', '')) || 0;
    let remaining = Math.round(cashTotal * 100) / 100;

    const usedBills = {};
    for (const denom of billDenoms) {
        if (remaining <= 0) break;
        const needed = Math.floor(remaining / denom);
        const used = Math.min(needed, billCounts[denom] || 0);
        if (used > 0) {
            usedBills[denom] = used;
            remaining -= used * denom;
            remaining = Math.round(remaining * 100) / 100;
        }
    }

    const usedCoins = {};
    for (const denom of coinDenoms) {
        if (remaining <= 0) break;
        const needed = Math.floor((remaining + 0.001) / denom);
        const used = Math.min(needed, coinCounts[denom] || 0);
        if (used > 0) {
            usedCoins[denom] = used;
            remaining -= used * denom;
            remaining = Math.round(remaining * 100) / 100;
        }
    }

    // Build popup HTML
    let html = '<div class="stelno-totals">';
    html += `<div class="stelno-row"><span>ΤΑΜΕΙΟ</span><strong>${tameioVal}</strong></div>`;
    html += `<div class="stelno-row"><span>ΜΕΤΡΗΤΑ</span><strong>${cashVal}</strong></div>`;
    html += `<div class="stelno-row"><span>ΕΞΟΔΑ</span><strong>${exodaVal}</strong></div>`;
    html += '</div>';

    // Remaining bills after fakelos (show all, including 0)
    html += '<div class="stelno-section-title">Χαρτονομίσματα</div>';
    for (const denom of billDenoms) {
        const left = Math.max(0, (billCounts[denom] || 0) - (usedBills[denom] || 0));
        html += `<div class="stelno-denom-row"><span>${denom}€</span><span class="stelno-denom-count">${left} ${left === 1 ? 'χαρτνόμισμα' : 'χαρτονομίσματα'}</span></div>`;
    }

    // Remaining coins after fakelos (show all, including 0)
    html += '<div class="stelno-section-title">Κέρματα</div>';
    for (const denom of coinDenoms) {
        const left = Math.max(0, (coinCounts[denom] || 0) - (usedCoins[denom] || 0));
        const denomLabel = denom >= 1 ? `${denom}€` : `${(denom * 100).toFixed(0)}c`;
        html += `<div class="stelno-denom-row"><span>${denomLabel}</span><span class="stelno-denom-count">${left} ${left === 1 ? 'κέρμα' : 'κέρματα'}</span></div>`;
    }

    // Χρηματοκιβώτιο (ΚΕΡΜΑΤΑ field value)
    const kermataVal = formatCurrency(parseFloat(cachedInputs['kermata'].value) || 0);
    html += `<div class="stelno-row" style="margin-top:16px;"><span>Χρηματοκιβώτιο</span><strong>${kermataVal}</strong></div>`;

    document.getElementById('stelno-body').innerHTML = html;
    document.getElementById('stelno-overlay').style.display = 'flex';
}

// Close Στέλνω popup
function closeStelno() {
    document.getElementById('stelno-overlay').style.display = 'none';
}

// Calculate ΦΑΚΕΛΟΣ - breakdown of bills and coins to reach ΜΕΤΡΗΤΑ amount
function calculateFakelos() {
    // Get the current ΜΕΤΡΗΤΑ value
    const cashTotalText = cachedOutputs.cashTotal.textContent;
    const cashTotal = parseFloat(cashTotalText.replace('€', '')) || 0;

    // Get counts of available bills and coins
    const billCounts = {};
    for (const id of denominations.bills) {
        const denom = denominationValues[id];
        const rawValue = parseFloat(cachedInputs[id].value) || 0;
        billCounts[denom] = isCountMode ? Math.round(rawValue) : Math.round(rawValue / denom);
    }

    const coinCounts = {};
    for (const id of denominations.coins) {
        const denom = denominationValues[id];
        const rawValue = parseFloat(cachedInputs[id].value) || 0;
        coinCounts[denom] = isCountMode ? Math.round(rawValue) : Math.round(rawValue / denom);
    }

    // Calculate breakdown - greedy algorithm starting with highest denominations
    const billDenominations = [100, 50, 20, 10, 5];
    const coinDenominations = [2, 1, 0.5, 0.2, 0.1, 0.05];
    const usedBills = {};
    const usedCoins = {};
    let remaining = Math.round(cashTotal * 100) / 100; // Round to avoid floating point issues
    let billsTotal = 0;
    let coinsTotal = 0;

    // First, use bills
    for (const denom of billDenominations) {
        if (remaining <= 0) break;

        const needed = Math.floor(remaining / denom);
        const available = billCounts[denom];
        const used = Math.min(needed, available);

        if (used > 0) {
            usedBills[denom] = used;
            const amount = used * denom;
            remaining -= amount;
            billsTotal += amount;
            remaining = Math.round(remaining * 100) / 100;
        }
    }

    // Then, use coins for the remainder
    for (const denom of coinDenominations) {
        if (remaining <= 0) break;

        // Use Math.floor with epsilon handling for small denominations
        const needed = Math.floor((remaining + 0.001) / denom);
        const available = coinCounts[denom];
        const used = Math.min(needed, available);

        if (used > 0) {
            usedCoins[denom] = used;
            const amount = used * denom;
            remaining -= amount;
            coinsTotal += amount;
            remaining = Math.round(remaining * 100) / 100;
        }
    }

    const grandTotal = billsTotal + coinsTotal;

    // Display the result
    const resultDiv = document.getElementById('fakelos-result');
    const breakdownDiv = document.getElementById('fakelos-breakdown');

    let html = '';

    if (cashTotal <= 0) {
        html = '<p class="fakelos-message">Δεν υπάρχουν μετρητά για φάκελο.</p>';
    } else {
        // ΒΑΖΕΙΣ section - what to put in envelope
        let hasBills = Object.keys(usedBills).length > 0;
        let hasCoins = Object.keys(usedCoins).length > 0;

        if (hasBills || hasCoins) {
            html += '<div class="fakelos-section fakelos-put">';
            html += '<h4 class="fakelos-section-title">ΒΑΖΕΙΣ</h4>';
            html += '<div class="fakelos-items">';

            for (const denom of billDenominations) {
                if (usedBills[denom] && usedBills[denom] > 0) {
                    html += `<div class="fakelos-item"><span class="item-count">${usedBills[denom]}</span><span class="item-denom">× ${denom}€</span></div>`;
                }
            }
            for (const denom of coinDenominations) {
                if (usedCoins[denom] && usedCoins[denom] > 0) {
                    const denomLabel = denom >= 1 ? `${denom}€` : `${(denom * 100).toFixed(0)}c`;
                    html += `<div class="fakelos-item"><span class="item-count">${usedCoins[denom]}</span><span class="item-denom">× ${denomLabel}</span></div>`;
                }
            }

            html += '</div>';
            html += `<div class="fakelos-section-total">${grandTotal.toFixed(2)}€</div>`;
            html += '</div>';
        }

        // ΜΕΝΟΥΝ section - show all denominations with remaining count
        html += '<div class="fakelos-section fakelos-keep">';
        html += '<h4 class="fakelos-section-title">ΜΕΝΟΥΝ</h4>';
        html += '<div class="fakelos-items">';

        let remainingTotal = 0;
        for (const denom of billDenominations) {
            const left = Math.max(0, (billCounts[denom] || 0) - (usedBills[denom] || 0));
            remainingTotal += left * denom;
            html += `<div class="fakelos-item"><span class="item-count">${left}</span><span class="item-denom">× ${denom}€</span></div>`;
        }
        for (const denom of coinDenominations) {
            const left = Math.max(0, (coinCounts[denom] || 0) - (usedCoins[denom] || 0));
            remainingTotal += left * denom;
            const denomLabel = denom >= 1 ? `${denom}€` : `${(denom * 100).toFixed(0)}c`;
            html += `<div class="fakelos-item"><span class="item-count">${left}</span><span class="item-denom">× ${denomLabel}</span></div>`;
        }

        html += '</div>';
        html += `<div class="fakelos-section-total">${remainingTotal.toFixed(2)}€</div>`;
        html += '</div>';

        if (!hasBills && !hasCoins) {
            html += '<p class="fakelos-message">Δεν υπάρχουν διαθέσιμα χαρτονομίσματα ή κέρματα.</p>';
        }

        // Show uncovered amount if any
        if (remaining > 0.001) {
            html += `
                <div class="fakelos-warning">
                    <span>Λείπουν:</span>
                    <strong>${remaining.toFixed(2)}€</strong>
                </div>
            `;
        }
    }

    breakdownDiv.innerHTML = html;
    resultDiv.style.display = 'block';

    // Scroll to the result
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
