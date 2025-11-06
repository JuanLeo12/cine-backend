/**
 * Utilidades para manejo de archivos
 * Permite cambiar fácilmente entre almacenamiento local y en la nube
 */

const path = require('path');
const fs = require('fs');

/**
 * Obtener la ruta completa de un archivo
 * @param {string} relativePath - Ruta relativa del archivo (ej: '/uploads/publicidad/archivo.jpg')
 * @returns {string} Ruta absoluta del archivo
 */
const getFilePath = (relativePath) => {
    // Para almacenamiento local
    return path.join(__dirname, '..', relativePath);
    
    // TODO: Para la nube, retornar URL de S3/Cloudinary/etc:
    // if (process.env.USE_CLOUD_STORAGE === 'true') {
    //     return `https://tu-bucket.s3.amazonaws.com${relativePath}`;
    // }
};

/**
 * Verificar si un archivo existe
 * @param {string} relativePath - Ruta relativa del archivo
 * @returns {boolean} True si existe
 */
const fileExists = (relativePath) => {
    // Para almacenamiento local
    const filePath = getFilePath(relativePath);
    return fs.existsSync(filePath);
    
    // TODO: Para la nube, hacer petición HEAD al URL
    // if (process.env.USE_CLOUD_STORAGE === 'true') {
    //     // Verificar existencia en S3/Cloudinary
    // }
};

/**
 * Obtener el nombre del archivo desde su ruta
 * @param {string} filePath - Ruta del archivo
 * @returns {string} Nombre del archivo
 */
const getFileName = (filePath) => {
    return path.basename(filePath);
};

/**
 * Eliminar un archivo
 * @param {string} relativePath - Ruta relativa del archivo
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
const deleteFile = async (relativePath) => {
    try {
        // Para almacenamiento local
        const filePath = getFilePath(relativePath);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        
        // TODO: Para la nube, eliminar de S3/Cloudinary
        // if (process.env.USE_CLOUD_STORAGE === 'true') {
        //     // await s3.deleteObject({ Bucket: bucket, Key: key });
        // }
        
        return false;
    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        return false;
    }
};

module.exports = {
    getFilePath,
    fileExists,
    getFileName,
    deleteFile
};
