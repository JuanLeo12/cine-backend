# Correcciones Round 4 - Revisión Completa del Sistema

## Fecha: 26 de octubre de 2025

---

## 📋 LISTADO DE PROBLEMAS Y CORRECCIONES

### ✅ CRÍTICOS (Prioridad Alta - Funcionalidad Core)

#### 7. 🍿 **CRÍTICO: Dulcería no incluida en compras**
- **Estado**: ✅ COMPLETADO
- **Problema**: Los combos/dulcería no se estaban incluyendo en el proceso de compra
- **Causa**: TicketType.jsx navegaba directamente a `/payment` saltándose `/combos`
- **Solución Aplicada**: 
  - ✅ Corregido flujo: TicketType → Combos → Payment
  - ✅ Payment.jsx ahora recibe y procesa el `cart` de combos
  - ✅ Combos se envían al backend en confirmación de orden
  - ✅ Resumen de pago muestra tickets + combos
  - ✅ Total calculado correctamente incluyendo combos
  - ✅ Combos.jsx actualizado para cargar desde API (no mockData)
  - ✅ Botón "Omitir Combos" para usuarios que no quieren dulcería
  - ✅ CSS mejorado para mejor UX
- **Archivos modificados**:
  - `frontend/src/pages/purchase/TicketType.jsx` - Navigate a /combos
  - `frontend/src/pages/purchase/Payment.jsx` - Recibe cart, calcula total con combos
  - `frontend/src/pages/purchase/Combos.jsx` - Carga combos desde API, pasa todos los datos
  - `frontend/src/pages/purchase/css/Combos.css` - Diseño mejorado

#### 8. 🏢 **CRÍTICO: Ventas Corporativas**
- **Estado**: ❌ Pendiente
- **Problema**: No hay sistema de compra para usuarios corporativos
- **Requerimientos**:
  - Solo visible para usuarios con `rol = 'corporativo'`
  - Usuarios corporativos NO pueden comprar entradas normales
  - Proceso de compra corporativo separado
  - Usar tabla `vales_corporativos` y `tarifas_corporativas`
- **Impacto**: Segmento de negocio completo sin funcionalidad

#### 11. 📊 **CRÍTICO: Reportes no actualizados**
- **Estado**: ✅ COMPLETADO
- **Problema**: Los reportes de ventas no mostraban las compras realizadas
- **Causa**: 
  - Usaba axios directo en lugar del servicio API
  - Referencias a modelos con PascalCase (OrdenTickets, MetodoPago) cuando son camelCase
  - No manejaba correctamente la estructura de datos
- **Solución Aplicada**:
  - ✅ Migrado a usar `getOrdenesUsuario()` del servicio API
  - ✅ Corregidas referencias a camelCase (ordenTickets, metodoPago)
  - ✅ Cálculo correcto de ventas totales desde pago.monto_total
  - ✅ Conteo correcto de tickets y combos
  - ✅ Ventas por película calculadas desde monto de la orden
  - ✅ Método de pago más usado desde pago.metodoPago.nombre
  - ✅ Agregados console.logs para debugging
- **Archivos modificados**:
  - `frontend/src/pages/admin/ReportesAdmin.jsx` - Reescrito cálculo de estadísticas

---

### 🔴 ALTA PRIORIDAD (Errores Funcionales)

#### 1. 🎬 **Funciones por sede**
- **Estado**: ❌ Pendiente
- **Problema**: No todas las películas tienen funciones en cada sede
- **Solución**: Validar/crear funciones para cada película en todas las sedes activas

#### 4. 🎫 **Bug: Datos de compra anterior sin asientos**
- **Estado**: ❌ Pendiente
- **Problema**: Al hacer nueva compra, "Mis Compras" muestra datos de compra anterior sin asientos
- **Causa probable**: Problema en el query o estado de cache
- **Impacto**: Confusión del usuario, datos incorrectos

#### 13. 📅 **Panel Admin: Funciones muestran N/A**
- **Estado**: ❌ Pendiente
- **Problema**: Funciones no cargan película, sede, sala (solo fecha/hora)
- **Causa**: Include faltante en el controller de funciones
- **Solución**: Agregar includes de Pelicula, Sala, Sede

---

### 🟡 MEDIA PRIORIDAD (UX/UI y Mejoras)

#### 2. 📱 **QR en confirmación de compra**
- **Estado**: ❌ Pendiente
- **Problema**: QR no se muestra correctamente en confirmación
- **Solución**: Aplicar misma función generarQR() de MisCompras

#### 3. 🎟️ **Tipos de tickets en confirmación**
- **Estado**: ❌ Pendiente
- **Problema**: No se muestran los tipos de tickets comprados
- **Solución**: Mostrar tipo de ticket (General, Niño, Senior, etc.) en confirmación

#### 5. 👤 **Actualizar datos de usuario**
- **Estado**: ❌ Pendiente
- **Problema**: No se pueden actualizar todos los datos en "Mis Datos"
- **Requerimientos**:
  - Actualizar: nombre, email, teléfono, DNI
  - Foto de perfil (opcional)
  - Cambio de contraseña

#### 6. 📸 **Foto de perfil en header**
- **Estado**: ❌ Pendiente
- **Problema**: No se muestra foto de perfil junto al nombre
- **Solución**: 
  - Mostrar foto de perfil del usuario
  - Foto por defecto si no tiene (estilo WhatsApp)
  - Agregar campo `foto_perfil` al modelo Usuario

#### 16. 🎠 **Carrusel del Home**
- **Estado**: ❌ Pendiente
- **Problema**: Carrusel poco atractivo
- **Solución**: Rediseño más estilizado y llamativo

---

### 🟢 BAJA PRIORIDAD (Administración y Consultas)

#### 9. 👨‍💼 **Menú para Admin**
- **Estado**: ❌ Pendiente
- **Problema**: Admin ve opciones innecesarias (Mis Compras muestra todas las órdenes)
- **Solución**: Menú admin solo: Panel Admin, Mis Datos, Cerrar Sesión

#### 10. 🛒 **CONSULTA: ¿Admin puede comprar?**
- **Estado**: ⚠️ Decisión de negocio
- **Pregunta**: ¿Es necesario que el admin pueda realizar compras?
- **Recomendación**: NO, el admin debería solo administrar
- **Acción**: Bloquear compras para rol 'admin'

#### 12. 🏢 **Imágenes de sedes**
- **Estado**: ⚠️ Verificar modelo
- **Pregunta**: ¿El modelo Sede tiene campo para imagen?
- **Acción**: Verificar y agregar si no existe

#### 14. ✏️ **Admin editar usuarios**
- **Estado**: ⚠️ Consulta de seguridad
- **Pregunta**: ¿Admin debe poder editar/eliminar usuarios?
- **Recomendación**: 
  - Editar: SÍ (datos básicos)
  - Eliminar: Cambio de estado, NO eliminación física
- **Acción**: Implementar CRUD de usuarios en panel admin

#### 15. 🗑️ **Eliminación de películas**
- **Estado**: ⚠️ Consulta de arquitectura
- **Pregunta**: ¿Eliminación física o cambio de estado?
- **Recomendación**: **Cambio de estado** (`estado: 'inactivo'`)
- **Razón**: 
  - Mantener historial
  - No romper relaciones con funciones/compras existentes
  - Posibilidad de reactivar
- **Acción actual**: Verificar implementación actual

---

## 🎯 PLAN DE EJECUCIÓN

### **FASE 1: Críticos** (Resolver primero)
1. ✅ Dulcería en compras (#7)
2. ✅ Ventas Corporativas (#8)
3. ✅ Reportes actualizados (#11)

### **FASE 2: Alta Prioridad**
4. ✅ Funciones por sede (#1)
5. ✅ Bug datos de compra (#4)
6. ✅ Funciones panel admin (#13)

### **FASE 3: Media Prioridad**
7. ✅ QR en confirmación (#2)
8. ✅ Tipos de tickets en confirmación (#3)
9. ✅ Actualizar datos usuario (#5)
10. ✅ Foto de perfil en header (#6)

### **FASE 4: Baja Prioridad**
11. ✅ Menú admin (#9)
12. ✅ Responder consultas (#10, #12, #14, #15)
13. ✅ Carrusel home (#16)

---

## 📝 NOTAS DE DECISIONES

### Sobre eliminaciones:
- **Recomendación**: Usar `estado` en lugar de eliminación física
- **Tablas afectadas**: peliculas, usuarios, sedes, funciones
- **Beneficios**: Historial, auditoría, reversibilidad

### Sobre roles:
- `cliente`: Compras normales
- `corporativo`: Solo ventas corporativas
- `admin`: Solo administración (sin compras)

### Sobre imágenes:
- Usuarios: foto_perfil (opcional, con default)
- Sedes: imagen_url (recomendado agregar)
- Películas: imagen_url, imagen_banner (ya existe)

---

## ⏱️ ESTIMACIÓN DE TIEMPO

- **Fase 1 (Críticos)**: 4-6 horas
- **Fase 2 (Alta)**: 3-4 horas
- **Fase 3 (Media)**: 3-4 horas
- **Fase 4 (Baja)**: 2-3 horas

**TOTAL ESTIMADO**: 12-17 horas de desarrollo

---

## 🚀 ¿POR DÓNDE EMPEZAMOS?

Sugiero comenzar con los **CRÍTICOS** en este orden:

1. **Dulcería** - Es parte esencial del negocio
2. **Reportes** - Admin necesita ver datos reales
3. **Ventas Corporativas** - Segmento importante de negocio

¿Comenzamos con la **Dulcería** (#7)?
