# 🛠️ Scripts de Utilidad

Scripts esenciales para el mantenimiento y despliegue del proyecto.

---

## 📋 Scripts Disponibles

### 1. `crear-respaldo-completo.js`

**Propósito:** Crea un respaldo completo de toda la base de datos.

**Cuándo usar:**
- ✅ Antes de subir el proyecto a la nube
- ✅ Antes de hacer cambios importantes en producción
- ✅ Periódicamente como backup de seguridad

**Uso:**
```bash
node scripts/crear-respaldo-completo.js
```

**Salida:**
- Crea archivo en `respaldos/respaldo-completo-YYYY-MM-DD.json`
- Incluye todas las tablas con sus datos
- Muestra resumen de registros respaldados

**Ejemplo:**
```
✅ sedes: 17 registros
✅ salas: 93 registros
✅ peliculas: 8 registros
...
📦 Total de registros: 458
```

---

### 2. `restaurar-respaldo-completo.js`

**Propósito:** Restaura los datos desde un archivo de respaldo en una nueva base de datos.

**Cuándo usar:**
- ✅ Después de desplegar la base de datos en la nube
- ✅ Para migrar datos entre ambientes
- ✅ Para recuperar datos de un backup

**Uso:**
```bash
node scripts/restaurar-respaldo-completo.js respaldos/respaldo-completo-YYYY-MM-DD.json
```

**Importante:**
- ⚠️ Ejecutar DESPUÉS de que las tablas estén creadas (sequelize.sync)
- ⚠️ Respeta las dependencias entre tablas
- ⚠️ No sobrescribe si hay conflictos (ON CONFLICT DO NOTHING)

**Ejemplo en Railway:**
```bash
railway run node scripts/restaurar-respaldo-completo.js respaldos/respaldo-completo-2025-11-06.json
```

---

### 3. `resetear-admin.js`

**Propósito:** Resetea la contraseña del usuario administrador.

**Cuándo usar:**
- ✅ Si olvidaste la contraseña del admin
- ✅ Después de restaurar un respaldo en la nube
- ✅ Para estandarizar credenciales de admin

**Uso:**
```bash
node scripts/resetear-admin.js
```

**Credenciales resultantes:**
```
📧 Email:    admin@cinestar.com
🔑 Password: Admin123
```

**Nota:** Invalida cualquier sesión activa del admin.

---

## 🚀 Flujo de Despliegue Recomendado

### Paso 1: Crear Respaldo Local
```bash
node scripts/crear-respaldo-completo.js
```

### Paso 2: Desplegar Backend en la Nube
- Subir código a Railway/Render
- Crear base de datos PostgreSQL
- Configurar variables de entorno

### Paso 3: Restaurar Datos
```bash
# Usando Railway CLI
railway run node scripts/restaurar-respaldo-completo.js respaldos/respaldo-completo-YYYY-MM-DD.json
```

### Paso 4: Verificar Admin
```bash
railway run node scripts/resetear-admin.js
```

---

## 📝 Notas Técnicas

### Respaldo
- **Formato:** JSON
- **Codificación:** UTF-8
- **Orden:** Respeta dependencias de foreign keys
- **Tamaño típico:** ~200KB - 2MB dependiendo de los datos

### Restauración
- Usa transacciones diferidas para respetar constraints
- Resetea secuencias automáticamente
- Maneja duplicados con `ON CONFLICT DO NOTHING`
- Muestra progreso por tabla

### Seguridad
- ⚠️ Los archivos de respaldo pueden contener datos sensibles
- ⚠️ NO subir respaldos a repositorios públicos
- ✅ Los respaldos están en `.gitignore` por defecto

---

## 🐛 Solución de Problemas

### "Error: no existe la relación X"
- La tabla no existe en la BD de destino
- Ejecuta primero `sequelize.sync()` o inicia el servidor una vez

### "Error: violación de foreign key"
- El script restaura en orden de dependencias
- Revisa que todas las tablas necesarias existan

### "Cannot find module '../models'"
- Ejecuta el script desde la raíz del proyecto:
  ```bash
  node scripts/nombre-script.js
  ```

---

## 📚 Documentación Adicional

Ver [`../README.md`](../README.md) para documentación completa del backend.
