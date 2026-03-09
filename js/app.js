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

// Elementos del DOM
const elementos = {
    // Cards
    tasaBCV: document.getElementById('tasaBCV'),
    tasaEuro: document.getElementById('tasaEuro'),
    tasaUSDT: document.getElementById('tasaUSDT'),
    
    // Botones modo
    btnUSDaBs: document.getElementById('btnUSDaBs'),
    btnBsaUSD: document.getElementById('btnBsaUSD'),
    
    // Inputs
    cantidad: document.getElementById('cantidad'),
    labelCantidad: document.getElementById('labelCantidad'),
    
    // Tasa personalizada
    personalizadaGroup: document.getElementById('personalizadaGroup'),
    tasaPersonalizadaInput: document.getElementById('tasaPersonalizadaInput'),
    
    // Radios
    radios: document.querySelectorAll('input[name="tasa"]'),
    
    // Resultados
    resultadoValor: document.getElementById('resultadoValor'),
    resultadoDetalle: document.getElementById('resultadoDetalle'),
    ultimaActualizacion: document.getElementById('ultimaActualizacion'),
    
    // Cards para resaltar
    cards: {
        bcv: document.getElementById('card-bcv'),
        euro: document.getElementById('card-euro'),
        usdt: document.getElementById('card-usdt')
    }
};

// ============================================
// FUNCIÓN PARA FORMATEAR NÚMERO (sin símbolo moneda)
// ============================================
function formatearNumero(valor, decimales = 2) {
    if (valor === undefined || valor === null || isNaN(valor)) return 'N/A';
    
    return new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales
    }).format(valor);
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
    const promedio = calcularPromedioTasas();
    tasaPersonalizada = promedio;
    elementos.tasaPersonalizadaInput.value = formatearNumero(promedio, 2);
}

// ============================================
// FUNCIONES DE APIs
// ============================================

// Obtener USDT - USA EL BID DE BINANCE P2P
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

// Obtener Euro
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
    const cantidad = parseFloat(elementos.cantidad.value);
    
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
    
    // Resaltar card seleccionada
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
        
        // BCV (4 decimales)
        if (resBCV.ok) {
            const data = await resBCV.json();
            tasas.bcv = data.promedio || data.price;
            elementos.tasaBCV.textContent = tasas.bcv ? 
                formatearNumero(tasas.bcv, 4) : 'N/A';
        } else {
            elementos.tasaBCV.textContent = 'Error';
        }
        
        // Euro (2 decimales)
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
        
        // USDT (2 decimales)
        tasas.usdt = await obtenerTasaUSDT();
        elementos.tasaUSDT.textContent = tasas.usdt ? 
            formatearNumero(tasas.usdt, 2) : 'No disponible';
        
        // Actualizar tasa personalizada
        actualizarTasaPersonalizadaPorDefecto();
        
        ultimaActualizacion = new Date();
        elementos.ultimaActualizacion.textContent = `Actualizado: ${ultimaActualizacion.toLocaleTimeString()}`;
        
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

elementos.tasaPersonalizadaInput.addEventListener('input', () => {
    let valorStr = elementos.tasaPersonalizadaInput.value.replace(/[^\d.,-]/g, '');
    valorStr = valorStr.replace(',', '.');
    const valor = parseFloat(valorStr);
    
    if (!isNaN(valor) && valor > 0) {
        tasaPersonalizada = valor;
        
        let tasaSeleccionada = 'bcv';
        for (const radio of elementos.radios) {
            if (radio.checked) {
                tasaSeleccionada = radio.value;
                break;
            }
        }
        if (tasaSeleccionada === 'personalizada' && elementos.cantidad.value) {
            convertir();
        }
        
        elementos.tasaPersonalizadaInput.value = formatearNumero(valor, 2);
    }
});

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

let timeoutId;
elementos.cantidad.addEventListener('input', () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(convertir, 300);
});

elementos.cantidad.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') convertir();
});

elementos.cantidad.addEventListener('blur', () => {
    const valor = parseFloat(elementos.cantidad.value);
    if (!isNaN(valor) && valor > 0) {
        elementos.cantidad.value = formatearNumero(valor, 2);
    }
});

// ============================================
// INICIO
// ============================================

actualizarTasas();
setInterval(actualizarTasas, 300000);