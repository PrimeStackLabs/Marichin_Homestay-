import React, { useState } from 'react';
import { Upload, CheckCircle2, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { normalizeImageUrl, isGoogleDriveUrl } from '../../utils/imageUrl';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export const ImageUploadOrDrive = ({
  label = 'Photo / Image',
  value = '',
  onChange,
  placeholder = 'Paste Image URL or Google Drive Share Link...'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeMode, setActiveMode] = useState('drive'); // 'drive' (URL/Drive) | 'upload'
  const { language } = useLanguage();
  const isKn = language === 'kn';

  const handleUrlChange = (rawUrl) => {
    setUploadError('');
    const normalized = normalizeImageUrl(rawUrl);
    onChange(normalized);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.admin.uploadImage(formData);
      if (res?.data?.url) {
        onChange(res.data.url);
      } else {
        throw new Error('Upload succeeded but no URL was returned');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setUploadError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const isDrive = isGoogleDriveUrl(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-[var(--admin-text)] font-semibold text-xs flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[var(--admin-gold-text)]" />
          <span>{label}</span>
        </label>

        {/* Toggle Mode Pills */}
        <div className="inline-flex rounded-lg bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] p-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => setActiveMode('drive')}
            className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
              activeMode === 'drive'
                ? 'bg-[var(--admin-gold)] text-[#0F2A20] font-bold shadow-sm'
                : 'text-[var(--admin-muted)] hover:text-[var(--admin-heading)]'
            }`}
          >
            {isKn ? 'ಡ್ರೈವ್ / ವೆಬ್ ಲಿಂಕ್' : 'Drive / Web Link'}
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('upload')}
            className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
              activeMode === 'upload'
                ? 'bg-[var(--admin-gold)] text-[#0F2A20] font-bold shadow-sm'
                : 'text-[var(--admin-muted)] hover:text-[var(--admin-heading)]'
            }`}
          >
            {isKn ? 'ಫೈಲ್ ಅಪ್‌ಲೋಡ್' : 'Upload File'}
          </button>
        </div>
      </div>

      {activeMode === 'drive' ? (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={value || ''}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-white border border-[var(--admin-input-border)] focus:border-[#0F2A20] rounded-xl px-3 py-2 text-[var(--admin-text)] text-xs font-mono pr-8 placeholder:text-[var(--admin-muted)]"
              />
              {value && (
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--admin-muted)] hover:text-red-700 cursor-pointer"
                  title="Clear URL"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <label className="px-3 py-2 bg-[#0F2A20] text-[#F3EDDD] hover:bg-[var(--admin-gold)] hover:text-[#0F2A20] rounded-xl cursor-pointer flex items-center gap-1.5 font-semibold text-xs flex-shrink-0 transition-colors shadow-sm">
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{isUploading ? (isKn ? 'ಅಪ್‌ಲೋಡ್...' : 'Uploading...') : (isKn ? 'ಅಪ್‌ಲೋಡ್' : 'Upload')}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {isDrive && (
            <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-700" />
              <span>
                {isKn
                  ? 'ಗೂಗಲ್ ಡ್ರೈವ್ ಲಿಂಕ್ ನೇರ ಪ್ರದರ್ಶನಕ್ಕಾಗಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಪರಿವರ್ತಿಸಲಾಗಿದೆ'
                  : 'Google Drive share link automatically converted for direct display'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <label className="flex-1 px-4 py-3 bg-[var(--admin-surface-subtle)] border border-dashed border-[var(--admin-input-border)] hover:border-[#0F2A20] rounded-xl cursor-pointer flex items-center justify-center gap-2 text-xs text-[var(--admin-heading)] font-medium transition-all">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--admin-gold-text)]" />
                  <span>{isKn ? 'ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Uploading local image...'}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-[var(--admin-gold-text)]" />
                  <span>
                    {isKn
                      ? 'ಕಂಪ್ಯೂಟರ್‌ನಿಂದ ಚಿತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ (JPG, PNG, WEBP)'
                      : 'Choose local file from your computer (JPG, PNG, WEBP)'}
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploading}
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>
      )}

      {uploadError && (
        <p className="text-[11px] text-red-800 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
          {uploadError}
        </p>
      )}

      {/* Live Thumbnail Preview */}
      {value ? (
        <div className="flex items-center gap-3 p-2 bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] rounded-xl">
          <div className="w-16 h-12 rounded-lg overflow-hidden bg-white border border-[var(--admin-border)] flex-shrink-0 relative">
            <img
              src={normalizeImageUrl(value)}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-mono text-[var(--admin-heading)] font-medium truncate block">
              {value}
            </span>
            <span className="text-[10px] text-[var(--admin-muted)] block">
              {isKn ? 'ನೇರ ಪೂರ್ವವೀಕ್ಷಣೆ ಸಕ್ರಿಯವಾಗಿದೆ' : 'Live Preview Active'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
            title="Remove Photo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default ImageUploadOrDrive;
