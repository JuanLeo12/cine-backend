# 🎬 Cinestar - Backend API

Backend del sistema de gestión de cines desarrollado con Node.js, Express y PostgreSQL.

## 📋 Requisitos

- Node.js v16 o superior
- PostgreSQL v12 o superior
- npm o yarn

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de base de datos
```

## ⚙️ Configuración de Base de Datos

Edita el archivo `.env` con tus credenciales:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cinestar_db
DB_USER=tu_usuario
DB_PASSWORD=tu_password
JWT_SECRET=tu_clave_secreta
PORT=5000
```

## 🏃‍♂️ Ejecución

```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en `http://localhost:5000`

## 📁 Estructura del Proyecto

```
cine-backend/
├── config/          # Configuración de base de datos
├── controllers/     # Controladores de rutas
├── middleware/      # Middlewares (autenticación, etc.)
├── models/          # Modelos de Sequelize
├── routes/          # Definición de rutas
├── utils/           # Utilidades y validaciones
├── tools/           # Scripts de mantenimiento
├── app.js           # Configuración de Express
└── server.js        # Punto de entrada
```

## 🔐 Autenticación

El sistema utiliza JWT (JSON Web Tokens) para la autenticación. Los tokens se envían en el header:

```
Authorization: Bearer <token>
```

### Roles de Usuario

- **cliente**: Usuario regular (puede comprar tickets)
- **corporativo**: Usuario empresarial (puede usar vales corporativos)
- **admin**: Administrador del sistema (acceso completo)

## 📡 API Endpoints Principales

### Autenticación
- `POST /api/usuarios/register` - Registrar nuevo usuario
- `POST /api/usuarios/login` - Iniciar sesión
- `GET /api/usuarios/perfil` - Obtener perfil (requiere auth)
- `PUT /api/usuarios/perfil` - Actualizar perfil (requiere auth)

### Sedes
- `GET /api/sedes` - Listar todas las sedes activas
- `GET /api/sedes/:id` - Obtener sede por ID
- `POST /api/sedes` - Crear sede (admin)
- `PUT /api/sedes/:id` - Actualizar sede (admin)
- `DELETE /api/sedes/:id` - Eliminar sede (admin)

### Películas
- `GET /api/peliculas` - Listar películas
- `GET /api/peliculas/:id` - Obtener película por ID
- `POST /api/peliculas` - Crear película (admin)
- `PUT /api/peliculas/:id` - Actualizar película (admin)
- `DELETE /api/peliculas/:id` - Eliminar película (admin)

### Funciones
- `GET /api/funciones` - Listar funciones
- `GET /api/funciones/pelicula/:id` - Funciones de una película
- `POST /api/funciones` - Crear función (admin)
- `PUT /api/funciones/:id` - Actualizar función (admin)
- `DELETE /api/funciones/:id` - Eliminar función (admin)

### Combos
- `GET /api/combos` - Listar combos disponibles
- `POST /api/combos` - Crear combo (admin)
- `PUT /api/combos/:id` - Actualizar combo (admin)
- `DELETE /api/combos/:id` - Eliminar combo (admin)

### Compras
- `POST /api/ordenes-compra` - Crear orden de compra
- `GET /api/ordenes-compra/mis-ordenes` - Mis compras (requiere auth)
- `POST /api/pagos` - Procesar pago

### Vales Corporativos
- `POST /api/vales-corporativos/validar` - Validar vale (corporativo)
- `GET /api/vales-corporativos` - Listar vales (admin)

## 🛠️ Scripts Útiles

### Herramientas de Base de Datos

```bash
# Resetear base de datos (mantiene usuarios)
node tools/reset-completo-excepto-usuarios.js

# Resetear contraseñas corporativas
node tools/reset-corporativo-passwords.js

# Verificar sedes en BD
node tools/verificar-sedes-actuales.js

# Agregar columna teléfono a sedes
node tools/agregar-columna-telefono-sedes.js
```

## 🔒 Validaciones

### Sede
- Nombre: 3-100 caracteres
- Dirección: 5-255 caracteres
- Ciudad: 2-100 caracteres
- Teléfono: Exactamente 9 dígitos (opcional)
- Imagen URL: URL válida (opcional)

### Usuario
- Email: Formato válido
- Contraseña: 8-16 caracteres
- Nombre: 3-100 caracteres
- Teléfono: 9 dígitos numéricos

### Película
- Título: 1-255 caracteres
- Duración: Mínimo 1 minuto
- Clasificación: G, PG, PG-13, R, NC-17

## 📝 Modelos Principales

- **Usuario**: Gestión de usuarios y autenticación
- **Sede**: Ubicaciones de cines
- **Sala**: Salas de cada sede (2D, 3D, 4DX, Xtreme)
- **Pelicula**: Catálogo de películas
- **Funcion**: Funciones/horarios de películas
- **AsientoFuncion**: Asientos disponibles por función
- **OrdenCompra**: Órdenes de compra
- **Pago**: Pagos procesados
- **Combo**: Combos de dulcería
- **ValeCorporativo**: Vales para clientes corporativos

## 🐛 Solución de Problemas

### Error: "no existe la columna X"
Ejecuta las migraciones o sincroniza los modelos:
```bash
# En app.js, usa:
sequelize.sync({ alter: true })
```

### Error de autenticación
Verifica que el JWT_SECRET esté configurado en `.env`

### Problemas de conexión a BD
Verifica las credenciales en `.env` y que PostgreSQL esté corriendo

## 📄 Licencia

Proyecto educativo - Cinestar © 2025
