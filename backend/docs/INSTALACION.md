# Instalación y ejecución local

Guía completa para correr el backend de Ruta Cinépolis en tu máquina.

---

## Requisitos previos

Antes de empezar, asegúrate de tener instalado:

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Node.js | 20 | `node --version` |
| npm | 9 | `npm --version` |
| Docker Desktop | — | `docker --version` |
| Git | — | `git --version` |

---

## Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/aquinoestoyxd/RutaCinepolis.git
cd RutaCinepolis

# Cambiar a la rama del backend
git checkout backend-emmy
cd backend
```

---

## Paso 2 — Instalar dependencias

```bash
npm install
```

Esto descarga todas las librerías listadas en `package.json` dentro de la carpeta `node_modules/`.

---

## Paso 3 — Configurar variables de entorno

```bash
cp .env.example .env
```

Abre el archivo `.env` y verifica que los valores sean correctos. Los más importantes:

```env
# Puerto del servidor (3001 para no conflicto con otros proyectos)
PORT=3001

# Conexión a la base de datos (debe coincidir con docker-compose.yml)
DATABASE_URL="postgresql://cinepolis:cinepolis_secret@localhost:5434/cinepolis_rc"
DB_PORT=5434

# Secretos JWT — cámbialos por cadenas de al menos 32 caracteres
JWT_SECRET=cambia_esto_por_una_cadena_secreta_larga
JWT_REFRESH_SECRET=otro_secreto_diferente_al_anterior
```

> **Importante:** El archivo `.env` está en `.gitignore` y nunca se sube al repositorio. Cada desarrollador tiene su propio `.env` local.

---

## Paso 4 — Levantar la base de datos con Docker

```bash
# Inicia solo el contenedor de PostgreSQL
docker-compose up postgres -d

# Verifica que esté corriendo
docker ps | grep cinepolis_db
```

Deberías ver `cinepolis_db` con estado `healthy`.

**Puertos que usa Cinépolis (no entran en conflicto con otros proyectos):**
- PostgreSQL: `5434`
- Backend API: `3001`
- pgAdmin: `5051`

---

## Paso 5 — Crear las tablas en la base de datos

```bash
npm run prisma:migrate
```

Prisma te preguntará el nombre de la migración. Escribe `init_schema` y presiona Enter.

Esto crea todas las tablas en PostgreSQL según el archivo `prisma/schema.prisma`.

---

## Paso 6 — Cargar datos iniciales

```bash
npm run prisma:seed
```

Carga en la base de datos:
- Los 3 niveles: Estándar, Premium, Golden
- Los beneficios de cada nivel (descuentos, avant-premières, kit Golden)
- La configuración del sistema (tasa de puntos 5%, umbrales de visitas)
- Usuario administrador y cajero de prueba

**Usuarios creados:**
| Email | Contraseña | Rol |
|---|---|---|
| admin@cinepolis.com.pe | Admin123! | ADMINISTRADOR |
| cajero@cinepolis.com.pe | Cajero123! | CAJERO |

---

## Paso 7 — Iniciar el servidor

```bash
npm run dev
```

El servidor inicia en modo desarrollo con **hot reload** (se reinicia automáticamente al guardar cambios).

Verifica que esté funcionando abriendo en el navegador:
- `http://localhost:3001/health` — debe responder `{ "status": "ok" }`
- `http://localhost:3001/api/docs` — Swagger con todos los endpoints

---

## Herramienta visual para la base de datos (opcional)

```bash
npm run prisma:studio
```

Abre `http://localhost:5555` con una interfaz tipo hoja de cálculo para ver y editar las tablas directamente.

---

## pgAdmin (opcional)

Si levantaste el servicio completo con `docker-compose up -d`, accede a pgAdmin en `http://localhost:5051`:
- Email: `admin@cinepolis.com`
- Contraseña: `admin123`

Conecta al servidor con:
- Host: `postgres` (nombre del contenedor)
- Puerto: `5432`
- Base de datos: `cinepolis_rc`
- Usuario: `cinepolis`
- Contraseña: `cinepolis_secret`

---

## Solución de problemas comunes

### Error: "Authentication failed against database server"
La base de datos no está corriendo. Ejecuta:
```bash
docker-compose up postgres -d
```

### Error: "Port 5434 already in use"
Otro proceso usa ese puerto. Cámbialo en `.env` y `docker-compose.yml` por `5435` u otro disponible.

### Error: "JWT_SECRET must be at least 32 characters"
El servidor valida las variables al arrancar. Abre `.env` y cambia `JWT_SECRET` por una cadena larga.

### Error al ejecutar `prisma:migrate` — "Table already exists"
Las tablas ya fueron creadas antes. Ejecuta directamente:
```bash
npx prisma migrate deploy
```

---

## Parar el proyecto

```bash
# Detener el servidor: Ctrl + C en la terminal donde corre npm run dev

# Detener PostgreSQL
docker-compose stop postgres

# Detener y eliminar contenedores (los datos se conservan en el volumen)
docker-compose down
```
