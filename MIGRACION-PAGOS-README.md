# 🔧 Migración: Permitir id_orden_compra NULL en tabla pagos

## ❓ ¿Por qué es necesaria esta migración?

Los **vales corporativos** se pagan directamente sin crear una orden de compra previa. El modelo `Pago` tenía la columna `id_orden_compra` como `NOT NULL`, lo que impedía crear pagos sin una orden asociada.

## ✅ Qué hace esta migración

Modifica la tabla `pagos` para permitir que la columna `id_orden_compra` acepte valores `NULL`.

```sql
ALTER TABLE pagos ALTER COLUMN id_orden_compra DROP NOT NULL;
```

---

## 🖥️ Ejecución Local

**✅ YA EJECUTADA** - La base de datos local ya tiene la migración aplicada.

Si necesitas ejecutarla nuevamente:
```bash
node migracion-pago-nullable.js
```

---

## ☁️ Ejecución en Railway (Producción)

### **Opción 1: Railway Dashboard (Recomendada)**

1. Ve a: https://railway.app
2. Selecciona tu proyecto: **honest-harmony**
3. Selecciona el servicio: **Postgres**
4. Ve a la pestaña **"Data"** o **"Query"**
5. Ejecuta el siguiente SQL:

```sql
ALTER TABLE pagos ALTER COLUMN id_orden_compra DROP NOT NULL;
```

6. Verifica el cambio con:

```sql
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'pagos' AND column_name = 'id_orden_compra';
```

Deberías ver: `is_nullable: 'YES'`

---

### **Opción 2: Railway CLI (Desde Railway Shell)**

1. Ve a: https://railway.app
2. Proyecto: **honest-harmony**
3. Servicio: **cine-backend**
4. Pestaña: **"Settings"** → **"Terminal"** o usa el comando local:

```bash
railway shell
```

5. Una vez dentro del shell, ejecuta:

```bash
node migracion-pago-nullable-railway.js
```

---

### **Opción 3: Crear un endpoint temporal (Si las otras opciones fallan)**

Puedes crear un endpoint temporal en el backend que ejecute la migración:

```javascript
// En app.js o routes/admin.js
app.get('/admin/migrate-pagos-nullable', autenticarUsuario, async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  
  try {
    await sequelize.query('ALTER TABLE pagos ALTER COLUMN id_orden_compra DROP NOT NULL;');
    res.json({ success: true, message: 'Migración ejecutada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Luego accede a: `https://cine-backend-production.up.railway.app/admin/migrate-pagos-nullable`

---

## 📊 Verificación

Después de ejecutar la migración, verifica que los vales corporativos funcionen:

1. Ve a: https://cine-frontend-pi.vercel.app/corporate
2. Selecciona **"Vales Corporativos"**
3. Completa el formulario
4. Intenta realizar el pago

**Resultado esperado:** ✅ El pago se procesa correctamente y se genera la boleta con QR.

---

## 🐛 ¿Qué problemas resuelve?

**Antes:**
```
❌ Error al procesar el pago
POST /pagos → 500 Internal Server Error
Error: id_orden_compra cannot be null
```

**Después:**
```
✅ Pago registrado con éxito
Pago ID: 123
Vale corporativo creado correctamente
```

---

## 📝 Archivos modificados

- ✅ `models/Pago.js` - Cambió `allowNull: false` → `allowNull: true`
- ✅ `controllers/pagosController.js` - Mejorados logs y validación flexible
- ✅ `utils/validacionesPago.js` - Validación sin requerir orden/función
- ✅ `migracion-pago-nullable.js` - Script de migración local
- ✅ `migracion-pago-nullable-railway.js` - Script para Railway

---

## ⚠️ Importante

Esta migración es **OBLIGATORIA** para que funcionen los vales corporativos en producción. Sin ella, los usuarios verán el error:

> "Error al procesar el pago. Por favor, intenta nuevamente."

Una vez ejecutada la migración en Railway, el sistema funcionará correctamente. 🚀
