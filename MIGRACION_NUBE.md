# 📦 Guía de Migración de Archivos a la Nube

Este documento explica cómo migrar el sistema de almacenamiento de archivos de publicidad desde el disco local a servicios en la nube como AWS S3, Cloudinary o Azure Blob Storage.

## 🎯 Sistema Actual (Local)

**Funcionamiento:**
- Archivos se guardan en: `uploads/publicidad/`
- Ruta en BD: `/uploads/publicidad/nombre-archivo.ext`
- Descarga: Express envía el archivo con `res.download()`
- El navegador abre diálogo "Guardar como" permitiendo al usuario elegir dónde guardar

**Ventajas:**
✅ Simple y rápido para desarrollo
✅ No requiere configuración externa
✅ Sin costos adicionales

**Desventajas:**
❌ Archivos se pierden si el servidor se reinicia (en servicios como Render/Railway)
❌ Escalabilidad limitada
❌ Backups manuales

---

## ☁️ Migración a AWS S3

### 1. Instalar dependencias
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### 2. Configurar variables de entorno
```env
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=cinestar-publicidad
USE_CLOUD_STORAGE=true
```

### 3. Actualizar `middleware/upload.js`
```javascript
const multer = require('multer');
const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require('multer-s3');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET,
        acl: 'private', // Solo accesible con autenticación
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            const nameWithoutExt = path.basename(file.originalname, ext);
            cb(null, `publicidad/${nameWithoutExt}-${uniqueSuffix}${ext}`);
        }
    }),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: fileFilter
});
```

### 4. Actualizar `utils/fileStorage.js`
```javascript
const { S3Client, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const USE_CLOUD = process.env.USE_CLOUD_STORAGE === 'true';
const BUCKET = process.env.AWS_S3_BUCKET;

const getFilePath = (relativePath) => {
    if (USE_CLOUD) {
        // En S3, retornar la key (sin / inicial)
        return relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    }
    return path.join(__dirname, '..', relativePath);
};

const fileExists = async (relativePath) => {
    if (USE_CLOUD) {
        try {
            const command = new HeadObjectCommand({
                Bucket: BUCKET,
                Key: getFilePath(relativePath)
            });
            await s3Client.send(command);
            return true;
        } catch (error) {
            return false;
        }
    }
    return fs.existsSync(getFilePath(relativePath));
};

const getDownloadUrl = async (relativePath, expiresIn = 3600) => {
    if (USE_CLOUD) {
        const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: getFilePath(relativePath)
        });
        return await getSignedUrl(s3Client, command, { expiresIn });
    }
    // Para local, retornar la ruta normal
    return relativePath;
};
```

### 5. Actualizar el controller
```javascript
exports.descargarArchivo = async (req, res) => {
    try {
        const publicidad = await Publicidad.findByPk(req.params.id);

        if (!publicidad) {
            return res.status(404).json({ error: "Campaña no encontrada" });
        }

        if (!publicidad.archivo_publicidad) {
            return res.status(404).json({ error: "Esta campaña no tiene archivo adjunto" });
        }

        if (req.user.rol !== "admin" && publicidad.id_usuario !== req.user.id) {
            return res.status(403).json({ error: "No tienes permiso para descargar este archivo" });
        }

        if (!await fileExists(publicidad.archivo_publicidad)) {
            return res.status(404).json({ error: "El archivo no existe" });
        }

        if (process.env.USE_CLOUD_STORAGE === 'true') {
            // Generar URL firmada temporal (válida por 1 hora)
            const downloadUrl = await getDownloadUrl(publicidad.archivo_publicidad, 3600);
            return res.json({ downloadUrl });
        } else {
            // Descarga local
            const filePath = getFilePath(publicidad.archivo_publicidad);
            const fileName = getFileName(publicidad.archivo_publicidad);
            res.download(filePath, fileName);
        }
    } catch (error) {
        console.error("Error descargarArchivo:", error);
        res.status(500).json({ error: "Error al descargar archivo" });
    }
};
```

---

## 🌩️ Alternativa: Cloudinary (Recomendado para imágenes/videos)

### 1. Instalar dependencias
```bash
npm install cloudinary multer-storage-cloudinary
```

### 2. Configurar variables de entorno
```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
USE_CLOUD_STORAGE=true
```

### 3. Actualizar `middleware/upload.js`
```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'publicidad',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mov', 'wmv', 'pdf'],
        resource_type: 'auto'
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});
```

### 4. Controller con Cloudinary
```javascript
exports.descargarArchivo = async (req, res) => {
    // ... validaciones ...
    
    if (process.env.USE_CLOUD_STORAGE === 'true') {
        // Cloudinary ya provee URLs públicas o firmadas
        const publicUrl = publicidad.archivo_publicidad; // Ya es un URL completo
        return res.json({ downloadUrl: publicUrl });
    } else {
        // Descarga local
        const filePath = getFilePath(publicidad.archivo_publicidad);
        res.download(filePath);
    }
};
```

---

## 🎯 Comparación de Servicios

| Característica | Local | AWS S3 | Cloudinary |
|---|---|---|---|
| **Costo** | Gratis | $0.023/GB/mes | Gratis hasta 25GB |
| **Durabilidad** | ❌ Se pierde al reiniciar | ✅ 99.999999999% | ✅ 99.999999999% |
| **Velocidad** | ⚡ Muy rápida | ⚡ Rápida (CDN) | ⚡ Muy rápida (CDN) |
| **Transformaciones** | ❌ No | ❌ No | ✅ Sí (redimensionar, optimizar) |
| **Mejor para** | Desarrollo | Producción (todos los archivos) | Producción (imágenes/videos) |

---

## 📋 Checklist de Migración

- [ ] Crear cuenta en AWS/Cloudinary
- [ ] Configurar bucket/cloud
- [ ] Instalar dependencias necesarias
- [ ] Actualizar variables de entorno
- [ ] Modificar `middleware/upload.js`
- [ ] Actualizar `utils/fileStorage.js`
- [ ] Modificar controllers
- [ ] Probar upload de archivos
- [ ] Probar descarga de archivos
- [ ] Migrar archivos existentes (script de migración)
- [ ] Actualizar frontend si es necesario
- [ ] Realizar backup de archivos locales
- [ ] Desplegar a producción
- [ ] Verificar funcionamiento

---

## 💡 Recomendaciones

1. **Desarrollo**: Mantén el sistema local actual
2. **Producción pequeña**: Usa Cloudinary (más fácil, gratis hasta 25GB)
3. **Producción grande**: Usa AWS S3 (más económico a escala)
4. **Variables de entorno**: Usa `.env` diferente para desarrollo y producción
5. **Migración gradual**: Soporta ambos sistemas simultáneamente durante la transición

---

## 🔒 Seguridad

- ✅ **URLs firmadas**: Expiran después de X tiempo
- ✅ **Autenticación**: Solo usuarios autorizados pueden descargar
- ✅ **ACL privado**: Archivos no son públicos por defecto
- ✅ **HTTPS**: Todas las descargas usan conexión segura

---

## 🚀 Despliegue Actual (Sin cambios)

El sistema actual funcionará perfectamente en:
- ✅ **Render**: Pero archivos se pierden al reiniciar (usa almacenamiento efímero)
- ✅ **Railway**: Similar a Render
- ✅ **Vercel**: No soporta uploads, necesitas usar nube desde el inicio
- ✅ **VPS/Servidor dedicado**: Funciona perfectamente sin cambios

**Conclusión**: Si vas a usar Render/Railway/Vercel, implementa almacenamiento en nube ANTES de desplegar a producción.

