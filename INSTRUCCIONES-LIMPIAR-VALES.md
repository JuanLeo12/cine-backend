# 🔧 Instrucciones para Limpiar Vales Corporativos

## 📋 Problema Detectado
El cliente "Leo" (usuario con `rol = 'cliente'`) tiene un vale corporativo en "Mis Compras", cuando solo los usuarios con `rol = 'corporativo'` deberían poder comprar y tener vales.

## ✅ Solución
Ejecutar script local que se conecta a Railway para eliminar vales asociados incorrectamente a clientes normales.

---

## 📝 PASOS A SEGUIR:

### 1️⃣ Obtener Credenciales de Railway
1. Ve a [Railway Dashboard](https://railway.app)
2. Selecciona tu proyecto
3. Click en el servicio **PostgreSQL**
4. Click en la pestaña **"Variables"**
5. Copia estos valores:
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`

### 2️⃣ Configurar el Script

**Opción A - Usando variables de entorno (Recomendado):**

En PowerShell, establece las variables temporalmente:
```powershell
$env:PGHOST="tu_host_aqui"
$env:PGPORT="5432"
$env:PGUSER="tu_usuario_aqui"
$env:PGPASSWORD="tu_password_aqui"
$env:PGDATABASE="tu_database_aqui"
```

**Opción B - Editar el archivo:**

Abre `limpiar-vales-railway.js` y reemplaza:
```javascript
host: process.env.PGHOST || 'TU_PGHOST_AQUI',
```

### 3️⃣ Ejecutar el Script

En la terminal, desde la carpeta `cine-backend`:
```powershell
node limpiar-vales-railway.js
```

### 4️⃣ Revisar la Salida

El script te mostrará:
1. ✅ Los vales que se van a eliminar
2. ⏳ 5 segundos para cancelar (Ctrl+C si quieres abortar)
3. 🗑️ Eliminación de vales
4. ✅ Verificación de que no quedaron vales de clientes
5. 📊 Resumen de vales corporativos válidos

---

## 🎯 Después de la Limpieza

1. **Refresca el frontend** (Ctrl + Shift + R)
2. **Inicia sesión como Leo** (cliente)
3. **Ve a "Mis Compras"**
4. ✅ **YA NO deberías ver el vale corporativo**

---

## 🛡️ Protecciones Implementadas

### Frontend ✅
- `CorporateSales.jsx`: Solo muestra servicios corporativos a usuarios `corporativo` o `admin`
- Los clientes solo pueden acceder a **Funciones Privadas**

### Backend ✅
- **Rutas protegidas:**
  ```javascript
  router.post("/", autenticarUsuario, permitirRoles("corporativo", "admin"), crearVale);
  ```
- Solo usuarios `corporativo` o `admin` pueden crear vales

---

## 📊 Permisos Correctos

| Servicio | Cliente Normal | Usuario Corporativo |
|----------|----------------|---------------------|
| Tickets (funciones públicas) | ✅ | ✅ |
| Funciones Privadas | ✅ | ✅ |
| Alquiler de Sala | ❌ | ✅ |
| Publicidad | ❌ | ✅ |
| Vales Corporativos | ❌ | ✅ |

---

## ❓ ¿Necesitas Ayuda?

Si tienes algún problema durante la ejecución:
1. Copia el mensaje de error
2. Verifica que estás conectado a la base de datos correcta
3. Asegúrate de ejecutar las queries en orden

**Archivo de queries completo:** `SQL-limpiar-vales-clientes.sql`
