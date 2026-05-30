# Frontend — Panel Ruta Cinépolis

Panel web de administración y operaciones de caja para el programa de membresía Ruta Cinépolis.

---

## Stack tecnológico

| Herramienta | Versión | Rol |
|---|---|---|
| React | 18 | UI con hooks y context |
| Vite | 5 | Bundler + dev server con proxy |
| React Router DOM | 6 | Navegación SPA |
| Axios | 1.7 | Cliente HTTP con interceptores |
| Recharts | 2.12 | Gráficas (area, bar, pie) |
| Tabler Icons | latest | Iconografía (CDN webfont) |
| Barlow | — | Tipografía (Google Fonts CDN) |

No usa Tailwind en los componentes de negocio. Los estilos son inline o con `<style>` scoped por página para máxima portabilidad.

---

## Estructura de archivos

```
frontend/
├── src/
│   ├── api/
│   │   ├── axios.js          ← Instancia axios + interceptores JWT
│   │   └── index.js          ← Funciones por dominio (login, getMembers, etc.)
│   ├── context/
│   │   └── AuthContext.jsx   ← Estado global de sesión
│   ├── components/
│   │   └── Layout/
│   │       ├── AdminLayout.jsx   ← Sidebar + outlet para rutas /admin/*
│   │       └── CajeroLayout.jsx  ← Sidebar + outlet para rutas /cajero/*
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Miembros.jsx
│   │   │   ├── Beneficios.jsx
│   │   │   ├── Reportes.jsx
│   │   │   ├── Staff.jsx
│   │   │   ├── Merchandising.jsx
│   │   │   ├── Configuracion.jsx
│   │   │   └── Auditoria.jsx
│   │   └── cajero/
│   │       ├── BuscarMiembro.jsx
│   │       ├── RegistrarMiembro.jsx
│   │       ├── RegistrarCompra.jsx
│   │       └── AplicarCanje.jsx
│   ├── App.jsx               ← Router con rutas protegidas por rol
│   ├── main.jsx              ← Punto de entrada
│   └── index.css             ← Reset global
├── index.html
├── package.json
└── vite.config.js            ← Proxy /api → localhost:3001
```

---

## Instalación y arranque

```bash
cd frontend
npm install
npm run dev
# Abre http://localhost:5173
```

El backend debe estar corriendo en `localhost:3001` antes de iniciar el frontend.

---

## Variables de entorno

El frontend **no requiere archivo `.env`** en desarrollo. El proxy de Vite redirige automáticamente `/api/*` al backend.

Para producción, configura la URL del API en `vite.config.js` o a través de variables de entorno Vite:

```env
# .env.production
VITE_API_URL=https://api.tudominio.com
```

---

## Roles y acceso

| Rol | Acceso |
|---|---|
| `ADMINISTRADOR` | Panel `/admin/*` completo + vistas de cajero |
| `CAJERO` | Solo vistas `/cajero/*` |

La sesión se guarda en localStorage:
- `rc_token` — JWT de acceso (8h)
- `rc_refresh` — JWT de renovación (7d)
- `rc_user` — `{ id, email, role }` del usuario

El `AuthContext` lee estos valores al cargar la app. Si `rc_token` expira durante la sesión, el interceptor de axios lo renueva automáticamente con `rc_refresh`. Si el refresh también falla, redirige a `/login`.

---

## Sistema de diseño

### Paleta de colores

| Variable | Valor | Uso |
|---|---|---|
| NAVY | `#212E5C` | Color principal, sidebar, botones primarios |
| GOLD | `#e8b84b` | Acento nivel Golden, estrellas de puntos |
| GREEN | `#27a86a` | Acciones positivas, cajero online, éxito |
| RED | `#e53e3e` | Errores, alertas, suspendidos |
| BORDER | `#eaecf3` | Bordes de tarjetas e inputs |
| BG | `#f4f5f8` | Fondo de páginas |

### Tipografía
Barlow (Google Fonts). Pesos usados: 400, 500, 600, 700, 800.

### Iconos
Tabler Icons via CDN webfont. Uso: `<i className="ti ti-nombre-icono" />`.
Los layouts los cargan como `<link>` en el head; las páginas individuales los importan con `@import` en el bloque `<style>`.

### Niveles de membresía — colores en UI

| Nivel | Fondo | Color texto | Icono |
|---|---|---|---|
| ESTANDAR | `#f1f5f9` | `#475569` | `ti-user` |
| PREMIUM | `#e8ecf5` | `#212E5C` (NAVY) | `ti-user-star` |
| GOLDEN | `#fef9ec` | `#92650a` | `ti-crown` |

---

## Páginas — descripción detallada

### Login (`/login`)
- Formulario email + contraseña con toggle de visibilidad
- Panel decorativo izquierdo con animaciones (solo desktop)
- Redirección automática por rol tras login exitoso
- Mensajes de error del backend en línea

### AdminDashboard (`/admin/dashboard`)
- **KPI cards** (4): Total miembros, Nuevos en período, Ingresos totales, Transacciones
- **Banner de puntos** con total generado en el período y promedio por miembro
- **Area chart** de crecimiento mensual (Recharts, año actual)
- **Pie chart + cards** de distribución por nivel
- **Tabla** de top 5 miembros por gasto
- Botón de actualización manual, estado de carga con skeletons, y estado de error con botón "Reintentar"

### Miembros (`/admin/miembros`)
- Tabla paginada (20/página) con búsqueda por nombre/DNI/tarjeta y filtros por estado y nivel
- Badge de estado (Activo/Inactivo/Suspendido) y nivel con punto de color
- **Modal de cambio de estado**: selección visual con 3 opciones
- **Modal de ajuste de puntos**: preview del saldo resultante antes de confirmar
- Toast de notificación con auto-cierre a 3.5s

### Beneficios (`/admin/beneficios`)
- Grid de cards de beneficios con tipo, descripción y niveles asignados
- Modal de creación/edición con selector múltiple de niveles

### Reportes (`/admin/reportes`)
- KPI cards: transacciones totales, ingresos, canjes, monto promedio
- Bar chart de transacciones por tipo
- Pie chart de transacciones por origen (Web vs POS)
- Area chart de volumen diario
- Filtro de rango de fechas

### Staff (`/admin/staff`)
- Grid de cards por usuario con rol, estado y último acceso
- Toggle activo/inactivo por card
- Modal de creación con validación mínima de contraseña (8 chars, mayúscula, número)

### Merchandising (`/admin/merchandising`)
- Cards de kits con stock actual y alerta visual cuando baja del mínimo
- Modal de ajuste de stock (entrada de lotes positiva/negativa)

### Configuración (`/admin/configuracion`)
- Lista de todos los parámetros del sistema con edición inline
- Campo de descripción opcional para documentar el cambio

### Auditoría (`/admin/auditoria`)
- **Feed de actividad** (no tabla) con:
  - Burbuja de acción con color e icono según tipo
  - Descripción en lenguaje natural ("Cajero registró nuevo miembro")
  - Avatar con iniciales del usuario, tipo de entidad e ID abreviado
  - Timestamp relativo ("Hace 2h") con tooltip de fecha absoluta
- **Chips de filtro** por tipo de acción (toggle con un click)
- Búsqueda por entidad y rango de fechas
- **Panel diff expandible**: vista antes/después con fondo rojo/verde para mutations; solo "Valor registrado" para creates

### BuscarMiembro (`/cajero/buscar`)
- Input de tarjeta con formato automático `xxxx xxxx xxxx xxxx`
- Card de perfil con gradiente según nivel, stats y barra de progreso
- Banner de aviso si el miembro está inactivo o suspendido
- Acciones rápidas (Registrar compra, Aplicar canje, Nuevo miembro) con `useNavigate`

### RegistrarMiembro (`/cajero/registrar`)
- Selector visual de nivel (3 cards con icono, nombre y descripción)
- Validación por campo con feedback inline (borde rojo + mensaje)
- Card de éxito con número de tarjeta prominente para entregar al cliente

### RegistrarCompra (`/cajero/compra`)
- Flujo 2 pasos: identificar miembro → datos de compra
- Selector de tipo (Entrada / Dulcería) con descuento por nivel visible
- Preview de transacción: monto original, descuento aplicado, total a cobrar y puntos a acreditar
- Banner de upgrade de nivel si la compra sube al cliente

### AplicarCanje (`/cajero/canje`)
- Header con puntos disponibles del miembro destacados
- Lista de beneficios del nivel filtrados: beneficios con costo mayor al saldo aparecen deshabilitados
- Panel de confirmación con puntos a descontar y saldo resultante
- Procesamiento en un solo click

---

## Compilar para producción

```bash
cd frontend
npm run build
# Genera dist/ con los archivos estáticos
```

Sirve `dist/` con cualquier servidor estático (Nginx, Apache, S3 + CloudFront). Configura el servidor para que todas las rutas devuelvan `index.html` (SPA fallback).
