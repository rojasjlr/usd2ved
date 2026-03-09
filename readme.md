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
```
USD2VED/
├── index.html          # Página principal
├── manifest.json       # Configuración PWA
├── sw.js              # Service Worker
├── css/
│   └── styles.css     # Estilos de la aplicación
├── js/
│   └── app.js         # Lógica principal
└── assets/            # Vacío por ahora
```

## UI
Actualmente el orden es:
1. Título
2. Cards de tasas
3. Botones de modo
4. Resultado
5. Input de cantidad
6. Selector de tasa
7. Tasa personalizada (opcional)