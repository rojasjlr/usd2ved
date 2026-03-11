// ============================================
// USD2VED - Conversor de Divisas USD a Bs (VEB)
// ============================================

// Configuración de APIs
const CONFIG = {
    apis: {
        bcvPrincipal: 'https://bcv-api.rafnixg.dev/rates/',
        bcvRespaldo: 'https://ve.dolarapi.com/v1/dolares/oficial',
        euro: 'https://ve.dolarapi.com/v1/euros/oficial',
        usdt: 'https://criptoya.com/api/usdt/ves/1'
    }
};

// Estado de la aplicación
let tasas = {
    bcv: null,
    euro: null,
    usdt: null
};

let fechaTasaBCV = null;
let tasaPersonalizada = 0.00;
let editandoPersonalizada = false;
let editandoUSD = false;
let editandoVES = false;
let ultimoEditado = 'usd'; // 'usd' o 'ves' - por defecto USD
let timeoutId;

// Elementos del DOM
const elementos = {
    tasaBCV: document.getElementById('tasaBCV'),
    fechaBCV: document.getElementById('fechaBCV'),
    tasaEuro: document.getElementById('tasaEuro'),
    tasaUSDT: document.getElementById('tasaUSDT'),
    
    inputUSD: document.getElementById('inputUSD'),
    inputVES: document.getElementById('inputVES'),
    
    inputUSDGroup: document.querySelector('.input-usd'),
    inputVESGroup: document.querySelector('.input-ves'),
    
    personalizadaGroup: document.getElementById('personalizadaGroup'),
    tasaPersonalizadaInput: document.getElementById('tasaPersonalizadaInput'),
    
    radios: document.querySelectorAll('input[name="tasa"]'),
    
    ultimaActualizacion: document.getElementById('ultimaActualizacion'),
    
    cards: {
        bcv: document.getElementById('card-bcv'),
        euro: document.getElementById('card-euro'),
        usdt: document.getElementById('card-usdt')
    }
};

// ============================================
// FUNCIÓN PARA FORMATEAR NÚMERO
// ============================================
function formatearNumero(valor, decimales = 2) {
    if (valor === undefined || valor === null || isNaN(valor)) return 'N/A';
    
    let valorRedondeado = Number(valor).toFixed(decimales);
    let partes = valorRedondeado.split('.');
    let entero = partes[0];
    let decimal = partes[1];

    entero = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return entero + ',' + decimal;
}

// ============================================
// FUNCIÓN PARA PARSEAR NÚMERO CON FORMATO VENEZOLANO
// ============================================
function parsearNumero(valorStr) {
    if (!valorStr) return NaN;
    
    let limpio = valorStr.toString()
        .replace(/\./g, '')
        .replace(',', '.');
    
    return parseFloat(limpio);
}

// ============================================
// FUNCIÓN PARA LIMITAR A 2 DECIMALES
// ============================================
function limitarDosDecimales(valor) {
    if (isNaN(valor)) return 0;
    return Math.round(valor * 100) / 100;
}

// ============================================
// FUNCIÓN PARA FORMATEAR FECHA
// ============================================
function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    
    try {
        const fecha = new Date(fechaStr);
        if (isNaN(fecha.getTime())) return '';
        
        const dia = fecha.getDate().toString().padStart(2, '0');
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const año = fecha.getFullYear();
        
        return `📅 ${dia}/${mes}/${año}`;
    } catch (e) {
        return '';
    }
}

// ============================================
// FUNCIÓN PARA OBTENER TASA SELECCIONADA
// ============================================
function obtenerTasaSeleccionada() {
    for (const radio of elementos.radios) {
        if (radio.checked) {
            if (radio.value === 'personalizada') {
                return tasaPersonalizada;
            } else {
                return tasas[radio.value];
            }
        }
    }
    return tasas.bcv; // Default
}

// ============================================
// FUNCIONES DE CONVERSIÓN
// ============================================

function convertirUSDaVES(usd) {
    const tasa = obtenerTasaSeleccionada();
    if (!tasa || isNaN(usd)) return NaN;
    return usd * tasa;
}

function convertirVESaUSD(ves) {
    const tasa = obtenerTasaSeleccionada();
    if (!tasa || isNaN(ves)) return NaN;
    return ves / tasa;
}

// ============================================
// FUNCIONES PARA EFECTOS VISUALES
// ============================================

function actualizarEnfoqueVisual() {
    // Limpiar clases de edición
    elementos.inputUSDGroup.classList.remove('editing');
    elementos.inputVESGroup.classList.remove('editing');
    
    // Aplicar clase según el último editado
    if (ultimoEditado === 'usd') {
        elementos.inputUSDGroup.classList.add('editing');
    } else if (ultimoEditado === 'ves') {
        elementos.inputVESGroup.classList.add('editing');
    }
}

// ============================================
// FUNCIÓN PARA ACTUALIZAR DESDE USD
// ============================================
function actualizarDesdeUSD() {
    if (editandoVES) return; // Evitar loops
    
    editandoUSD = true;
    ultimoEditado = 'usd';
    actualizarEnfoqueVisual();
    
    const usd = parsearNumero(elementos.inputUSD.value);
    
    if (!isNaN(usd) && usd > 0) {
        const ves = convertirUSDaVES(usd);
        if (!isNaN(ves)) {
            elementos.inputVES.value = formatearNumero(ves, 2);
        }
    } else {
        elementos.inputVES.value = '';
    }
    
    // Efecto visual en la tarjeta seleccionada
    const tasaSeleccionada = obtenerRadioSeleccionado();
    if (tasaSeleccionada !== 'personalizada' && elementos.cards[tasaSeleccionada]) {
        Object.values(elementos.cards).forEach(card => {
            if (card) card.style.transform = 'scale(1)';
        });
        elementos.cards[tasaSeleccionada].style.transform = 'scale(1.02)';
        setTimeout(() => {
            elementos.cards[tasaSeleccionada].style.transform = 'scale(1)';
        }, 200);
    }
    
    editandoUSD = false;
}

// ============================================
// FUNCIÓN PARA ACTUALIZAR DESDE VES
// ============================================
function actualizarDesdeVES() {
    if (editandoUSD) return; // Evitar loops
    
    editandoVES = true;
    ultimoEditado = 'ves';
    actualizarEnfoqueVisual();
    
    const ves = parsearNumero(elementos.inputVES.value);
    
    if (!isNaN(ves) && ves > 0) {
        const usd = convertirVESaUSD(ves);
        if (!isNaN(usd)) {
            elementos.inputUSD.value = formatearNumero(usd, 2);
        }
    } else {
        elementos.inputUSD.value = '';
    }
    
    // Efecto visual en la tarjeta seleccionada
    const tasaSeleccionada = obtenerRadioSeleccionado();
    if (tasaSeleccionada !== 'personalizada' && elementos.cards[tasaSeleccionada]) {
        Object.values(elementos.cards).forEach(card => {
            if (card) card.style.transform = 'scale(1)';
        });
        elementos.cards[tasaSeleccionada].style.transform = 'scale(1.02)';
        setTimeout(() => {
            elementos.cards[tasaSeleccionada].style.transform = 'scale(1)';
        }, 200);
    }
    
    editandoVES = false;
}

// ============================================
// FUNCIÓN AUXILIAR PARA OBTENER RADIO SELECCIONADO
// ============================================
function obtenerRadioSeleccionado() {
    for (const radio of elementos.radios) {
        if (radio.checked) {
            return radio.value;
        }
    }
    return 'bcv';
}

// ============================================
// FUNCIÓN PARA CALCULAR PROMEDIO DE TASAS
// ============================================
function calcularPromedioTasas() {
    const tasasValidas = [];
    
    if (tasas.bcv && !isNaN(tasas.bcv)) tasasValidas.push(tasas.bcv);
    if (tasas.euro && !isNaN(tasas.euro)) tasasValidas.push(tasas.euro);
    if (tasas.usdt && !isNaN(tasas.usdt)) tasasValidas.push(tasas.usdt);
    
    if (tasasValidas.length === 0) return 40.00;
    
    const suma = tasasValidas.reduce((acc, tasa) => acc + tasa, 0);
    return suma / tasasValidas.length;
}

// ============================================
// FUNCIÓN PARA ACTUALIZAR TASA PERSONALIZADA
// ============================================
function actualizarTasaPersonalizadaPorDefecto() {
    if (!editandoPersonalizada) {
        const promedio = calcularPromedioTasas();
        tasaPersonalizada = limitarDosDecimales(promedio);
        elementos.tasaPersonalizadaInput.value = formatearNumero(tasaPersonalizada, 2);
    }
}

// ============================================
// FUNCIONES DE APIs
// ============================================

async function obtenerTasaBCV() {
    try {
        const response = await fetch(CONFIG.apis.bcvPrincipal);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Tasa BCV obtenida de API principal:', data.dollar);
            
            if (data.date) {
                fechaTasaBCV = data.date;
            }
            
            return data.dollar;
        }
    } catch (e) {
        console.log('⚠️ Error con API principal, usando respaldo:', e);
    }
    
    try {
        const response = await fetch(CONFIG.apis.bcvRespaldo);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Tasa BCV obtenida de API respaldo:', data.promedio || data.price);
            
            if (data.fechaActualizacion || data.date) {
                fechaTasaBCV = data.fechaActualizacion || data.date;
            }
            
            return data.promedio || data.price;
        }
    } catch (e) {
        console.error('❌ Ambas APIs de BCV fallaron:', e);
    }
    
    return null;
}

async function obtenerTasaUSDT() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(CONFIG.apis.usdt, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data.binancep2p && data.binancep2p.bid) {
            console.log('✅ Usando BID de Binance P2P:', data.binancep2p.bid);
            return data.binancep2p.bid;
        }
        
        return null;
        
    } catch (e) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') {
            console.error('⏰ Timeout obteniendo USDT');
        } else {
            console.error('Error obteniendo USDT:', e);
        }
        return null;
    }
}

async function obtenerTasaEuro() {
    try {
        const response = await fetch(CONFIG.apis.euro);
        if (response.ok) {
            const data = await response.json();
            return data.promedio || data.price || null;
        }
    } catch (e) {}
    
    if (tasas.bcv) return tasas.bcv * 1.07;
    return null;
}

// ============================================
// ACTUALIZAR TASAS
// ============================================

async function actualizarTasas() {
    elementos.tasaBCV.textContent = '...';
    elementos.fechaBCV.textContent = '';
    elementos.tasaEuro.textContent = '...';
    elementos.tasaUSDT.textContent = '...';
    elementos.ultimaActualizacion.textContent = 'Actualizando...';
    
    try {
        tasas.bcv = await obtenerTasaBCV();
        if (tasas.bcv) {
            elementos.tasaBCV.textContent = formatearNumero(tasas.bcv, 4);
            if (fechaTasaBCV) {
                elementos.fechaBCV.textContent = formatearFecha(fechaTasaBCV);
            }
        } else {
            elementos.tasaBCV.textContent = 'Error';
            elementos.fechaBCV.textContent = '';
        }
        
        tasas.euro = await obtenerTasaEuro();
        if (tasas.euro) {
            elementos.tasaEuro.textContent = formatearNumero(tasas.euro, 2);
        } else {
            if (tasas.bcv) {
                tasas.euro = tasas.bcv * 1.07;
                elementos.tasaEuro.textContent = `${formatearNumero(tasas.euro, 2)} (est.)`;
            } else {
                elementos.tasaEuro.textContent = 'N/A';
            }
        }
        
        tasas.usdt = await obtenerTasaUSDT();
        if (tasas.usdt) {
            elementos.tasaUSDT.textContent = formatearNumero(tasas.usdt, 2);
        } else {
            elementos.tasaUSDT.textContent = 'No disponible';
        }
        
        actualizarTasaPersonalizadaPorDefecto();
        
        ultimaActualizacion = new Date();
        elementos.ultimaActualizacion.textContent = `Actualizado: ${ultimaActualizacion.toLocaleTimeString()}`;
        
        // Actualizar conversión basada en el último campo editado
        if (ultimoEditado === 'usd') {
            const usd = parsearNumero(elementos.inputUSD.value);
            if (!isNaN(usd) && usd > 0) {
                elementos.inputVES.value = formatearNumero(convertirUSDaVES(usd), 2);
            }
        } else if (ultimoEditado === 'ves') {
            const ves = parsearNumero(elementos.inputVES.value);
            if (!isNaN(ves) && ves > 0) {
                elementos.inputUSD.value = formatearNumero(convertirVESaUSD(ves), 2);
            }
        }
        
        // Mantener el enfoque visual
        actualizarEnfoqueVisual();
        
    } catch (error) {
        console.error('Error actualizando tasas:', error);
        elementos.ultimaActualizacion.textContent = 'Error de conexión';
    }
}

// ============================================
// EVENTOS PARA INPUT USD
// ============================================

elementos.inputUSD.addEventListener('focus', (e) => {
    editandoUSD = true;
    ultimoEditado = 'usd';
    actualizarEnfoqueVisual();
    
    const valorNumerico = parsearNumero(e.target.value);
    if (!isNaN(valorNumerico) && valorNumerico > 0) {
        e.target.value = valorNumerico.toString().replace('.', ',');
    } else {
        e.target.value = '';
    }
});

elementos.inputUSD.addEventListener('input', (e) => {
    let valor = e.target.value;
    
    valor = valor.replace(/\./g, ',');
    
    const partes = valor.split(',');
    if (partes.length > 2) {
        valor = partes[0] + ',' + partes.slice(1).join('');
    }
    
    if (partes.length === 2 && partes[1].length > 2) {
        valor = partes[0] + ',' + partes[1].substring(0, 2);
    }
    
    valor = valor.replace(/[^\d,]/g, '');
    
    if (e.target.value !== valor) {
        e.target.value = valor;
    }
    
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
        actualizarDesdeUSD();
    }, 300);
});

elementos.inputUSD.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(timeoutId);
        actualizarDesdeUSD();
    }
});

elementos.inputUSD.addEventListener('blur', () => {
    const valor = parsearNumero(elementos.inputUSD.value);
    if (!isNaN(valor) && valor > 0) {
        elementos.inputUSD.value = formatearNumero(valor, 2);
    } else {
        elementos.inputUSD.value = '';
    }
    editandoUSD = false;
    // NO desactivamos el enfoque visual, se mantiene el último editado
});

// ============================================
// EVENTOS PARA INPUT VES
// ============================================

elementos.inputVES.addEventListener('focus', (e) => {
    editandoVES = true;
    ultimoEditado = 'ves';
    actualizarEnfoqueVisual();
    
    const valorNumerico = parsearNumero(e.target.value);
    if (!isNaN(valorNumerico) && valorNumerico > 0) {
        e.target.value = valorNumerico.toString().replace('.', ',');
    } else {
        e.target.value = '';
    }
});

elementos.inputVES.addEventListener('input', (e) => {
    let valor = e.target.value;
    
    valor = valor.replace(/\./g, ',');
    
    const partes = valor.split(',');
    if (partes.length > 2) {
        valor = partes[0] + ',' + partes.slice(1).join('');
    }
    
    if (partes.length === 2 && partes[1].length > 2) {
        valor = partes[0] + ',' + partes[1].substring(0, 2);
    }
    
    valor = valor.replace(/[^\d,]/g, '');
    
    if (e.target.value !== valor) {
        e.target.value = valor;
    }
    
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
        actualizarDesdeVES();
    }, 300);
});

elementos.inputVES.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(timeoutId);
        actualizarDesdeVES();
    }
});

elementos.inputVES.addEventListener('blur', () => {
    const valor = parsearNumero(elementos.inputVES.value);
    if (!isNaN(valor) && valor > 0) {
        elementos.inputVES.value = formatearNumero(valor, 2);
    } else {
        elementos.inputVES.value = '';
    }
    editandoVES = false;
    // NO desactivamos el enfoque visual, se mantiene el último editado
});

// ============================================
// EVENTOS PARA RADIO BUTTONS
// ============================================

elementos.radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        elementos.personalizadaGroup.style.display = 
            e.target.value === 'personalizada' ? 'block' : 'none';
        
        // Al cambiar la tasa, actualizar según el último campo editado
        if (ultimoEditado === 'usd') {
            actualizarDesdeUSD();
        } else if (ultimoEditado === 'ves') {
            actualizarDesdeVES();
        }
    });
});

// ============================================
// EVENTOS PARA TASA PERSONALIZADA
// ============================================

elementos.tasaPersonalizadaInput.addEventListener('focus', () => {
    editandoPersonalizada = true;
    if (tasaPersonalizada && tasaPersonalizada > 0) {
        elementos.tasaPersonalizadaInput.value = tasaPersonalizada.toString().replace('.', ',');
    } else {
        elementos.tasaPersonalizadaInput.value = '';
    }
});

elementos.tasaPersonalizadaInput.addEventListener('input', (e) => {
    let valor = e.target.value;
    
    valor = valor.replace(/\./g, ',');
    
    const partes = valor.split(',');
    if (partes.length > 2) {
        valor = partes[0] + ',' + partes.slice(1).join('');
    }
    
    if (partes.length === 2 && partes[1].length > 2) {
        valor = partes[0] + ',' + partes[1].substring(0, 2);
    }
    
    valor = valor.replace(/[^\d,]/g, '');
    
    e.target.value = valor;
    
    const valorNumerico = parsearNumero(valor);
    
    if (!isNaN(valorNumerico) && valorNumerico > 0) {
        tasaPersonalizada = limitarDosDecimales(valorNumerico);
        
        // Si la tasa personalizada está seleccionada, actualizar según último editado
        if (obtenerRadioSeleccionado() === 'personalizada') {
            if (ultimoEditado === 'usd') {
                actualizarDesdeUSD();
            } else if (ultimoEditado === 'ves') {
                actualizarDesdeVES();
            }
        }
    }
});

elementos.tasaPersonalizadaInput.addEventListener('blur', () => {
    const valorNumerico = parsearNumero(elementos.tasaPersonalizadaInput.value);
    
    if (!isNaN(valorNumerico) && valorNumerico > 0) {
        tasaPersonalizada = limitarDosDecimales(valorNumerico);
        elementos.tasaPersonalizadaInput.value = formatearNumero(tasaPersonalizada, 2);
    } else {
        elementos.tasaPersonalizadaInput.value = '';
    }
    
    editandoPersonalizada = false;
});

// ============================================
// INICIO
// ============================================

// Establecer valores iniciales
elementos.inputUSD.value = '1,00';
const tasaInicial = obtenerTasaSeleccionada();
if (tasaInicial) {
    elementos.inputVES.value = formatearNumero(convertirUSDaVES(1), 2);
}

// Establecer enfoque visual inicial en USD
ultimoEditado = 'usd';
actualizarEnfoqueVisual();

actualizarTasas();
setInterval(actualizarTasas, 300000);
