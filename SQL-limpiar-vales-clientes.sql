-- ============================================================================
-- Script SQL para limpiar vales corporativos asociados a clientes normales
-- Solo los usuarios corporativos deberían tener vales corporativos
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Ve a Railway → PostgreSQL → Query
-- 2. Copia y pega cada sección por separado
-- 3. Revisa los resultados antes de ejecutar el DELETE
-- ============================================================================

-- PASO 1: Ver vales asociados a clientes normales
-- (Ejecuta esto primero para ver qué se va a eliminar)
SELECT 
  v.id as vale_id,
  v.codigo,
  v.tipo,
  v.usado,
  v.usos_disponibles,
  u.id as usuario_id,
  u.nombre as usuario_nombre,
  u.email as usuario_email,
  u.rol as usuario_rol,
  oc.id as orden_id,
  oc.fecha_compra,
  p.monto_total
FROM vales_corporativos v
LEFT JOIN pagos p ON v.id_pago = p.id
LEFT JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
LEFT JOIN usuarios u ON oc.id_usuario = u.id
WHERE u.rol = 'cliente'
ORDER BY v.id;

-- ============================================================================
-- RESULTADO ESPERADO:
-- Deberías ver los vales del cliente "Leo" (u otros clientes si hay)
-- ============================================================================


-- PASO 2: Contar cuántos vales se van a eliminar
SELECT COUNT(*) as total_vales_a_eliminar
FROM vales_corporativos v
LEFT JOIN pagos p ON v.id_pago = p.id
LEFT JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
LEFT JOIN usuarios u ON oc.id_usuario = u.id
WHERE u.rol = 'cliente';

-- ============================================================================


-- PASO 3: ELIMINAR vales de clientes (¡CUIDADO! Esto es irreversible)
-- Solo ejecuta esto después de revisar los resultados del PASO 1
DELETE FROM vales_corporativos
WHERE id IN (
  SELECT v.id
  FROM vales_corporativos v
  LEFT JOIN pagos p ON v.id_pago = p.id
  LEFT JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
  LEFT JOIN usuarios u ON oc.id_usuario = u.id
  WHERE u.rol = 'cliente'
);

-- ============================================================================
-- RESULTADO ESPERADO:
-- DELETE X (donde X es el número de vales eliminados)
-- ============================================================================


-- PASO 4: Verificar que no quedaron vales asociados a clientes
SELECT COUNT(*) as vales_clientes_restantes
FROM vales_corporativos v
LEFT JOIN pagos p ON v.id_pago = p.id
LEFT JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
LEFT JOIN usuarios u ON oc.id_usuario = u.id
WHERE u.rol = 'cliente';

-- RESULTADO ESPERADO: 0

-- ============================================================================


-- PASO 5: Ver resumen de vales corporativos válidos
SELECT 
  COUNT(*) as total_vales_corporativos,
  COUNT(DISTINCT u.id) as usuarios_corporativos
FROM vales_corporativos v
LEFT JOIN pagos p ON v.id_pago = p.id
LEFT JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
LEFT JOIN usuarios u ON oc.id_usuario = u.id
WHERE u.rol = 'corporativo';

-- ============================================================================


-- PASO 6 (OPCIONAL): Ver todos los vales corporativos válidos restantes
SELECT 
  v.id,
  v.codigo,
  v.tipo,
  v.usado,
  v.usos_disponibles,
  u.nombre as usuario_corporativo,
  u.email,
  oc.fecha_compra
FROM vales_corporativos v
LEFT JOIN pagos p ON v.id_pago = p.id
LEFT JOIN ordenes_compra oc ON p.id_orden_compra = oc.id
LEFT JOIN usuarios u ON oc.id_usuario = u.id
WHERE u.rol = 'corporativo'
ORDER BY v.id DESC;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
