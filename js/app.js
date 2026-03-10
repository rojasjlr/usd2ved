// ============================================
// USD2VED - Conversor de Divisas USD a Bs (VEB)
// ============================================

// Configuración de APIs
const CONFIG = {
    apis: {
        bcv: 'https://ve.dolarapi.com/v1/dolares/oficial',
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

let tasaPersonalizada = 0.00;
let modo = 'USDaBs';
let ultimaActualizacion = null;
let editandoPersonalizada = false;
let editandoCantidad = false;
let timeoutId;

// Elementos del DOM
const elementos = {
    tasaBCV: document.getElementById('tasaBCV'),
    tasaEuro: document.getElementById('tasaEuro'),
    tasaUSDT: document.getElementById('tasaUSDT'),
    
    btnUSDaBs: document.getElementById('btnUSDaBs'),
    btnBsaUSD: document.getElementById('btnBsaUSD'),
    
    cantidad: document.getElementById('cantidad'),
    labelCantidad: document.getElementById('labelCantidad'),
    
    personalizadaGroup: document.getElementById('personalizadaGroup'),
    tasaPersonalizadaInput: document.getElementById('tasaPersonalizadaInput'),
    
    radios: document.querySelectorAll('input[name="tasa"]'),
    
    resultadoValor: document.getElementById('resultadoValor'),
    resultadoDetalle: document.getElementById('resultadoDetalle'),
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
    
    return new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    }).format(valor);
}

// ============================================
// FUNCIÓN PARA PARSEAR NÚMERO CON FORMATO VENEZOLANO
// ============================================
function parsearNumero(valorStr) {
    if (!valorStr) return NaN;
    
    // Reemplazar puntos por nada (separadores de miles) y coma por punto (decimal)
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
// FUNCIÓN PARA OBTENER VALOR ACTUAL DEL INPUT
// ============================================
function obtenerCantidad() {
    return parsearNumero(elementos.cantidad.value);
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

async function obtenerTasaUSDT() {
    try {
        const response = await fetch(CONFIG.apis.usdt, { timeout: 5000 });
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data.binancep2p && data.binancep2p.bid) {
            console.log('✅ Usando BID de Binance P2P:', data.binancep2p.bid);
            return data.binancep2p.bid;
        }
        
        return null;
        
    } catch (e) {
        console.error('Error obteniendo USDT:', e);
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
// CONVERSIÓN
// ============================================

function convertir() {
    const cantidad = obtenerCantidad();
    
    if (isNaN(cantidad) || cantidad <= 0) {
        elementos.resultadoValor.textContent = formatearNumero(0, 2);
        elementos.resultadoDetalle.textContent = 'Ingresa una cantidad';
        return;
    }
    
    let tasaSeleccionada = 'bcv';
    for (const radio of elementos.radios) {
        if (radio.checked) {
            tasaSeleccionada = radio.value;
            break;
        }
    }
    
    let tasa;
    if (tasaSeleccionada === 'personalizada') {
        tasa = tasaPersonalizada;
    } else {
        tasa = tasas[tasaSeleccionada];
    }
    
    if (!tasa) {
        elementos.resultadoValor.textContent = formatearNumero(0, 2);
        elementos.resultadoDetalle.textContent = 'Tasa no disponible';
        return;
    }
    
    let resultado;
    let decimalesTasa = tasaSeleccionada === 'bcv' ? 4 : 2;
    
    if (modo === 'USDaBs') {
        resultado = cantidad * tasa;
        
        const cantidadFormateada = formatearNumero(cantidad, 2);
        const tasaFormateada = formatearNumero(tasa, decimalesTasa);
        const resultadoFormateado = formatearNumero(resultado, 2);
        
        elementos.resultadoDetalle.textContent = 
            `${cantidadFormateada} USD × ${tasaFormateada} = ${resultadoFormateado} Bs`;
        
        elementos.resultadoValor.textContent = formatearNumero(resultado, 2);
        
    } else {
        resultado = cantidad / tasa;
        
        const cantidadFormateada = formatearNumero(cantidad, 2);
        const tasaFormateada = formatearNumero(tasa, decimalesTasa);
        const resultadoFormateado = formatearNumero(resultado, 4);
        
        elementos.resultadoDetalle.textContent = 
            `${cantidadFormateada} Bs ÷ ${tasaFormateada} = ${resultadoFormateado} USD`;
        
        elementos.resultadoValor.textContent = formatearNumero(resultado, 4);
    }
    
    if (tasaSeleccionada !== 'personalizada') {
        Object.values(elementos.cards).forEach(card => {
            if (card) card.style.transform = 'scale(1)';
        });
        if (elementos.cards[tasaSeleccionada]) {
            elementos.cards[tasaSeleccionada].style.transform = 'scale(1.02)';
            setTimeout(() => {
                elementos.cards[tasaSeleccionada].style.transform = 'scale(1)';
            }, 200);
        }
    }
}

// ============================================
// ACTUALIZAR TASAS
// ============================================

async function actualizarTasas() {
    elementos.tasaBCV.textContent = '...';
    elementos.tasaEuro.textContent = '...';
    elementos.tasaUSDT.textContent = '...';
    elementos.ultimaActualizacion.textContent = 'Actualizando...';
    
    try {
        const [resBCV, resEuro] = await Promise.all([
            fetch(CONFIG.apis.bcv),
            fetch(CONFIG.apis.euro)
        ]);
        
        if (resBCV.ok) {
            const data = await resBCV.json();
            tasas.bcv = data.promedio || data.price;
            elementos.tasaBCV.textContent = tasas.bcv ? 
                formatearNumero(tasas.bcv, 4) : 'N/A';
        } else {
            elementos.tasaBCV.textContent = 'Error';
        }
        
        if (resEuro.ok) {
            const data = await resEuro.json();
            tasas.euro = data.promedio || data.price;
            elementos.tasaEuro.textContent = tasas.euro ? 
                formatearNumero(tasas.euro, 2) : 'N/A';
        } else {
            if (tasas.bcv) {
                tasas.euro = tasas.bcv * 1.07;
                elementos.tasaEuro.textContent = `${formatearNumero(tasas.euro, 2)} (est.)`;
            } else {
                elementos.tasaEuro.textContent = 'N/A';
            }
        }
        
        tasas.usdt = await obtenerTasaUSDT();
        elementos.tasaUSDT.textContent = tasas.usdt ? 
            formatearNumero(tasas.usdt, 2) : 'No disponible';
        
        actualizarTasaPersonalizadaPorDefecto();
        
        ultimaActualizacion = new Date();
        elementos.ultimaActualizacion.textContent = `Actualizado: ${ultimaActualizacion.toLocaleTimeString()}`;
        
        // Solo formatear si no está en edición
        if (!editandoCantidad) {
            const cantidadActual = obtenerCantidad();
            if (!isNaN(cantidadActual) && cantidadActual > 0) {
                elementos.cantidad.value = formatearNumero(cantidadActual, 2);
            }
        }
        
        convertir();
        
    } catch (error) {
        console.error('Error actualizando tasas:', error);
        elementos.ultimaActualizacion.textContent = 'Error de conexión';
    }
}

// ============================================
// EVENTOS
// ============================================

elementos.radios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        elementos.personalizadaGroup.style.display = 
            e.target.value === 'personalizada' ? 'block' : 'none';
        convertir();
    });
});

// ============================================
// EVENTOS PARA CANTIDAD
// ============================================

// Al hacer focus, mostrar el número sin formato
elementos.cantidad.addEventListener('focus', (e) => {
    editandoCantidad = true;
    const valorNumerico = obtenerCantidad();
    if (!isNaN(valorNumerico) && valorNumerico > 0) {
        // Mostrar sin separadores de miles, solo con coma decimal
        e.target.value = valorNumerico.toString().replace('.', ',');
    } else {
        e.target.value = '';
    }
});

elementos.cantidad.addEventListener('input', (e) => {
    let valor = e.target.value;
    
    // REEMPLAZAR PUNTO POR COMA INMEDIATAMENTE
    valor = valor.replace(/\./g, ',');
    
    // Prevenir más de una coma
    const partes = valor.split(',');
    if (partes.length > 2) {
        valor = partes[0] + ',' + partes.slice(1).join('');
    }
    
    // Limitar decimales a 2 después de la coma
    if (partes.length === 2 && partes[1].length > 2) {
        valor = partes[0] + ',' + partes[1].substring(0, 2);
    }
    
    // Solo permitir dígitos y coma
    valor = valor.replace(/[^\d,]/g, '');
    
    // Actualizar el input con el valor corregido
    if (e.target.value !== valor) {
        e.target.value = valor;
    }
    
    // CANCELAR cualquier timeout pendiente
    clearTimeout(timeoutId);
    
    // Crear NUEVO timeout para convertir después de 300ms
    timeoutId = setTimeout(() => {
        convertir();
    }, 300);
});

elementos.cantidad.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(timeoutId);
        convertir();
    }
});

// Al salir del campo, formatear con separadores de miles
elementos.cantidad.addEventListener('blur', () => {
    editandoCantidad = false;
    const valor = obtenerCantidad();
    if (!isNaN(valor) && valor > 0) {
        elementos.cantidad.value = formatearNumero(valor, 2);
    } else {
        elementos.cantidad.value = '';
    }
});

// ============================================
// EVENTOS PARA TASA PERSONALIZADA
// ============================================
elementos.tasaPersonalizadaInput.addEventListener('focus', () => {
    editandoPersonalizada = true;
    // Mostrar valor sin formato para editar
    if (tasaPersonalizada && tasaPersonalizada > 0) {
        elementos.tasaPersonalizadaInput.value = tasaPersonalizada.toString().replace('.', ',');
    } else {
        elementos.tasaPersonalizadaInput.value = '';
    }
});

elementos.tasaPersonalizadaInput.addEventListener('input', (e) => {
    let valor = e.target.value;
    
    // REEMPLAZAR PUNTO POR COMA INMEDIATAMENTE
    valor = valor.replace(/\./g, ',');
    
    // Prevenir más de una coma
    const partes = valor.split(',');
    if (partes.length > 2) {
        valor = partes[0] + ',' + partes.slice(1).join('');
    }
    
    // Limitar decimales a 2
    if (partes.length === 2 && partes[1].length > 2) {
        valor = partes[0] + ',' + partes[1].substring(0, 2);
    }
    
    // Solo permitir dígitos y coma
    valor = valor.replace(/[^\d,]/g, '');
    
    e.target.value = valor;
    
    const valorNumerico = parsearNumero(valor);
    
    if (!isNaN(valorNumerico) && valorNumerico > 0) {
        tasaPersonalizada = limitarDosDecimales(valorNumerico);
        
        let tasaSeleccionada = 'bcv';
        for (const radio of elementos.radios) {
            if (radio.checked) {
                tasaSeleccionada = radio.value;
                break;
            }
        }
        if (tasaSeleccionada === 'personalizada' && obtenerCantidad() > 0) {
            convertir();
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
// EVENTOS PARA MODO
// ============================================
elementos.btnUSDaBs.addEventListener('click', () => {
    elementos.btnUSDaBs.classList.add('active');
    elementos.btnBsaUSD.classList.remove('active');
    modo = 'USDaBs';
    elementos.labelCantidad.textContent = 'Cantidad en USD';
    convertir();
});

elementos.btnBsaUSD.addEventListener('click', () => {
    elementos.btnBsaUSD.classList.add('active');
    elementos.btnUSDaBs.classList.remove('active');
    modo = 'BsaUSD';
    elementos.labelCantidad.textContent = 'Cantidad en Bs';
    convertir();
});

// ============================================
// INICIO
// ============================================

actualizarTasas();
setInterval(actualizarTasas, 300000);
