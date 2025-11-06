# 🎬 CineStar - Backend API

API REST del sistema de gestión de cines desarrollado con Node.js, Express y PostgreSQL.

---

## 📋 Requisitos

- Node.js v16 o superior
- PostgreSQL v12 o superior
- npm o yarn

---

## 🚀 Instalación Local

```bash
# 1. Clonar el repositorio
git clone <tu-repo>
cd cine-backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Iniciar servidor
npm run dev
```

El servidor estará disponible en `http://localhost:4000`

---

## ⚙️ Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
DB_NAME=cine_bd
DB_USER=postgres
DB_PASSWORD=tu_password
DB_HOST=localhost
DB_PORT=5432
BCRYPT_SALT_ROUNDS=10
JWT_SECRET=tu_secreto_seguro
JWT_EXPIRES_IN=1h
PORT=4000
```

---

## 📁 Estructura del Proyecto

```
cine-backend/
├── config/          # Configuración de base de datos
├── controllers/     # Lógica de negocio
├── middleware/      # Autenticación y validaciones
├── models/          # Modelos Sequelize (ORM)
├── routes/          # Definición de endpoints
├── utils/           # Funciones auxiliares
├── scripts/         # Scripts de mantenimiento
├── respaldos/       # Backups de la BD
├── app.js           # Configuración Express
├── server.js        # Punto de entrada
└── package.json     # Dependencias
```

---

## 🔐 Autenticación

### Sistema JWT

El sistema usa JSON Web Tokens para autenticación:

```http
Authorization: Bearer <tu_token_jwt>
```

### Roles de Usuario

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `cliente` | Usuario regular | Compra de tickets y combos |
| `corporativo` | Usuario empresarial | Funciones privadas, alquiler de salas |
| `admin` | Administrador | Gestión completa del sistema |

### Usuarios por Defecto

**Administrador:**
- Email: `admin@cinestar.com`
- Password: `Admin123`

---

## 📡 Endpoints Principales

### 🔑 Autenticación (`/api/usuarios`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Registrar usuario | No |
| POST | `/login` | Iniciar sesión | No |
| GET | `/perfil` | Obtener perfil | Sí |
| PUT | `/perfil` | Actualizar perfil | Sí |

### 🏢 Sedes (`/api/sedes`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar sedes activas | No |
| GET | `/:id` | Obtener sede | No |
| POST | `/` | Crear sede | Admin |
| PUT | `/:id` | Actualizar sede | Admin |
| DELETE | `/:id` | Eliminar sede | Admin |

### 🎥 Películas (`/api/peliculas`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar películas | No |
| GET | `/:id` | Obtener película | No |
| POST | `/` | Crear película | Admin |
| PUT | `/:id` | Actualizar película | Admin |
| DELETE | `/:id` | Eliminar película | Admin |

### 🎟️ Funciones (`/api/funciones`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar funciones | No |
| GET | `/pelicula/:id` | Funciones por película | No |
| GET | `/:id/asientos` | Asientos disponibles | No |
| POST | `/` | Crear función | Admin |

### 🍿 Combos (`/api/combos`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/` | Listar combos | No |
| POST | `/` | Crear combo | Admin |
| PUT | `/:id` | Actualizar combo | Admin |

### 🛒 Compras (`/api/ordenes-compra`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crear orden | Sí |
| GET | `/mis-ordenes` | Mis compras | Sí |
| GET | `/:id` | Detalle de orden | Sí |

### 💳 Pagos (`/api/pagos`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/procesar` | Procesar pago | Sí |

### 🏢 Servicios Corporativos

#### Funciones Privadas (`/api/boletas-corporativas`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Crear boleta | Corporativo |
| GET | `/` | Listar boletas | Corporativo |

#### Alquiler de Salas (`/api/alquiler-salas`)
| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/` | Alquilar sala | Corporativo |
| GET | `/` | Mis alquileres | Corporativo |

---

## 🛠️ Scripts Útiles

### Respaldo y Restauración

```bash
# Crear respaldo completo de la BD
node scripts/crear-respaldo-completo.js

# Restaurar desde respaldo
node scripts/restaurar-respaldo-completo.js respaldos/respaldo-YYYY-MM-DD.json
```

### Mantenimiento

```bash
# Resetear contraseña del admin
node scripts/resetear-admin.js

# Verificar estado de servicios
node scripts/verificar-servicios.js
```

---

## 🗄️ Modelos de Datos

### Usuario
```javascript
{
  id, nombre, apellido, email, password_hash,
  telefono, fecha_nacimiento, rol, foto_perfil,
  fecha_registro, estado
}
```

### Película
```javascript
{
  id, titulo, sinopsis, duracion, genero,
  clasificacion, director, reparto, idioma,
  subtitulos, trailer_url, poster_url,
  tipo (cartelera/proxEstreno), estado
}
```

### Función
```javascript
{
  id, id_pelicula, id_sala, fecha, hora_inicio,
  hora_fin, precio_base, estado
}
```

### Combo
```javascript
{
  id, nombre, descripcion, precio, imagen_url,
  tipo (combo/individual), disponible
}
```

### Orden de Compra
```javascript
{
  id, id_usuario, fecha_compra, monto_total,
  estado (pendiente/pagada/cancelada)
}
```

---

## 🔒 Validaciones

### Usuario
- Email: formato válido
- Contraseña: 8-16 caracteres, mínimo 1 mayúscula y 1 número
- Teléfono: 9 dígitos numéricos
- Nombre/Apellido: 2-50 caracteres

### Película
- Título: 1-200 caracteres
- Duración: 1-500 minutos
- Clasificación: `G`, `PG`, `PG-13`, `R`, `NC-17`

### Función
- Fecha: no puede ser en el pasado
- Hora: formato HH:MM
- Precio: mayor a 0

---

## ☁️ Despliegue a la Nube

Ver la guía completa en [`DEPLOY.md`](../DEPLOY.md) para instrucciones detalladas de despliegue en Railway, Render, Vercel, etc.

### Resumen rápido:

1. **Crear respaldo de datos actuales:**
   ```bash
   node scripts/crear-respaldo-completo.js
   ```

2. **Desplegar backend en Railway/Render**
3. **Desplegar frontend en Vercel/Netlify**
4. **Restaurar datos en la nube:**
   ```bash
   railway run node scripts/restaurar-respaldo-completo.js respaldos/archivo.json
   ```

---

## 🐛 Solución de Problemas

### Error de conexión a la BD
✅ Verifica credenciales en `.env`  
✅ Asegúrate que PostgreSQL esté corriendo  
✅ Revisa firewall/puertos

### Error de autenticación
✅ Verifica que `JWT_SECRET` esté configurado  
✅ Revisa formato del token en headers

### Tabla/columna no existe
✅ Ejecuta sincronización: `sequelize.sync({ alter: true })`  
✅ O ejecuta migraciones pendientes

---

## 📄 Licencia

MIT License - CineStar © 2025

---

## 📞 Soporte

Para más información, consulta [`DEPLOY.md`](../DEPLOY.md) o la documentación del proyecto.
