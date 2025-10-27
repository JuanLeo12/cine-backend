-- MIGRACIÓN: Agregar columna imagen_url a sedes
ALTER TABLE sedes ADD COLUMN imagen_url TEXT;
