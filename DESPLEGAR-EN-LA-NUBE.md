# 🚀 GUÍA DE DESPLIEGUE EN LA NUBE

## 📦 Tu Respaldo Está Listo

✅ **Archivo:** `respaldos/respaldo-completo-2025-11-07T00-03-57.json`  
✅ **Registros:** 585 registros (todos tus datos actuales)  
✅ **Tamaño:** 205.75 KB  
✅ **Incluye:** 19 tablas con todas las relaciones

---

## 🌐 Opción 1: Desplegar en Railway (Recomendado)

### Paso 1: Preparar Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login en Railway
railway login

# Crear nuevo proyecto
railway init

# Enlazar a tu repositorio (opcional)
railway link
```

### Paso 2: Crear Base de Datos

```bash
# Agregar PostgreSQL al proyecto
railway add

# Seleccionar: PostgreSQL
```

### Paso 3: Configurar Variables de Entorno

En el dashboard de Railway, agregar:

```env
DATABASE_URL=postgresql://...  (se crea automáticamente)
JWT_SECRET=tu_clave_secreta_super_segura_cambiala
PORT=4000
NODE_ENV=production
```

### Paso 4: Desplegar Backend

```bash
# Desplegar código
railway up

# Esperar a que se despliegue...
```

### Paso 5: Restaurar Tus Datos

```bash
# Opción A: Usar Railway Shell
railway shell
node restaurar-respaldo.js

# Opción B: Comando directo
railway run node restaurar-respaldo.js
```

✅ **¡Listo!** Todos tus datos estarán en la nube

---

## 🌐 Opción 2: Desplegar en Render

### Paso 1: Crear Cuenta en Render

1. Ve a [render.com](https://render.com)
2. Crea una cuenta (gratis)

### Paso 2: Crear PostgreSQL Database

1. New → PostgreSQL
2. Nombre: `cinestar-db`
3. Region: Oregon (gratis)
4. Plan: Free
5. Copiar el **Internal Database URL**

### Paso 3: Crear Web Service

1. New → Web Service
2. Conectar repositorio de GitHub
3. Configurar:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment Variables:**
     ```
     DATABASE_URL=<internal_database_url>
     JWT_SECRET=tu_clave_secreta
     NODE_ENV=production
     ```

### Paso 4: Restaurar Datos

1. Ir a tu servicio web en Render
2. Shell → Connect
3. Ejecutar:
   ```bash
   node restaurar-respaldo.js
   ```

✅ **¡Listo!** Tu backend está en la nube con todos los datos

---

## 🌐 Opción 3: Desplegar en Vercel (Solo Frontend)

Para el frontend (React):

```bash
cd cine-frontend

# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Desplegar
vercel

# Para producción
vercel --prod
```

**Variables de entorno en Vercel:**
```env
REACT_APP_API_URL=<url_de_tu_backend_en_railway_o_render>
```

---

## 📋 Checklist de Despliegue

### Antes de desplegar:
- [x] ✅ Respaldo creado con todos los datos actuales
- [ ] 🔐 Cambiar JWT_SECRET a uno nuevo y seguro
- [ ] 📝 Apuntar la URL del backend desplegado
- [ ] 🔍 Verificar que .env no esté en el repositorio

### Después de desplegar:
- [ ] ✅ Restaurar datos con `restaurar-respaldo.js`
- [ ] 🧪 Probar login con credenciales del admin
- [ ] 📱 Actualizar REACT_APP_API_URL en el frontend
- [ ] 🚀 Desplegar frontend conectado al backend

---

## 🔧 Comandos Útiles

### Ver logs en Railway:
```bash
railway logs
```

### Ver logs en Render:
- Ir al dashboard → Logs

### Ejecutar comandos en la BD:
```bash
# Railway
railway run node <script.js>

# Render
# Usar la Shell del dashboard
```

### Crear nuevo respaldo (local):
```bash
node crear-respaldo.js
```

---

## 🆘 Solución de Problemas

### Error: "Cannot connect to database"
- Verifica que DATABASE_URL esté configurado correctamente
- En Railway/Render, debe usar el Internal URL

### Error: "JWT_SECRET is not defined"
- Agrega JWT_SECRET en las variables de entorno

### Los datos no se restauran
- Asegúrate de que el servidor se haya iniciado al menos una vez
- Esto crea las tablas automáticamente con `sequelize.sync()`

### Frontend no conecta con backend
- Verifica REACT_APP_API_URL en el frontend
- Debe apuntar a la URL pública del backend (ej: `https://tu-app.up.railway.app`)

---

## 📞 Contacto y Ayuda

Si tienes problemas durante el despliegue, revisa:
- 📖 Documentación de Railway: https://docs.railway.app
- 📖 Documentación de Render: https://render.com/docs
- 📖 README.md del proyecto

---

## ✅ Resumen

1. **Crear respaldo** ✅ (Ya hecho: 585 registros)
2. **Elegir plataforma** (Railway recomendado)
3. **Crear PostgreSQL** en la plataforma
4. **Desplegar backend** con variables de entorno
5. **Restaurar datos** con el script
6. **Desplegar frontend** con la URL del backend
7. **¡Disfrutar!** Tu sistema completo en la nube

🎉 **¡Todo listo para subir a la nube con tus 585 registros actuales!**
