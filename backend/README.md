# 🎬 Ruta Cinépolis — Backend API

Sistema de membresía por niveles para Cinépolis Perú. Permite a los clientes acumular puntos por sus compras, acceder a beneficios escalonados según su nivel (Estándar, Premium, Golden) y canjear recompensas.

---

## Índice

- [Tecnologías](#tecnologías)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución local](docs/INSTALACION.md)
- [Estructura del proyecto](docs/ESTRUCTURA.md)
- [Endpoints de la API](docs/ENDPOINTS.md)
- [Integración con el Frontend](docs/FRONTEND_INTEGRACION.md)

---

## Tecnologías

| Tecnología | Versión | Rol |
|---|---|---|
| Node.js | 20 | Runtime del servidor |
| TypeScript | 5 | Lenguaje tipado |
| Express | 4 | Framework HTTP |
| Prisma | 5 | ORM (Object-Relational Mapper) |
| PostgreSQL | 15 | Base de datos relacional |
| JWT | — | Autenticación con tokens |
| Zod | — | Validación de datos de entrada |
| Winston | — | Sistema de logs |
| Docker | — | Contenedorización |
| Swagger UI | — | Documentación interactiva de la API |

---

## Arquitectura

El sistema sigue el patrón **MVC Multicapa (n-tier)** definido en el Documento de Arquitectura de Software (SAD):

```
┌──────────────────────────────────────────┐
│         Capa de Presentación             │
│     (Frontend Web / Interfaz POS)        │
└────────────────────┬─────────────────────┘
                     │ HTTP / REST API
┌────────────────────▼─────────────────────┐
│       Capa de Lógica de Negocio          │
│   Node.js + Express (este repositorio)   │
│                                          │
│  Auth · Members · Points · Benefits      │
│  Redemptions · Merchandise · Reports     │
│  POS Integration · Admin · Notifications │
└────────────────────┬─────────────────────┘
                     │ Prisma ORM
┌────────────────────▼─────────────────────┐
│         Capa de Acceso a Datos           │
│         PostgreSQL (AWS RDS)             │
└──────────────────────────────────────────┘
```

---

## Roles del sistema

| Rol | Descripción |
|---|---|
| `CLIENTE` | Miembro RC que consulta su perfil y canjea beneficios vía web |
| `CAJERO` | Operador de taquilla que registra compras y aplica beneficios en POS |
| `ADMINISTRADOR` | Configura reglas de negocio, genera reportes y gestiona el stock |

---

## Scripts disponibles

```bash
npm run dev              # Inicia el servidor en modo desarrollo (hot reload)
npm run build            # Compila TypeScript a JavaScript
npm run start            # Inicia el servidor compilado (producción)
npm run prisma:generate  # Regenera el cliente Prisma desde el schema
npm run prisma:migrate   # Aplica cambios del schema a la base de datos
npm run prisma:seed      # Carga datos iniciales (niveles, beneficios, admin)
npm run prisma:studio    # Abre interfaz visual de la BD en el navegador
npm run test             # Ejecuta los tests con Jest
npm run test:coverage    # Tests con reporte de cobertura
npm run lint             # Analiza el código con ESLint
```

---

## Variables de entorno

Copia `.env.example` como `.env` y completa los valores. Las variables críticas son:

```env
DATABASE_URL="postgresql://cinepolis:cinepolis_secret@localhost:5434/cinepolis_rc"
JWT_SECRET=min_32_caracteres_aqui
JWT_REFRESH_SECRET=otro_secreto_min_32_chars
```

Ver la documentación completa de instalación en [docs/INSTALACION.md](docs/INSTALACION.md).

---

## Documentación interactiva

Con el servidor corriendo, accede a:

- **Swagger UI:** `http://localhost:3001/api/docs`
- **Health check:** `http://localhost:3001/health`
- **Lista de rutas:** `http://localhost:3001/api/routes`

---

## Usuarios de prueba (después del seed)

| Email | Contraseña | Rol |
|---|---|---|
| admin@cinepolis.com.pe | Admin123! | ADMINISTRADOR |
| cajero@cinepolis.com.pe | Cajero123! | CAJERO |

---

## Documentación adicional

| Documento | Descripción |
|---|---|
| [INSTALACION.md](docs/INSTALACION.md) | Guía paso a paso para correr el proyecto localmente |
| [ESTRUCTURA.md](docs/ESTRUCTURA.md) | Explicación detallada de cada carpeta y archivo |
| [ENDPOINTS.md](docs/ENDPOINTS.md) | Referencia completa de los 40 endpoints de la API |
| [FRONTEND_INTEGRACION.md](docs/FRONTEND_INTEGRACION.md) | Cómo conectar el frontend a este backend |
