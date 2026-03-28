// ============================================
// USD2VED - Currency Converter USD to VED
// ============================================

// API Configuration
const CONFIG = {
    apis: {
        bcvPrincipal: 'https://bcv-api.rafnixg.dev/rates/',
        bcvRespaldo: 'https://ve.dolarapi.com/v1/dolares/oficial',
        euro: 'https://ve.dolarapi.com/v1/euros/oficial',
        usdt: 'https://criptoya.com/api/usdt/ves/1'
    }
};

// ============================================
// LOCAL STORAGE MANAGEMENT
// ============================================

const STORAGE_KEYS = {
    rates: 'usd2ved_tasas',
    bcvDate: 'usd2ved_fechaBCV',
    timestamp: 'usd2ved_timestamp',
    customRate: 'usd2ved_tasaPersonalizada'
};

// Application state
let rates = {
    bcv: null,
    euro: null,
    usdt: null
};

let bcvDate = null;
let customRate = 40.00;
let customMode = false;
let lastEdited = 'usd';
let editingCustom = false;
let editingUSD = false;
let editingVES = false;
let timeoutId;

// DOM Elements
const elements = {
    // Cards
    cards: {
        bcv: document.getElementById('card-bcv'),
        euro: document.getElementById('card-euro'),
        usdt: document.getElementById('card-usdt')
    },
    
    // Rate values
    tasaBCV: document.getElementById('tasaBCV'),
    fechaBCV: document.getElementById('fechaBCV'),
    tasaEuro: document.getElementById('tasaEuro'),
    tasaUSDT: document.getElementById('tasaUSDT'),
    
    // Inputs
    inputUSD: document.getElementById('inputUSD'),
    inputVES: document.getElementById('inputVES'),
    inputUSDGroup: document.querySelector('.input-usd'),
    inputVESGroup: document.querySelector('.input-ves'),
    
    // Custom elements - Button and hidden input
    btnCustom: document.getElementById('btnPersonalizada'),
    customContainer: document.getElementById('customInputContainer'),
    customInput: document.getElementById('tasaPersonalizadaInput'),
    
    // Footer
    lastUpdate: document.getElementById('ultimaActualizacion')
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatNumber(value, decimals = 2) {
    if (value === undefined || value === null || isNaN(value)) return 'N/A';
    
    let rounded = Number(value).toFixed(decimals);
    let parts = rounded.split('.');
    let integer = parts[0];
    let decimal = parts[1];

    integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return integer + ',' + decimal;
}

function parseNumber(valueStr) {
    if (!valueStr) return NaN;
    
    let clean = valueStr.toString()
        .replace(/\./g, '')
        .replace(',', '.');
    
    return parseFloat(clean);
}

function limitTwoDecimals(value) {
    if (isNaN(value)) return 0;
    return Math.round(value * 100) / 100;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `📅 ${day}/${month}/${year}`;
    } catch (e) {
        return '';
    }
}

function checkConnection() {
    return navigator.onLine;
}

// ============================================
// STORAGE FUNCTIONS
// ============================================

function saveRatesToStorage() {
    try {
        const dataToSave = {
            rates: rates,
            bcvDate: bcvDate,
            timestamp: new Date().toISOString(),
            customRate: customRate
        };
        
        localStorage.setItem(STORAGE_KEYS.rates, JSON.stringify(dataToSave));
        console.log('Rates saved to localStorage');
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

function loadRatesFromStorage() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEYS.rates);
        
        if (!savedData) {
            console.log('No saved rates found');
            return false;
        }
        
        const data = JSON.parse(savedData);
        
        if (data.rates) {
            rates = data.rates;
        }
        
        if (data.bcvDate) {
            bcvDate = data.bcvDate;
        }
        
        if (data.customRate) {
            customRate = data.customRate;
            if (elements.customInput) {
                elements.customInput.value = formatNumber(customRate, 2);
            }
        }
        
        console.log('Rates loaded from localStorage');
        return true;
        
    } catch (e) {
        console.error('Error loading rates from localStorage:', e);
        return false;
    }
}

function displaySavedRates() {
    if (rates.bcv) {
        elements.tasaBCV.textContent = formatNumber(rates.bcv, 4);
        if (bcvDate) {
            elements.fechaBCV.textContent = formatDate(bcvDate);
        }
    }
    
    if (rates.euro) {
        elements.tasaEuro.textContent = formatNumber(rates.euro, 2);
    } else if (rates.bcv) {
        elements.tasaEuro.textContent = `${formatNumber(rates.bcv * 1.07, 2)} (est.)`;
    }
    
    if (rates.usdt) {
        elements.tasaUSDT.textContent = formatNumber(rates.usdt, 2);
    } else {
        elements.tasaUSDT.textContent = 'Unavailable';
    }
    
    elements.customInput.value = formatNumber(customRate, 2);
    
    const timestamp = localStorage.getItem(STORAGE_KEYS.timestamp);
    if (timestamp) {
        const date = new Date(timestamp);
        elements.lastUpdate.textContent = `📦 Saved data: ${date.toLocaleString()}`;
    } else {
        elements.lastUpdate.textContent = '📦 Showing saved data';
    }
}

// ============================================
// RATE SELECTION FUNCTIONS
// ============================================

function getSelectedRate() {
    if (customMode) {
        return customRate;
    } else {
        if (elements.cards.bcv.classList.contains('active')) {
            return rates.bcv;
        } else if (elements.cards.euro.classList.contains('active')) {
            return rates.euro;
        } else if (elements.cards.usdt.classList.contains('active')) {
            return rates.usdt;
        }
        return rates.bcv;
    }
}

function activateRate(type) {
    // Deactivate all cards
    Object.values(elements.cards).forEach(card => {
        card.classList.remove('active');
    });
    
    // Hide custom input and show button
    customMode = false;
    elements.btnCustom.classList.remove('hidden');
    elements.customContainer.classList.add('hidden');
    
    // Activate selected card
    if (elements.cards[type]) {
        elements.cards[type].classList.add('active');
    }
    
    // Update conversion
    if (lastEdited === 'usd') {
        updateFromUSD();
    } else {
        updateFromVES();
    }
}

function calculateAverageRate() {
    const validRates = [];
    
    if (rates.bcv && !isNaN(rates.bcv) && rates.bcv > 0) {
        validRates.push(rates.bcv);
    }
    if (rates.euro && !isNaN(rates.euro) && rates.euro > 0) {
        validRates.push(rates.euro);
    }
    if (rates.usdt && !isNaN(rates.usdt) && rates.usdt > 0) {
        validRates.push(rates.usdt);
    }
    
    if (validRates.length === 0) {
        return 40.00; // Default fallback
    }
    
    const sum = validRates.reduce((acc, rate) => acc + rate, 0);
    return sum / validRates.length;
}

function activateCustomRate() {
    // Deactivate all cards
    Object.values(elements.cards).forEach(card => {
        card.classList.remove('active');
    });
    
    // Calculate average of the 3 rates
    const average = calculateAverageRate();
    customRate = limitTwoDecimals(average);
    
    // Update custom input with the average value
    elements.customInput.value = formatNumber(customRate, 2);
    
    // Show custom input and hide button
    customMode = true;
    elements.btnCustom.classList.add('hidden');
    elements.customContainer.classList.remove('hidden');
    
    // Focus on custom input
    setTimeout(() => {
        elements.customInput.focus();
        elements.customInput.select();
    }, 100);
    
    // Update conversion
    if (lastEdited === 'usd') {
        updateFromUSD();
    } else {
        updateFromVES();
    }
}

// ============================================
// CONVERSION FUNCTIONS
// ============================================

function convertUSDtoVES(usd) {
    const rate = getSelectedRate();
    if (!rate || isNaN(usd)) return NaN;
    return usd * rate;
}

function convertVEStoUSD(ves) {
    const rate = getSelectedRate();
    if (!rate || isNaN(ves)) return NaN;
    return ves / rate;
}

// ============================================
// UI UPDATE FUNCTIONS
// ============================================

function updateVisualFocus() {
    elements.inputUSDGroup.classList.remove('editing');
    elements.inputVESGroup.classList.remove('editing');
    
    if (lastEdited === 'usd') {
        elements.inputUSDGroup.classList.add('editing');
    } else if (lastEdited === 'ves') {
        elements.inputVESGroup.classList.add('editing');
    }
}

function updateFromUSD() {
    if (editingVES) return;
    
    editingUSD = true;
    lastEdited = 'usd';
    updateVisualFocus();
    
    const usd = parseNumber(elements.inputUSD.value);
    
    if (!isNaN(usd) && usd > 0) {
        const ves = convertUSDtoVES(usd);
        if (!isNaN(ves)) {
            elements.inputVES.value = formatNumber(ves, 2);
        }
    } else {
        elements.inputVES.value = '';
    }
    
    // Visual effect on selected card
    if (!customMode) {
        const activeCard = Object.values(elements.cards).find(card => card.classList.contains('active'));
        if (activeCard) {
            Object.values(elements.cards).forEach(card => {
                if (card) card.style.transform = 'scale(1)';
            });
            activeCard.style.transform = 'scale(1.02)';
            setTimeout(() => {
                activeCard.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    editingUSD = false;
}

function updateFromVES() {
    if (editingUSD) return;
    
    editingVES = true;
    lastEdited = 'ves';
    updateVisualFocus();
    
    const ves = parseNumber(elements.inputVES.value);
    
    if (!isNaN(ves) && ves > 0) {
        const usd = convertVEStoUSD(ves);
        if (!isNaN(usd)) {
            elements.inputUSD.value = formatNumber(usd, 2);
        }
    } else {
        elements.inputUSD.value = '';
    }
    
    // Visual effect on selected card
    if (!customMode) {
        const activeCard = Object.values(elements.cards).find(card => card.classList.contains('active'));
        if (activeCard) {
            Object.values(elements.cards).forEach(card => {
                if (card) card.style.transform = 'scale(1)';
            });
            activeCard.style.transform = 'scale(1.02)';
            setTimeout(() => {
                activeCard.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    editingVES = false;
}

// ============================================
// API FUNCTIONS
// ============================================

async function fetchBCVRate() {
    if (!checkConnection()) {
        console.log('Offline: Returning saved BCV rate');
        return rates.bcv || null;
    }
    
    try {
        const response = await fetch(CONFIG.apis.bcvPrincipal);
        if (response.ok) {
            const data = await response.json();
            console.log('BCV rate from main API:', data.dollar);
            
            if (data.date) {
                bcvDate = data.date;
            }
            
            return data.dollar;
        }
    } catch (e) {
        console.log('Error with main API, using backup:', e);
    }
    
    try {
        const response = await fetch(CONFIG.apis.bcvRespaldo);
        if (response.ok) {
            const data = await response.json();
            console.log('BCV rate from backup API:', data.promedio || data.price);
            
            if (data.fechaActualizacion || data.date) {
                bcvDate = data.fechaActualizacion || data.date;
            }
            
            return data.promedio || data.price;
        }
    } catch (e) {
        console.error('Both BCV APIs failed:', e);
    }
    
    return null;
}

async function fetchUSDTRate() {
    if (!checkConnection()) {
        console.log('Offline: Cannot fetch USDT');
        return rates.usdt || null;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(CONFIG.apis.usdt, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data.binancep2p && data.binancep2p.bid) {
            console.log('Using Binance P2P BID:', data.binancep2p.bid);
            return data.binancep2p.bid;
        }
        
        return null;
        
    } catch (e) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') {
            console.error('Timeout fetching USDT');
        } else {
            console.error('Error fetching USDT:', e);
        }
        return rates.usdt || null;
    }
}

async function fetchEuroRate() {
    try {
        const response = await fetch(CONFIG.apis.euro);
        if (response.ok) {
            const data = await response.json();
            return data.promedio || data.price || null;
        }
    } catch (e) {
        console.log('Error fetching Euro online:', e);
    }
    
    if (rates.bcv) {
        console.log('Using saved BCV rate to estimate Euro');
        return rates.bcv * 1.07;
    }
    
    return null;
}

// ============================================
// UPDATE RATES
// ============================================

async function updateRates() {
    const hasSavedRates = rates.bcv || rates.euro || rates.usdt;
    
    if (!hasSavedRates) {
        elements.tasaBCV.textContent = '...';
        elements.fechaBCV.textContent = '';
        elements.tasaEuro.textContent = '...';
        elements.tasaUSDT.textContent = '...';
    }
    
    if (!checkConnection()) {
        console.log('No internet connection');
        elements.lastUpdate.textContent = '📴 Offline - Showing saved data';
        return;
    }
    
    elements.lastUpdate.textContent = 'Updating...';
    
    try {
        rates.bcv = await fetchBCVRate();
        if (rates.bcv) {
            elements.tasaBCV.textContent = formatNumber(rates.bcv, 4);
            if (bcvDate) {
                elements.fechaBCV.textContent = formatDate(bcvDate);
            }
        } else {
            elements.tasaBCV.textContent = 'Error';
            elements.fechaBCV.textContent = '';
        }
        
        rates.euro = await fetchEuroRate();
        if (rates.euro) {
            elements.tasaEuro.textContent = formatNumber(rates.euro, 2);
        } else {
            if (rates.bcv) {
                rates.euro = rates.bcv * 1.07;
                elements.tasaEuro.textContent = `${formatNumber(rates.euro, 2)} (est.)`;
            } else {
                elements.tasaEuro.textContent = 'N/A';
            }
        }
        
        rates.usdt = await fetchUSDTRate();
        if (rates.usdt) {
            elements.tasaUSDT.textContent = formatNumber(rates.usdt, 2);
        } else {
            elements.tasaUSDT.textContent = 'Unavailable';
        }
        
        // If custom mode is active, update the custom rate with new average
        if (customMode) {
            const average = calculateAverageRate();
            customRate = limitTwoDecimals(average);
            elements.customInput.value = formatNumber(customRate, 2);
        }
        
        // Save to storage
        saveRatesToStorage();
        
        const now = new Date();
        elements.lastUpdate.textContent = `Updated: ${now.toLocaleTimeString()}`;
        
        // Update conversion based on active rate
        if (lastEdited === 'usd') {
            const usd = parseNumber(elements.inputUSD.value);
            if (!isNaN(usd) && usd > 0) {
                elements.inputVES.value = formatNumber(convertUSDtoVES(usd), 2);
            }
        } else if (lastEdited === 'ves') {
            const ves = parseNumber(elements.inputVES.value);
            if (!isNaN(ves) && ves > 0) {
                elements.inputUSD.value = formatNumber(convertVEStoUSD(ves), 2);
            }
        }
        
        updateVisualFocus();
        
    } catch (error) {
        console.error('Error updating rates:', error);
        elements.lastUpdate.textContent = 'Connection error';
    }
}

// ============================================
// EVENT LISTENERS - Cards
// ============================================

elements.cards.bcv.addEventListener('click', () => {
    activateRate('bcv');
    elements.cards.bcv.style.transform = 'scale(0.98)';
    setTimeout(() => {
        elements.cards.bcv.style.transform = '';
    }, 150);
});

elements.cards.euro.addEventListener('click', () => {
    activateRate('euro');
    elements.cards.euro.style.transform = 'scale(0.98)';
    setTimeout(() => {
        elements.cards.euro.style.transform = '';
    }, 150);
});

elements.cards.usdt.addEventListener('click', () => {
    activateRate('usdt');
    elements.cards.usdt.style.transform = 'scale(0.98)';
    setTimeout(() => {
        elements.cards.usdt.style.transform = '';
    }, 150);
});

// ============================================
// EVENT LISTENERS - Custom Button
// ============================================

elements.btnCustom.addEventListener('click', () => {
    activateCustomRate();
});

// ============================================
// EVENT LISTENERS - Custom Input
// ============================================

elements.customInput.addEventListener('focus', () => {
    editingCustom = true;
    if (!customMode) {
        activateCustomRate();
    }
});

elements.customInput.addEventListener('input', (e) => {
    let value = e.target.value;
    
    // Format: only numbers, comma as decimal separator
    value = value.replace(/\./g, ',');
    
    const parts = value.split(',');
    if (parts.length > 2) {
        value = parts[0] + ',' + parts.slice(1).join('');
    }
    
    if (parts.length === 2 && parts[1].length > 2) {
        value = parts[0] + ',' + parts[1].substring(0, 2);
    }
    
    value = value.replace(/[^\d,]/g, '');
    
    if (e.target.value !== value) {
        e.target.value = value;
    }
    
    const numericValue = parseNumber(value);
    
    if (!isNaN(numericValue) && numericValue > 0) {
        customRate = limitTwoDecimals(numericValue);
        
        if (lastEdited === 'usd') {
            updateFromUSD();
        } else if (lastEdited === 'ves') {
            updateFromVES();
        }
    }
});

elements.customInput.addEventListener('blur', () => {
    const numericValue = parseNumber(elements.customInput.value);
    
    if (!isNaN(numericValue) && numericValue > 0) {
        customRate = limitTwoDecimals(numericValue);
        elements.customInput.value = formatNumber(customRate, 2);
    } else {
        elements.customInput.value = formatNumber(customRate, 2);
    }
    
    editingCustom = false;
});

// Allow Enter key to keep focus
elements.customInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        elements.customInput.focus();
    }
});

// ============================================
// EVENT LISTENERS - USD Input
// ============================================

elements.inputUSD.addEventListener('focus', (e) => {
    editingUSD = true;
    lastEdited = 'usd';
    updateVisualFocus();
    
    const numericValue = parseNumber(e.target.value);
    if (!isNaN(numericValue) && numericValue > 0) {
        e.target.value = numericValue.toString().replace('.', ',');
    } else {
        e.target.value = '';
    }
});

elements.inputUSD.addEventListener('input', (e) => {
    let value = e.target.value;
    
    value = value.replace(/\./g, ',');
    
    const parts = value.split(',');
    if (parts.length > 2) {
        value = parts[0] + ',' + parts.slice(1).join('');
    }
    
    if (parts.length === 2 && parts[1].length > 2) {
        value = parts[0] + ',' + parts[1].substring(0, 2);
    }
    
    value = value.replace(/[^\d,]/g, '');
    
    if (e.target.value !== value) {
        e.target.value = value;
    }
    
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
        updateFromUSD();
    }, 300);
});

elements.inputUSD.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(timeoutId);
        updateFromUSD();
    }
});

elements.inputUSD.addEventListener('blur', () => {
    const value = parseNumber(elements.inputUSD.value);
    if (!isNaN(value) && value > 0) {
        elements.inputUSD.value = formatNumber(value, 2);
    } else {
        elements.inputUSD.value = '';
    }
    editingUSD = false;
    updateVisualFocus();
});

// ============================================
// EVENT LISTENERS - VES Input
// ============================================

elements.inputVES.addEventListener('focus', (e) => {
    editingVES = true;
    lastEdited = 'ves';
    updateVisualFocus();
    
    const numericValue = parseNumber(e.target.value);
    if (!isNaN(numericValue) && numericValue > 0) {
        e.target.value = numericValue.toString().replace('.', ',');
    } else {
        e.target.value = '';
    }
});

elements.inputVES.addEventListener('input', (e) => {
    let value = e.target.value;
    
    value = value.replace(/\./g, ',');
    
    const parts = value.split(',');
    if (parts.length > 2) {
        value = parts[0] + ',' + parts.slice(1).join('');
    }
    
    if (parts.length === 2 && parts[1].length > 2) {
        value = parts[0] + ',' + parts[1].substring(0, 2);
    }
    
    value = value.replace(/[^\d,]/g, '');
    
    if (e.target.value !== value) {
        e.target.value = value;
    }
    
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
        updateFromVES();
    }, 300);
});

elements.inputVES.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(timeoutId);
        updateFromVES();
    }
});

elements.inputVES.addEventListener('blur', () => {
    const value = parseNumber(elements.inputVES.value);
    if (!isNaN(value) && value > 0) {
        elements.inputVES.value = formatNumber(value, 2);
    } else {
        elements.inputVES.value = '';
    }
    editingVES = false;
    updateVisualFocus();
});

// ============================================
// CONNECTION EVENT LISTENERS
// ============================================

window.addEventListener('online', () => {
    console.log('Connection restored, updating rates...');
    elements.lastUpdate.textContent = 'Connection restored, updating...';
    updateRates();
});

window.addEventListener('offline', () => {
    console.log('Offline, showing last saved rates');
    elements.lastUpdate.textContent = '📴 Offline - Showing last saved rates';
});

// ============================================
// INITIALIZATION
// ============================================

// Load saved rates
const ratesLoaded = loadRatesFromStorage();

if (ratesLoaded) {
    displaySavedRates();
    
    // Activate BCV by default
    activateRate('bcv');
    
    // Set initial values
    elements.inputUSD.value = '1,00';
    if (rates.bcv) {
        elements.inputVES.value = formatNumber(convertUSDtoVES(1), 2);
    } else {
        elements.inputVES.value = formatNumber(40.00, 2);
    }
} else {
    activateRate('bcv');
    elements.inputUSD.value = '1,00';
    elements.inputVES.value = formatNumber(40.00, 2);
}

// Set initial custom input value
elements.customInput.value = formatNumber(customRate, 2);

// Ensure custom input is hidden initially
elements.customContainer.classList.add('hidden');
elements.btnCustom.classList.remove('hidden');

// Set initial visual focus
lastEdited = 'usd';
updateVisualFocus();

// Fetch rates if online
if (checkConnection()) {
    updateRates();
} else {
    elements.lastUpdate.textContent = '📴 Offline - Showing last saved rates';
}

// Auto-update every 5 minutes
setInterval(() => {
    if (checkConnection()) {
        updateRates();
    }
}, 300000);