# Scripts de Actualización de QR

Este directorio contiene scripts para actualizar los códigos QR de las boletas corporativas.

## Archivos

1. **actualizar-qr-corporativos.js** - Para ejecutar en base de datos local
2. **actualizar-qr-corporativos-railway.js** - Para ejecutar en Railway (producción)

## ¿Qué actualizan estos scripts?

Los scripts regeneran los códigos QR de las boletas corporativas existentes para incluir:
- **empresa**: Nombre de la empresa (campo `nombre` del usuario corporativo)
- **representante**: Objeto con nombre, email y cargo del representante

Tipos de boletas que se actualizan:
- Funciones Privadas
- Alquiler de Salas
- Publicidad
- Vales Corporativos

## Ejecución en Local

```bash
node actualizar-qr-corporativos.js
```

Este script se conecta a tu base de datos local configurada en `.env`

## Ejecución en Railway (Producción)

### Opción 1: Railway CLI (desde tu máquina)
```bash
railway link
railway run node actualizar-qr-corporativos-railway.js
```

⚠️ **Nota**: Esto puede fallar si el DATABASE_URL usa el dominio interno de Railway (`postgres.railway.internal`)

### Opción 2: Ejecutar directamente en Railway

1. Ir al Dashboard de Railway (https://railway.app)
2. Seleccionar el proyecto `honest-harmony`
3. Ir al servicio `cine-backend`
4. Ir a la pestaña **"Shell"** o **"Run Command"**
5. Ejecutar:
   ```bash
   node actualizar-qr-corporativos-railway.js
   ```

### Opción 3: Crear un endpoint temporal

Crear un endpoint en el backend que ejecute la actualización:

```javascript
// En routes/index.js o crear routes/admin_tasks.js
router.post('/admin/actualizar-qrs', autenticarUsuario, permitirRoles('admin'), async (req, res) => {
  // Código del script aquí
});
```

Luego llamarlo con:
```bash
curl -X POST https://cine-backend-production.up.railway.app/admin/actualizar-qrs \
  -H "Authorization: Bearer TU_TOKEN_DE_ADMIN"
```

## Resultado Esperado

Al ejecutar el script verás:

```
🔄 Iniciando actualización de QR de boletas corporativas...

📋 Total de boletas encontradas: 8

Procesando boleta #1 - Tipo: funcion_privada
  ✅ Boleta #1 actualizada correctamente

...

============================================================
📊 RESUMEN DE ACTUALIZACIÓN
============================================================
Total boletas: 8
✅ Actualizadas: 8
❌ Errores: 0
============================================================
```

## ⚠️ Advertencias

- **BACKUP**: Asegúrate de tener un respaldo de la base de datos antes de ejecutar en producción
- **PRODUCCIÓN**: El script modifica directamente la base de datos de producción
- **SEGURIDAD**: No compartas los scripts con las credenciales hardcodeadas
