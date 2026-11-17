import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let bucket = null;

export const getGridFSBucket = () => {
  if (bucket) return bucket;
  const db = mongoose.connection.db;
  if (!db) return null;
  bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: 'uploads'
  });
  return bucket;
};

/**
 * Saves a file from disk into MongoDB Atlas GridFS
 */
export const saveFileToGridFS = async (filename, filePath, mimetype) => {
  try {
    const gfs = getGridFSBucket();
    if (!gfs || !fs.existsSync(filePath)) return null;

    // Remove existing file with the same filename to avoid duplicates
    const existing = await gfs.find({ filename }).toArray();
    for (const file of existing) {
      await gfs.delete(file._id).catch(() => null);
    }

    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(filePath);
      const uploadStream = gfs.openUploadStream(filename, {
        contentType: mimetype || 'application/octet-stream',
        metadata: { originalPath: filePath, uploadDate: new Date() }
      });

      readStream
        .pipe(uploadStream)
        .on('finish', () => resolve(uploadStream.id))
        .on('error', (err) => reject(err));
    });
  } catch (error) {
    console.error(`[GridFS] Error saving ${filename}:`, error.message);
    return null;
  }
};

/**
 * Finds a file record by filename
 */
export const getGridFSFile = async (filename) => {
  try {
    const gfs = getGridFSBucket();
    if (!gfs) return null;
    const files = await gfs.find({ filename }).toArray();
    return files && files.length > 0 ? files[0] : null;
  } catch (error) {
    console.error(`[GridFS] Error finding ${filename}:`, error.message);
    return null;
  }
};

/**
 * Returns a readable stream for a GridFS file by ID
 */
export const openGridFSDownloadStream = (id) => {
  const gfs = getGridFSBucket();
  if (!gfs) return null;
  return gfs.openDownloadStream(id);
};

/**
 * Deletes a file from GridFS by filename
 */
export const deleteFileFromGridFS = async (filename) => {
  try {
    const gfs = getGridFSBucket();
    if (!gfs) return false;
    const files = await gfs.find({ filename }).toArray();
    for (const file of files) {
      await gfs.delete(file._id).catch(() => null);
    }
    return true;
  } catch (error) {
    console.error(`[GridFS] Error deleting ${filename}:`, error.message);
    return false;
  }
};

/**
 * Syncs any local files in server/uploads to GridFS (runs on startup)
 */
export const syncDiskUploadsToGridFS = async (uploadDir) => {
  try {
    const gfs = getGridFSBucket();
    if (!gfs || !fs.existsSync(uploadDir)) return;

    const files = fs.readdirSync(uploadDir);
    for (const file of files) {
      if (file === '.gitkeep' || file.startsWith('.')) continue;
      const filePath = path.join(uploadDir, file);
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      const existing = await gfs.find({ filename: file }).toArray();
      if (!existing || existing.length === 0) {
        console.log(`[GridFS] Syncing disk upload to GridFS: ${file}`);
        await saveFileToGridFS(file, filePath);
      }
    }
  } catch (err) {
    console.warn('[GridFS] Auto-sync notice:', err.message);
  }
};
