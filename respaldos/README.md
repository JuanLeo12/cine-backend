# Carpeta de Respaldos

Esta carpeta contiene los respaldos (backups) de la base de datos del proyecto Cinestar.

## 📦 Uso

### Crear un respaldo:
```powershell
node crear-respaldo.js
```

### Restaurar un respaldo:
```powershell
node restaurar-respaldo.js
```

## 🔒 Seguridad

**⚠️ IMPORTANTE:**
- Los archivos `.sql` contienen TODOS los datos de la base de datos
- NO subir estos archivos a repositorios públicos
- Mantener en lugar seguro
- Crear backups regularmente

## 📁 Formato de Archivos

Los respaldos se guardan con el formato:
```
backup_YYYY-MM-DD.sql
```

Ejemplo: `backup_2025-11-04.sql`

## 💡 Recomendaciones

1. **Frecuencia de backups:**
   - Desarrollo: Semanal
   - Producción: Diario

2. **Almacenamiento:**
   - Local: Esta carpeta
   - Externo: USB, disco duro externo
   - Nube: Google Drive, Dropbox (encriptado)

3. **Retención:**
   - Mantener al menos 3 respaldos recientes
   - Eliminar respaldos muy antiguos para liberar espacio

## 🗂️ Contenido del Respaldo

Cada archivo `.sql` incluye:
- ✅ Estructura de todas las tablas
- ✅ Todos los datos (usuarios, películas, órdenes, etc.)
- ✅ Secuencias y constraints
- ✅ Índices

## 🚨 Advertencias

- La restauración **ELIMINA** todos los datos actuales
- Siempre crear un backup antes de restaurar
- Verificar el archivo antes de restaurar (debe pesar varios MB)
