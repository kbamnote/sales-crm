/**
 * Cloudinary upload helpers (unsigned). Used by presentation recording (audio +
 * selfie) and sales-deck uploads.
 *
 * Cloud name / upload preset come from env vars (VITE_CLOUDINARY_*); when unset
 * we fall back to the values the mobile app hardcodes in presentationService.js,
 * so the web panel and app write into the same account.
 */

const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dpreeciaf';
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'salescrm_attendance';

const isConfigured = () => !!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && !!import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload a Blob/File to Cloudinary.
 * @param {Blob} file  the file/blob to upload
 * @param {string} resourceType 'image' | 'video' | 'auto' (audio → 'video')
 * @returns {Promise<string>} the secure_url
 */
export async function uploadToCloudinary(file, resourceType = 'auto') {
  if (!isConfigured()) {
    // No real upload target configured — mock an upload delay and return a
    // data URL so the flow can still be exercised in local dev.
    await new Promise(r => setTimeout(r, 1200));
    return URL.createObjectURL(file);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/${resourceType}/upload`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error(`Cloudinary upload failed (${res.status})`);
  const data = await res.json();
  if (!data.secure_url) throw new Error(data.error?.message || 'Cloudinary upload failed');
  return data.secure_url;
}

/** Upload audio (webm/ogg/m4a) to Cloudinary. Returns a URL. */
export const uploadAudio = (blob) => uploadToCloudinary(blob, 'video');

/** Upload an image (selfie / deck thumbnail) to Cloudinary. Returns a URL. */
export const uploadImage = (blob) => uploadToCloudinary(blob, 'image');
