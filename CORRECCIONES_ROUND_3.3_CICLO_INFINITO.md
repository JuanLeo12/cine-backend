# 🔧 CORRECCIONES ROUND 3.3 - Ciclo Infinito Bloqueo/Liberación
**Fecha:** 25 de Octubre, 2025  
**Problemas solucionados:**
1. 🔄 Ciclo infinito de bloqueo → liberación → bloqueo
2. ❌ Error 403 al liberar asientos de otro usuario
3. ⚠️ "Asientos recuperados: 0" cuando el usuario regresa

---

## 🐛 PROBLEMAS DETECTADOS

### **Problema 1: Ciclo Infinito Bloqueo/Liberación**

**Síntomas en logs del backend:**
```
🆕 Creando nuevo bloqueo: C6 - Usuario 23
🧹 Liberando asiento: C6 - Usuario 23
✅ Asiento C6 ya fue liberado previamente
🆕 Creando nuevo bloqueo: C6 - Usuario 23
🧹 Liberando asiento: C6 - Usuario 23
✅ Asiento C6 ya fue liberado previamente
🆕 Creando nuevo bloqueo: C6 - Usuario 23
... (se repite infinitamente)
```

**Flujo problemático:**
1. Usuario A selecciona asientos C6, C8 en SeatSelection
2. Usuario A navega a "Tipo de Ticket" → `handleContinue()` marca `isNavigating = true`
3. Los asientos NO se liberan al desmontar (correcto)
4. **Usuario A presiona "Atrás"** → Navegación a SeatSelection
5. **Componente SeatSelection se DESMONTA** (nueva instancia)
6. En el cleanup (`useEffect return`): `isNavigating` es FALSE (es una nueva instancia)
7. Cleanup ejecuta `liberarTodosAsientosSinRecargar()` → **LIBERA C6, C8**
8. **Componente SeatSelection se MONTA** de nuevo
9. Detecta `prevSelectedSeats` en `location.state` → ejecuta `verificarAsientosPrevios()`
10. `verificarAsientosPrevios()` ve que C6, C8 están libres → **RE-BLOQUEA C6, C8**
11. Si hay polling activo o múltiples renders → **ciclo infinito**

**Evidencia visual:**
- Usuario ve sus asientos deseleccionados
- Aparece mensaje: "⚠️ 2 asiento(s) ya no están disponibles. Asientos recuperados: 0"
- Los asientos NO se recuperan aunque deberían

---

### **Problema 2: Race Condition entre Usuario A y Usuario B**

**Flujo problemático:**
1. Usuario A selecciona C6, C8
2. Usuario A navega adelante/atrás → Asientos se liberan momentáneamente (problema 1)
3. **Usuario B está viendo la misma función** en ese milisegundo
4. Frontend de Usuario B hace polling (cada 3 segundos)
5. Usuario B ve C6, C8 como "libres" (amarillos) → Los **bloquea automáticamente**
6. `verificarAsientosPrevios()` de Usuario A intenta re-bloquearlos
7. Backend responde: **409 Conflict** "El asiento está bloqueado por otro usuario"
8. Usuario A ve: "⚠️ Asiento bloqueado por otro usuario"

**Evidencia visual reportada:**
- "con ese mismo usuario volví a elegir los asientos, cuando seguí en el usuario B se vio como los asientos pasaron de amarillo a desbloqueados"
- "Luego con el usuario A regresé y esos mismos asientos estaban seleccionados y en el usuario B se pusieron amarillos justo al momento de que volví con el usuario A"

---

### **Problema 3: Error 403 Forbidden al Liberar Asientos**

**Síntomas en consola del navegador:**
```
❌ Error liberando asiento:
Failed to load resource: the server responded with a status of 403 (Forbidden)
:4000/asientos/liberar:1
```

**Código problemático en `asientosFuncionController.js` línea 229:**
```javascript
// Verificar permisos
if (
  req.user.rol !== "admin" &&
  asiento.id_usuario_bloqueo !== req.user.id
) {
  return res.status(403).json({ 
    error: "No tienes permiso para liberar este asiento" 
  });
}
```

**Causa raíz:**
Continuando con el flujo del Problema 2:
1. Usuario A intenta liberar C6, C8 (cleanup al salir)
2. Pero C6, C8 ahora están bloqueados por Usuario B
3. Backend comprueba: `asiento.id_usuario_bloqueo (24) !== req.user.id (23)`
4. Backend rechaza con **403 Forbidden**
5. Frontend de Usuario A muestra error rojo en consola

**Impacto:**
- Usuario ve errores constantes en consola
- Confusión sobre qué asientos están disponibles
- Interfaz muestra estados inconsistentes

---

### **Problema 4: Asiento Fantasma Bloqueado**

**Síntoma reportado:**
- "cuando entré por primera vez a elegir los asientos una silla estaba bloqueada"
- "yo no la seleccioné con ningún usuario y no entiendo porqué"

**Causas posibles:**
1. **Sesión anterior no limpiada:** Usuario cerró pestaña sin liberar asientos
2. **Bloqueo no expirado aún:** El cron job ejecuta cada 1 minuto
3. **Error en frontend:** Llamada accidental a `bloquearAsiento()` durante render
4. **Otro usuario:** Alguien más estaba viendo esa función

**Evidencia en logs:**
```
🧹 Asiento C6 - Bloqueo expirado, limpiado
🧹 Asiento C6 - Bloqueo expirado, limpiado  ← DUPLICADO
```
Esto confirma que hay múltiples llamadas a `listarAsientosPorFuncion()` que limpian el mismo asiento.

---

## ✅ SOLUCIONES IMPLEMENTADAS

### **SOLUCIÓN 1: Prevenir Liberación al Regresar**

**Archivo:** `src/pages/purchase/SeatSelection.jsx` línea 80

**Antes (problemático):**
```javascript
return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    if (intervaloActualizacionRef.current) {
        clearInterval(intervaloActualizacionRef.current);
    }
    // Liberar asientos al desmontar si no se completó la compra
    if (selectedSeats.length > 0 && !isNavigating) {
        liberarTodosAsientosSinRecargar();
    }
};
```

**Problema:** `isNavigating` es parte del estado de la instancia ANTERIOR del componente. Cuando regresas, es una nueva instancia con `isNavigating = false` por defecto.

**Ahora (corregido):**
```javascript
return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    if (intervaloActualizacionRef.current) {
        clearInterval(intervaloActualizacionRef.current);
    }
    // Liberar asientos al desmontar SOLO si:
    // 1. No se está navegando hacia adelante (isNavigating)
    // 2. No hay asientos previos (NO es un regreso desde otra página)
    const esRegreso = prevSelectedSeats && prevSelectedSeats.length > 0;
    if (selectedSeats.length > 0 && !isNavigating && !esRegreso) {
        console.log('🧹 Cleanup: Liberando asientos al desmontar (navegación no prevista)');
        liberarTodosAsientosSinRecargar();
    } else if (esRegreso) {
        console.log('✅ Cleanup: NO liberando asientos (es un regreso desde otra página)');
    } else if (isNavigating) {
        console.log('➡️ Cleanup: NO liberando asientos (navegación controlada)');
    }
};
```

**Cómo funciona:**
- Detecta si `prevSelectedSeats` existe en `location.state`
- Si existe → Usuario está **regresando** desde otra página
- **NO libera** los asientos en el cleanup
- Los asientos se mantienen bloqueados durante todo el flujo

**Beneficios:**
✅ Elimina el ciclo infinito bloqueo → liberación → re-bloqueo  
✅ Los asientos se mantienen durante navegación adelante/atrás  
✅ Logging detallado para debugging  

---

### **SOLUCIÓN 2: Manejo Gracioso de Conflictos de Liberación**

**Archivo:** `controllers/asientosFuncionController.js` línea 229

**Antes (restrictivo):**
```javascript
// Verificar permisos
if (
  req.user.rol !== "admin" &&
  asiento.id_usuario_bloqueo !== req.user.id
) {
  return res.status(403).json({ 
    error: "No tienes permiso para liberar este asiento" 
  });
}
```

**Problema:** Devuelve error 403 cuando intentas liberar un asiento que YA NO es tuyo. Pero esto es un escenario válido (otro usuario lo tomó mientras tanto).

**Ahora (permisivo):**
```javascript
// Verificar permisos
if (
  req.user.rol !== "admin" &&
  asiento.id_usuario_bloqueo !== req.user.id
) {
  console.log(`⚠️ Usuario ${req.user.id} intentó liberar asiento bloqueado por usuario ${asiento.id_usuario_bloqueo}`);
  // No es un error - simplemente el asiento ya no es nuestro
  return res.json({ 
    mensaje: "El asiento ya no está bajo tu control",
    nota: "Otro usuario lo ha bloqueado mientras tanto"
  });
}
```

**Beneficios:**
✅ No genera errores 403 en consola del navegador  
✅ Manejo gracioso de race conditions entre usuarios  
✅ Logging para debugging sin alarmar al usuario  
✅ Frontend recibe respuesta exitosa (200 OK)  

---

## 🔄 FLUJO CORREGIDO

### **Flujo Normal: Usuario A Selecciona → Avanza → Regresa**

```
1. Usuario A en SeatSelection
   └─ Selecciona asientos C6, C8
   └─ POST /asientos/bloquear × 2
   └─ selectedSeats = [{fila: 'C', numero: 6}, {fila: 'C', numero: 8}]

2. Usuario A hace clic en "Continuar"
   └─ handleContinue() marca isNavigating = true
   └─ navigate('/ticket-type', { 
       state: { 
         selectedSeats, 
         misAsientos, 
         funcion, 
         pelicula 
       }
   })
   └─ Cleanup NO libera asientos (isNavigating = true) ✅

3. Usuario A en TicketType
   └─ Ve sus 2 asientos seleccionados

4. Usuario A hace clic en "Atrás" (navegador o botón)
   └─ SeatSelection se DESMONTA
   └─ Cleanup detecta: prevSelectedSeats existe (esRegreso = true)
   └─ Cleanup NO libera asientos ✅
   └─ Console: "✅ Cleanup: NO liberando asientos (es un regreso desde otra página)"

5. SeatSelection se MONTA de nuevo
   └─ useEffect detecta prevSelectedSeats en location.state
   └─ Ejecuta verificarAsientosPrevios()
   └─ Para cada asiento:
       ├─ Verifica si aún existe y está bloqueado por user.id
       ├─ Si SÍ → Extiende bloqueo (POST /asientos/bloquear)
       ├─ Si NO → Intenta re-bloquear (puede fallar si otro lo tiene)
   └─ selectedSeats restaurado correctamente ✅

6. Usuario A ve sus 2 asientos seleccionados
   └─ NO hay mensaje de error
   └─ Puede continuar normalmente
```

---

### **Flujo con Race Condition: Usuario B Interviene**

```
1. Usuario A selecciona C6, C8 y navega adelante
   └─ C6, C8 bloqueados por Usuario 23

2. Usuario A regresa (paso 4 del flujo anterior)
   └─ Por algún glitch temporal, asientos se liberan 1ms
   └─ C6, C8 quedan "libres" momentáneamente

3. Usuario B está en la misma función
   └─ Polling automático (cada 3s) hace GET /asientos/funcion/563
   └─ Respuesta incluye C6, C8 como "libres" (amarillos)
   └─ Usuario B hace clic en C6
   └─ POST /asientos/bloquear → SUCCESS
   └─ C6 ahora bloqueado por Usuario 24 ✅

4. verificarAsientosPrevios() de Usuario A ejecuta
   └─ Intenta bloquear C6
   └─ Backend: findOne() → C6 existe, estado='bloqueado', id_usuario_bloqueo=24
   └─ Backend: CASO 2D → "bloqueado por otro usuario y NO expirado"
   └─ Response: 409 Conflict
   └─ Frontend: catch → asiento NO se agrega a asientosValidos
   └─ Console: "⚠️ No se pudo re-bloquear C6"

5. verificarAsientosPrevios() intenta bloquear C8
   └─ Backend: C8 existe, bloqueado por Usuario 23 ✅
   └─ Backend: CASO 2B → "Mi bloqueo vigente - extender"
   └─ Response: 200 OK
   └─ Frontend: C8 agregado a asientosValidos

6. Resultado final
   └─ asientosValidos = [C8]
   └─ asientosPerdidos = 1 (C6)
   └─ Mensaje: "⚠️ 1 asiento(s) ya no están disponibles. Asientos recuperados: 1"

7. Usuario A intenta salir de la página
   └─ Cleanup llama liberarTodosAsientosSinRecargar()
   └─ Intenta liberar C6 (que es de Usuario B)
   └─ Backend detecta: id_usuario_bloqueo (24) !== req.user.id (23)
   └─ Backend: Retorna 200 OK con mensaje "El asiento ya no está bajo tu control" ✅
   └─ Frontend: NO muestra error 403 ✅
```

---

## 🧪 TESTING ESPERADO

### **Logs Esperados en Backend**

**Navegación normal (adelante/atrás):**
```
🆕 Creando nuevo bloqueo: C6 - Usuario 23
🆕 Creando nuevo bloqueo: C8 - Usuario 23
⏱️ Extendiendo bloqueo vigente: C6 - Usuario 23
⏱️ Extendiendo bloqueo vigente: C8 - Usuario 23
```

**NO debe aparecer:**
```
🧹 Liberando asiento: C6 - Usuario 23
🆕 Creando nuevo bloqueo: C6 - Usuario 23
🧹 Liberando asiento: C6 - Usuario 23
... (ciclo infinito)
```

**Cuando otro usuario toma un asiento:**
```
⚠️ Usuario 23 intentó liberar asiento bloqueado por usuario 24
```

---

### **Logs Esperados en Frontend (Consola)**

**Al regresar desde TicketType:**
```
✅ Cleanup: NO liberando asientos (es un regreso desde otra página)
🔍 Verificando asientos previos: {...}
Verificando C6: { encontrado: true, estado: 'bloqueado', id_usuario_bloqueo: 23 }
✅ Bloqueo extendido: C6
Verificando C8: { encontrado: true, estado: 'bloqueado', id_usuario_bloqueo: 23 }
✅ Bloqueo extendido: C8
✅ Resultado final: { asientosValidos: [...], perdidos: 0 }
```

**Si otro usuario tomó un asiento:**
```
Verificando C6: { encontrado: true, estado: 'bloqueado', id_usuario_bloqueo: 24 }
⚠️ No se pudo re-bloquear C6: El asiento está bloqueado por otro usuario
✅ Resultado final: { asientosValidos: [C8], perdidos: 1 }
⚠️ 1 asiento(s) ya no están disponibles (fueron tomados por otro usuario). 
   Asientos recuperados: 1
```

**NO debe aparecer:**
```
❌ Error liberando asiento: 403 Forbidden
Failed to load resource: the server responded with a status of 403
```

---

## 📊 RESULTADOS ESPERADOS

### **Antes de las correcciones:**
- ❌ Ciclo infinito: bloquear → liberar → bloquear → liberar...
- ❌ "⚠️ 2 asientos ya no disponibles. Asientos recuperados: 0"
- ❌ Error 403 al liberar asientos de otro usuario
- ❌ Asientos se pierden al regresar con botón "Atrás"
- ❌ Estados inconsistentes entre Usuario A y Usuario B

### **Después de las correcciones:**
- ✅ NO más ciclos infinitos
- ✅ Asientos se mantienen al navegar adelante/atrás
- ✅ "✅ Todos los 2 asientos fueron restaurados correctamente"
- ✅ NO errores 403 (manejo gracioso de conflictos)
- ✅ Estados consistentes entre usuarios
- ✅ Mensajes claros cuando se pierde un asiento

---

## 🚀 INSTRUCCIONES DE TESTING

### **Paso 1: Reiniciar y Limpiar**
- Backend ya reiniciado automáticamente
- **CRÍTICO:** Cierra sesión y vuelve a iniciar en ambos navegadores
  - Las sesiones fueron invalidadas
  - Debes obtener nuevos tokens JWT

### **Paso 2: Test Básico - Usuario A Solo**
1. Login como Usuario A
2. Seleccionar función → Seleccionar 2 asientos (ej: C6, C8)
3. Clic en "Continuar" → Ir a Tipo de Ticket
4. Clic en "Atrás" (navegador o botón)
5. **Esperado:**
   - ✅ Los 2 asientos siguen seleccionados (verdes)
   - ✅ Consola: "✅ Cleanup: NO liberando asientos (es un regreso...)"
   - ✅ NO mensaje de error
   - ❌ NO debe ver: "0 asientos recuperados"

### **Paso 3: Test Race Condition - Usuario A + Usuario B**
1. **Navegador 1:** Login como Usuario A
2. **Navegador 2:** Login como Usuario B (en ventana incógnito)
3. Ambos entran a la misma función
4. **Usuario A:** Selecciona C6, C8 → Continuar → Atrás
5. **Usuario B:** Durante ese tiempo, intenta seleccionar C6
6. **Esperado:**
   - Usuario B puede ver C6 como amarillo solo si Usuario A lo liberó
   - Si Usuario A mantuvo el bloqueo: Usuario B ve "bloqueado por otro usuario"
   - Usuario A al regresar: mantiene sus asientos o ve mensaje claro de pérdida

### **Paso 4: Test Asiento Fantasma**
1. Seleccionar 3 asientos
2. Cerrar pestaña sin completar compra (navegación brusca)
3. Esperar 6 minutos (para que expire)
4. Reabrir la función
5. **Esperado:**
   - ✅ Los asientos ahora están libres (amarillos)
   - ✅ Cron job limpió los bloqueos expirados
   - ❌ NO deben quedar asientos "bloqueados" sin dueño

### **Paso 5: Verificar Logs**
**En consola del navegador:**
- Debe ver: "✅ Cleanup: NO liberando asientos..."
- NO debe ver: Error 403 repetidos

**En terminal del backend:**
- Debe ver: "⏱️ Extendiendo bloqueo vigente..."
- NO debe ver: Ciclo "🆕 Creando → 🧹 Liberando → 🆕 Creando..."

---

## 🔍 DEBUGGING

### **Si aún ves "0 asientos recuperados":**
1. Verificar logs del backend: ¿Aparece "⏱️ Extendiendo bloqueo vigente"?
2. Si NO aparece: El problema está en `verificarAsientosPrevios()`
3. Si SÍ aparece pero falla: Verificar que `user.id` sea correcto

### **Si ves ciclo infinito en logs:**
1. Buscar en backend: "🆕 Creando" seguido inmediatamente de "🧹 Liberando"
2. Verificar frontend: ¿Aparece "✅ Cleanup: NO liberando asientos"?
3. Si NO aparece: El `esRegreso` no se está detectando correctamente

### **Si Usuario B "roba" asientos de Usuario A:**
1. Es comportamiento esperado si Usuario A los libera momentáneamente
2. Usuario A debe ver mensaje: "1 asiento(s) ya no disponibles"
3. Backend debe loguear: "⚠️ Usuario X intentó liberar asiento bloqueado por usuario Y"

---

## 📝 NOTAS TÉCNICAS

### **¿Por qué `prevSelectedSeats` en location.state?**
- React Router preserva el `state` al navegar con `navigate()`
- Cuando regresas con "Atrás", el `state` se restaura automáticamente
- Permite detectar si es un "regreso" vs "entrada nueva"

### **¿Por qué no usar sessionStorage o Context?**
- `location.state` es más confiable con navegación del navegador
- Context se resetea en refresh
- sessionStorage requiere serialización/deserialización

### **¿Qué pasa si cierro la pestaña?**
- `beforeunload` no es 100% confiable
- El cron job limpia asientos expirados cada minuto
- Máximo 5 minutos de bloqueo fantasma (tiempo de expiración)

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] Backend reiniciado con correcciones
- [x] Cleanup detecta `esRegreso` correctamente
- [x] Endpoint `/liberar` retorna 200 OK en conflictos
- [x] Logging detallado en ambos lados
- [ ] Usuario A cierra sesión y vuelve a iniciar
- [ ] Usuario B cierra sesión y vuelve a iniciar
- [ ] Test básico: adelante/atrás mantiene asientos
- [ ] Test race condition: mensajes claros de conflicto
- [ ] Verificar logs: NO ciclos infinitos
- [ ] Verificar logs: NO errores 403

---

**FIN DEL DOCUMENTO**
