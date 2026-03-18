# Proyecto USD2VED
Convertir precios segun tasa de conversion a usar (Oficial: BCV, No-Oficiales: varias)

## 🎯 Funcionalidades Principales

**Conversor USD ↔ VES** con:
- **4 tasas de cambio** (BCV, No-Oficial, USDT, Euro BCV)
- **2 modos de conversión** (USD→Bs y Bs→USD)
- **Selector de tasa** (incluye opción personalizada)
- **Actualización automática** cada 5 minutos
- **PWA** (instalable, funciona offline)

## 🔧 APIs Utilizadas
- `ve.dolarapi.com` (oficial, paralelo, euro)
- Múltiples fuentes para USDT (con fallbacks)
## 📁 Estructura de Archivos
USD2VED/
│
├── index.html          # Página principal de la aplicación
├── manifest.json       # Configuración PWA (permite instalar la app)
├── sw.js               # Service Worker (para funcionamiento offline)
├── readme.md           # Documentación del proyecto
│
├── assets/             # Recursos estáticos
│   └── icon-512.png    # Icono principal de la aplicación
│
├── css/                # Estilos
│   └── styles.css      # Hoja de estilos principal
│
└── js/                 # JavaScript
    └── app.js          # Lógica principal de la aplicación

## UI
Actualmente el orden es:
1. Título
2. Cards de tasas
3. Input y Resultado $
4. Input y Resultado Bs 
6. Selector de tasa
7. Tasa personalizada (opcional)

## Cards como selectores.
┌─────────────────────┐
│    USD ↔ VED        │ ← Título
├─────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐
│ │ BCV │ │ EURO│ │USDT │ ← Cards clickeables
│ │36.50│ │39.06│ │38.20│   (la activa tiene borde)
│ └─────┘ └─────┘ └─────┘
├─────────────────────┤
│ [ + Tasa Personal ]  │ ← Botón para activar
├─────────────────────┤
│                      │
│   💵 USD            │ ← Input USD
│   ┌────────────┐    │   (verde por defecto)
│   │ 1,00       │    │
│   └────────────┘    │
│                      │
│   💶 VED            │ ← Input VES
│   ┌────────────┐    │   (azul por defecto)
│   │ 36,50      │    │
│   └────────────┘    │
│                      │
├─────────────────────┤
│ Actualizado: 10:30   │
└─────────────────────┘

[Modo Personalizado Activado]
┌─────────────────────┐
│    USD ↔ VED        │
├─────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐
│ │ BCV │ │ EURO│ │USDT │ ← Cards deshabilitadas?
│ │36.50│ │39.06│ │38.20│   (opcional: mantener info)
│ └─────┘ └─────┘ └─────┘
├─────────────────────┤
│ [✓ Tasa Personal]    │ ← Botón activo
├─────────────────────┤
│ Tasa: 40,00         │ ← Input de tasa personalizada
│ ┌────────────┐      │   (aparece aquí)
│ │ 40,00      │      │
│ └────────────┘      │
├─────────────────────┤
│   💵 USD            │
│   ┌────────────┐    │
│   │ 1,00       │    │
│   └────────────┘    │
│   💶 VED            │
│   ┌────────────┐    │
│   │ 40,00      │    │
│   └────────────┘    │
└─────────────────────┘
