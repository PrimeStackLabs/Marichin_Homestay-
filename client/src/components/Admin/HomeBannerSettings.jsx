import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Lock,
  RotateCcw,
  Save,
  Trash2,
  Undo2,
  Upload,
  Video
} from 'lucide-react';
import { api } from '../../services/api';
import {
  DEFAULT_HERO_BANNER,
  DEFAULT_HERO_POSTER_FALLBACK,
  DEFAULT_HERO_VIDEO_URL,
  HERO_BADGE_RECOMMENDED_LENGTH,
  HERO_SUBTITLE_RECOMMENDED_LENGTH,
  HERO_TITLE_RECOMMENDED_LENGTH,
  isDefaultHeroVideo,
  normalizeHeroBannerSettingsClient,
  resolveHeroPosterUrl,
  validateHeroPosterFile,
  validateHeroVideoFile,
  validateHeroVideoUrlInput
} from '../../utils/heroBannerDefaults';
import { resolveMediaUrl, normalizeImageUrl } from '../../utils/imageUrl';

const OVERLAY_CHOICES = [
  {
    value: 'light',
    label: 'Light',
    hint: 'Brighter video visibility'
  },
  {
    value: 'medium',
    label: 'Medium',
    hint: 'Balanced contrast (Recommended)'
  },
  {
    value: 'strong',
    label: 'Strong',
    hint: 'Darkest backdrop for maximum text contrast'
  }
];

const buildFormState = (siteSettings) => {
  const normalized = normalizeHeroBannerSettingsClient(siteSettings || DEFAULT_HERO_BANNER);
  return {
    heroVideoUrl: normalized.heroVideoUrl,
    heroPosterUrl: normalized.heroPosterUrl,
    heroBadge: { ...normalized.heroBadge },
    heroTitle: { ...normalized.heroTitle },
    heroSubtitle: { ...normalized.heroSubtitle },
    heroPrimaryLabel: { ...normalized.heroPrimaryLabel },
    heroSecondaryLabel: { ...normalized.heroSecondaryLabel },
    heroOverlay: normalized.heroOverlay
  };
};

const extractFilenameFromUploadUrl = (url) => {
  const trimmed = String(url || '').trim();
  if (!trimmed.startsWith('/uploads/')) return '';
  return trimmed.slice('/uploads/'.length);
};

export const HomeBannerSettings = ({
  isAdmin = false,
  siteSettings,
  saveSiteSettings,
  showToast
}) => {
  const savedSnapshot = useMemo(() => buildFormState(siteSettings), [siteSettings]);

  const [form, setForm] = useState(savedSnapshot);
  const [externalVideoUrl, setExternalVideoUrl] = useState(() =>
    savedSnapshot.heroVideoUrl.startsWith('https://') ? savedSnapshot.heroVideoUrl : ''
  );
  const [uploadingKind, setUploadingKind] = useState(null); // 'video' | 'poster' | null
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [previewVideoError, setPreviewVideoError] = useState(false);

  const videoInputRef = useRef(null);
  const posterInputRef = useRef(null);
  const pendingTempUrlsRef = useRef([]);

  const isDirty = useMemo(() => {
    if (JSON.stringify(form) !== JSON.stringify(savedSnapshot)) return true;
    const typedLink = externalVideoUrl.trim();
    const savedLink = savedSnapshot.heroVideoUrl.startsWith('https://') ? savedSnapshot.heroVideoUrl : '';
    return typedLink !== savedLink;
  }, [form, savedSnapshot, externalVideoUrl]);

  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // Sync incoming saved settings when there are no unsaved edits
  useEffect(() => {
    if (!isDirtyRef.current) {
      setForm(savedSnapshot);
      setExternalVideoUrl(
        savedSnapshot.heroVideoUrl.startsWith('https://') ? savedSnapshot.heroVideoUrl : ''
      );
      setPreviewVideoError(false);
    }
  }, [savedSnapshot]);

  // Reset preview error whenever active preview video URL changes
  useEffect(() => {
    setPreviewVideoError(false);
  }, [form.heroVideoUrl]);

  const effectivePosterPreview = useMemo(() => {
    if (form.heroPosterUrl) return form.heroPosterUrl;
    return resolveHeroPosterUrl({
      heroPosterUrl: '',
      heroImage: siteSettings?.heroImage || DEFAULT_HERO_POSTER_FALLBACK
    });
  }, [form.heroPosterUrl, siteSettings?.heroImage]);

  const cleanupTempUploads = async (urlsToKeep = []) => {
    const keepSet = new Set(urlsToKeep.filter(Boolean));
    const candidates = [...new Set(pendingTempUrlsRef.current)].filter((u) => !keepSet.has(u));
    if (candidates.length === 0) {
      pendingTempUrlsRef.current = pendingTempUrlsRef.current.filter((u) => keepSet.has(u));
      return;
    }

    await Promise.allSettled(
      candidates.map((url) => {
        const filename = extractFilenameFromUploadUrl(url);
        return filename ? api.admin.deleteHeroBannerMedia(filename) : Promise.resolve();
      })
    );
    pendingTempUrlsRef.current = pendingTempUrlsRef.current.filter((u) => keepSet.has(u));
  };

  const handleVideoFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !isAdmin) return;

    setFormError('');
    setFormSuccess('');

    const validation = validateHeroVideoFile(file);
    if (!validation.valid) {
      setFormError(validation.message);
      showToast?.(validation.message, 'error');
      return;
    }

    setUploadingKind('video');
    try {
      const formData = new FormData();
      formData.append('kind', 'video');
      formData.append('file', file);
      const res = await api.admin.uploadHeroBannerMedia(formData, 'video');
      const uploadedUrl = res?.data?.url;
      if (!uploadedUrl) {
        throw new Error('Server did not return uploaded video URL.');
      }

      pendingTempUrlsRef.current.push(uploadedUrl);
      setForm((prev) => ({ ...prev, heroVideoUrl: uploadedUrl }));
      setExternalVideoUrl('');
      setPreviewVideoError(false);
      showToast?.('Banner video uploaded to draft. Click Save to publish it to the Home page.', 'success');
    } catch (err) {
      const msg = err?.message || 'Failed to upload banner video.';
      setFormError(msg);
      showToast?.(msg, 'error');
    } finally {
      setUploadingKind(null);
    }
  };

  const handlePosterFileSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !isAdmin) return;

    setFormError('');
    setFormSuccess('');

    const validation = validateHeroPosterFile(file);
    if (!validation.valid) {
      setFormError(validation.message);
      showToast?.(validation.message, 'error');
      return;
    }

    setUploadingKind('poster');
    try {
      const formData = new FormData();
      formData.append('kind', 'poster');
      formData.append('file', file);
      const res = await api.admin.uploadHeroBannerMedia(formData, 'poster');
      const uploadedUrl = res?.data?.url;
      if (!uploadedUrl) {
        throw new Error('Server did not return uploaded poster URL.');
      }

      pendingTempUrlsRef.current.push(uploadedUrl);
      setForm((prev) => ({ ...prev, heroPosterUrl: uploadedUrl }));
      showToast?.('Poster image uploaded to draft. Click Save to apply changes.', 'success');
    } catch (err) {
      const msg = err?.message || 'Failed to upload poster image.';
      setFormError(msg);
      showToast?.(msg, 'error');
    } finally {
      setUploadingKind(null);
    }
  };

  const handleApplyExternalVideoUrl = () => {
    if (!isAdmin) return;
    setFormError('');
    setFormSuccess('');

    const trimmed = externalVideoUrl.trim();
    if (!trimmed) {
      setFormError('Please paste a direct https:// video URL ending in .mp4 or .webm.');
      return;
    }

    const res = validateHeroVideoUrlInput(trimmed);
    if (!res.valid || !res.value.startsWith('https://')) {
      const msg = res.valid
        ? 'Direct video link must begin with https:// and end in .mp4 or .webm.'
        : res.message;
      setFormError(msg);
      showToast?.(msg, 'error');
      return;
    }

    setForm((prev) => ({ ...prev, heroVideoUrl: res.value }));
    setExternalVideoUrl(res.value);
    setPreviewVideoError(false);
    showToast?.('Direct video link applied to preview. Click Save to publish.', 'info');
  };

  const handleResetToDefaultVideo = () => {
    if (!isAdmin) return;
    setFormError('');
    setFormSuccess('');
    setForm((prev) => ({ ...prev, heroVideoUrl: DEFAULT_HERO_VIDEO_URL }));
    setExternalVideoUrl('');
    setPreviewVideoError(false);
    showToast?.('Default Homestay video restored in draft. Click Save to apply.', 'info');
  };

  const handleDiscardChanges = async () => {
    if (!isAdmin) return;
    setFormError('');
    setFormSuccess('');
    await cleanupTempUploads([savedSnapshot.heroVideoUrl, savedSnapshot.heroPosterUrl]);
    setForm(savedSnapshot);
    setExternalVideoUrl(
      savedSnapshot.heroVideoUrl.startsWith('https://') ? savedSnapshot.heroVideoUrl : ''
    );
    setPreviewVideoError(false);
    showToast?.('Unsaved Home Banner changes discarded', 'info');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin || uploadingKind || saving) return;

    setFormError('');
    setFormSuccess('');

    let resolvedVideoUrl = form.heroVideoUrl;
    const typedExternal = externalVideoUrl.trim();
    const savedExternal = savedSnapshot.heroVideoUrl.startsWith('https://')
      ? savedSnapshot.heroVideoUrl
      : '';

    if (typedExternal && typedExternal !== form.heroVideoUrl && typedExternal !== savedExternal) {
      const linkCheck = validateHeroVideoUrlInput(typedExternal);
      if (!linkCheck.valid || !linkCheck.value.startsWith('https://')) {
        const msg = linkCheck.valid
          ? 'External video URL must start with https:// and end in .mp4 or .webm.'
          : linkCheck.message;
        setFormError(msg);
        showToast?.(msg, 'error');
        return;
      }
      resolvedVideoUrl = linkCheck.value;
    } else {
      const videoCheck = validateHeroVideoUrlInput(resolvedVideoUrl);
      if (!videoCheck.valid) {
        setFormError(videoCheck.message);
        showToast?.(videoCheck.message, 'error');
        return;
      }
      resolvedVideoUrl = videoCheck.value;
    }

    const requiredTextChecks = [
      { field: form.heroBadge, label: 'Small Badge Line' },
      { field: form.heroTitle, label: 'Main Heading' },
      { field: form.heroSubtitle, label: 'Description Paragraph' },
      { field: form.heroPrimaryLabel, label: 'Primary Button Label' },
      { field: form.heroSecondaryLabel, label: 'Secondary Button Label' }
    ];

    for (const item of requiredTextChecks) {
      if (!String(item.field?.en || '').trim() || !String(item.field?.kn || '').trim()) {
        const msg = `${item.label} requires both English and Kannada text.`;
        setFormError(msg);
        showToast?.(msg, 'error');
        return;
      }
    }

    const payload = {
      heroVideoUrl: resolvedVideoUrl,
      heroPosterUrl: form.heroPosterUrl,
      heroOverlay: form.heroOverlay,
      heroBadge: {
        en: form.heroBadge.en.trim(),
        kn: form.heroBadge.kn.trim()
      },
      heroTitle: {
        en: form.heroTitle.en.trim(),
        kn: form.heroTitle.kn.trim()
      },
      heroSubtitle: {
        en: form.heroSubtitle.en.trim(),
        kn: form.heroSubtitle.kn.trim()
      },
      heroPrimaryLabel: {
        en: form.heroPrimaryLabel.en.trim(),
        kn: form.heroPrimaryLabel.kn.trim()
      },
      heroSecondaryLabel: {
        en: form.heroSecondaryLabel.en.trim(),
        kn: form.heroSecondaryLabel.kn.trim()
      }
    };

    setSaving(true);
    try {
      const res = await saveSiteSettings(payload, { strict: true });
      if (!res?.success) {
        const msg = res?.message || 'Could not save Home Banner settings. Your edits are still in the form.';
        setFormError(msg);
        return;
      }

      // Remove any intermediate unused temp uploads created before clicking Save
      await cleanupTempUploads([payload.heroVideoUrl, payload.heroPosterUrl]);
      setForm(buildFormState(payload));
      setExternalVideoUrl(payload.heroVideoUrl.startsWith('https://') ? payload.heroVideoUrl : '');
      setFormSuccess('Home Banner saved and live on the website.');
    } catch (err) {
      const msg = err?.message || 'Failed to save Home Banner settings.';
      setFormError(msg);
      showToast?.(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateBilingual = (key, lang, value) => {
    setFormError('');
    setFormSuccess('');
    setForm((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { en: '', kn: '' }),
        [lang]: value
      }
    }));
  };

  const renderCharCounter = (value, recommended) => {
    const count = String(value || '').length;
    const isLong = count > recommended;
    return (
      <span className={`text-[10px] font-mono ${isLong ? 'text-amber-800 font-semibold' : 'text-[var(--admin-muted)]'}`}>
        {count} chars (recommended ~{recommended})
      </span>
    );
  };

  const usingDefaultVideo = isDefaultHeroVideo(form.heroVideoUrl);

  return (
    <div className="admin-card p-6 max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Video className="w-5 h-5 text-[var(--admin-gold-text)]" />
            <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)]">
              Home Banner
            </h3>
            {!isAdmin && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold uppercase tracking-wider">
                <Lock className="w-3 h-3" /> Read-only for Staff
              </span>
            )}
            {isAdmin && isDirty && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#FBF6E8] border border-[var(--admin-gold)]/40 text-[#78591C] text-[10px] font-semibold uppercase tracking-wider">
                Unsaved changes
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--admin-muted)] mt-1">
            Update only the Home page hero background video, poster image, overlay darkness, and bilingual text tagline. Layout, facilities strip, animations, and page links stay unchanged.
          </p>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl admin-btn-outline text-xs transition-colors flex-shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Preview on Home page
        </a>
      </div>

      {!isAdmin && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-900 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>Staff accounts can view the current Home Banner settings and open the live Home page preview, but only an Admin can edit or upload media.</span>
        </div>
      )}

      {formError && (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-800 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {formSuccess && (
        <div
          role="status"
          className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800 flex items-start gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
          <span>{formSuccess}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* 1. Video Preview & Video Upload / Link */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start p-4 rounded-xl bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)]">
          <div className="lg:col-span-6 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[var(--admin-heading)] uppercase tracking-wider text-[11px]">
                Live Video Preview
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#EEF2EA] text-[var(--admin-heading)] border border-[var(--admin-border)] font-mono truncate max-w-[200px]">
                {usingDefaultVideo
                  ? 'Default video'
                  : form.heroVideoUrl.startsWith('/uploads/')
                  ? 'Uploaded video'
                  : 'External HTTPS video'}
              </span>
            </div>

            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#0F2A20] border border-[var(--admin-border)]">
              <video
                key={`${form.heroVideoUrl}|${effectivePosterPreview}`}
                src={resolveMediaUrl(form.heroVideoUrl)}
                poster={normalizeImageUrl(effectivePosterPreview)}
                controls
                muted
                playsInline
                preload="metadata"
                onError={() => setPreviewVideoError(true)}
                onLoadedData={() => setPreviewVideoError(false)}
                className="w-full h-full object-cover"
              />
            </div>

            {previewVideoError && (
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-700" />
                Could not play this video in preview. Check that the file or direct HTTPS link is an accessible MP4 or WebM stream.
              </p>
            )}

            <p className="text-[11px] text-[var(--admin-muted)] break-all font-mono">
              Source: {form.heroVideoUrl}
            </p>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div>
              <label className="text-[var(--admin-heading)] font-semibold block mb-1.5">
                Background Video (MP4 or WebM, max 50 MB)
              </label>

              {isAdmin && (
                <>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,.mp4,.webm"
                    onChange={handleVideoFileSelected}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={Boolean(uploadingKind) || saving}
                      onClick={() => videoInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg admin-btn-primary disabled:opacity-50 cursor-pointer"
                    >
                      {uploadingKind === 'video' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      {uploadingKind === 'video' ? 'Uploading video...' : 'Replace video'}
                    </button>

                    <button
                      type="button"
                      disabled={usingDefaultVideo || Boolean(uploadingKind) || saving}
                      onClick={handleResetToDefaultVideo}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg admin-btn-outline disabled:opacity-45 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset to default video
                    </button>
                  </div>
                </>
              )}

              <p className="text-[11px] text-[var(--admin-muted)] leading-relaxed mt-2.5">
                Short, muted, landscape video (1920x1080 or 1280x720, under 20 MB works fastest on mobile). Replacing or resetting deletes any older uploaded video when you save.
              </p>
            </div>

            <div className="pt-3 border-t border-[var(--admin-border)]">
              <label className="text-[var(--admin-text)] font-medium block mb-1.5">
                Or paste a direct HTTPS video link (.mp4 or .webm)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  disabled={!isAdmin || Boolean(uploadingKind) || saving}
                  value={externalVideoUrl}
                  onChange={(e) => {
                    setExternalVideoUrl(e.target.value);
                    setFormError('');
                    setFormSuccess('');
                  }}
                  placeholder="https://cdn.example.com/marichin-banner.mp4"
                  className="flex-1 bg-white border border-[var(--admin-input-border)] rounded-lg px-3 py-2 text-[var(--admin-text)] font-mono text-xs disabled:opacity-60"
                />
                {isAdmin && (
                  <button
                    type="button"
                    disabled={Boolean(uploadingKind) || saving || !externalVideoUrl.trim()}
                    onClick={handleApplyExternalVideoUrl}
                    className="px-3 py-2 rounded-lg admin-btn-secondary disabled:opacity-45 flex-shrink-0 cursor-pointer"
                  >
                    Use Link
                  </button>
                )}
              </div>
            </div>

            {/* Optional Poster & Overlay Strength */}
            <div className="pt-3 border-t border-[var(--admin-border)] space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[var(--admin-heading)] font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[var(--admin-gold-text)]" />
                    Poster Image (Optional, max 5 MB)
                  </span>
                  {form.heroPosterUrl && (
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                      Custom poster active
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-24 h-14 rounded-lg overflow-hidden border border-[var(--admin-border)] bg-white flex-shrink-0">
                    <img
                      src={effectivePosterPreview}
                      alt="Hero poster preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {isAdmin && (
                      <>
                        <input
                          ref={posterInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                          onChange={handlePosterFileSelected}
                          className="hidden"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={Boolean(uploadingKind) || saving}
                            onClick={() => posterInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg admin-btn-outline disabled:opacity-50 cursor-pointer"
                          >
                            {uploadingKind === 'poster' ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            {uploadingKind === 'poster'
                              ? 'Uploading poster...'
                              : form.heroPosterUrl
                              ? 'Replace poster'
                              : 'Upload poster'}
                          </button>

                          {form.heroPosterUrl && (
                            <button
                              type="button"
                              disabled={Boolean(uploadingKind) || saving}
                              onClick={() => {
                                setForm((prev) => ({ ...prev, heroPosterUrl: '' }));
                                setFormSuccess('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors cursor-pointer font-semibold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </button>
                          )}
                        </div>
                      </>
                    )}
                    <p className="text-[10px] text-[var(--admin-muted)]">
                      Shown while the video loads or when reduced-motion / data-saver is enabled. Defaults to current Homestay hero image when cleared.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[var(--admin-heading)] font-semibold block mb-1.5">
                  Text Readability Overlay
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {OVERLAY_CHOICES.map((opt) => {
                    const selected = form.heroOverlay === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={!isAdmin || saving}
                        onClick={() => {
                          setForm((prev) => ({ ...prev, heroOverlay: opt.value }));
                          setFormError('');
                          setFormSuccess('');
                        }}
                        className={`text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#FBF6E8] border-[var(--admin-gold)] text-[var(--admin-heading)] ring-1 ring-[var(--admin-gold)]'
                            : 'bg-white border-[var(--admin-border)] text-[var(--admin-text)] hover:border-[var(--admin-gold)]'
                        } disabled:opacity-60`}
                      >
                        <div className="font-semibold text-[11px]">{opt.label}</div>
                        <div className="text-[10px] text-[var(--admin-muted)] leading-tight mt-0.5">{opt.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Tagline & Text Fields (English & Kannada) */}
        <div className="space-y-4">
          <div className="border-b border-[var(--admin-border)] pb-2">
            <h4 className="font-serif text-sm font-semibold text-[var(--admin-heading)]">
              Banner Tagline &amp; Text (English &amp; Kannada)
            </h4>
          </div>

          {/* Small badge line */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)]">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="text-[var(--admin-heading)] font-medium">Small Badge Line (English)</label>
                {renderCharCounter(form.heroBadge.en, HERO_BADGE_RECOMMENDED_LENGTH)}
              </div>
              <input
                type="text"
                disabled={!isAdmin || saving}
                value={form.heroBadge.en}
                onChange={(e) => updateBilingual('heroBadge', 'en', e.target.value)}
                className="w-full rounded-lg px-3 py-2 disabled:opacity-60"
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="text-[var(--admin-heading)] font-medium">Small Badge Line (Kannada / ಕನ್ನಡ)</label>
                {renderCharCounter(form.heroBadge.kn, HERO_BADGE_RECOMMENDED_LENGTH)}
              </div>
              <input
                type="text"
                disabled={!isAdmin || saving}
                value={form.heroBadge.kn}
                onChange={(e) => updateBilingual('heroBadge', 'kn', e.target.value)}
                className="w-full rounded-lg px-3 py-2 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Main Heading */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)]">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="text-[var(--admin-heading)] font-medium">Main Heading (English)</label>
                {renderCharCounter(form.heroTitle.en, HERO_TITLE_RECOMMENDED_LENGTH)}
              </div>
              <textarea
                rows={2}
                disabled={!isAdmin || saving}
                value={form.heroTitle.en}
                onChange={(e) => updateBilingual('heroTitle', 'en', e.target.value)}
                className="w-full rounded-lg px-3 py-2 disabled:opacity-60"
              />
              <span className="text-[10px] text-[var(--admin-muted)] block mt-0.5">
                Press Enter where you want an explicit line break on the Home page.
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="text-[var(--admin-heading)] font-medium">Main Heading (Kannada / ಕನ್ನಡ)</label>
                {renderCharCounter(form.heroTitle.kn, HERO_TITLE_RECOMMENDED_LENGTH)}
              </div>
              <textarea
                rows={2}
                disabled={!isAdmin || saving}
                value={form.heroTitle.kn}
                onChange={(e) => updateBilingual('heroTitle', 'kn', e.target.value)}
                className="w-full rounded-lg px-3 py-2 disabled:opacity-60"
              />
              <span className="text-[10px] text-[var(--admin-muted)] block mt-0.5">
                ಮುಖಪುಟದ ಶೀರ್ಷಿಕೆಯಲ್ಲಿ ಹೊಸ ಸಾಲಿಗಾಗಿ Enter ಒತ್ತಿರಿ.
              </span>
            </div>
          </div>

          {/* Description Paragraph */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)]">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="text-[var(--admin-heading)] font-medium">Description Paragraph (English)</label>
                {renderCharCounter(form.heroSubtitle.en, HERO_SUBTITLE_RECOMMENDED_LENGTH)}
              </div>
              <textarea
                rows={3}
                disabled={!isAdmin || saving}
                value={form.heroSubtitle.en}
                onChange={(e) => updateBilingual('heroSubtitle', 'en', e.target.value)}
                className="w-full rounded-lg px-3 py-2 disabled:opacity-60"
              />
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="text-[var(--admin-heading)] font-medium">Description Paragraph (Kannada / ಕನ್ನಡ)</label>
                {renderCharCounter(form.heroSubtitle.kn, HERO_SUBTITLE_RECOMMENDED_LENGTH)}
              </div>
              <textarea
                rows={3}
                disabled={!isAdmin || saving}
                value={form.heroSubtitle.kn}
                onChange={(e) => updateBilingual('heroSubtitle', 'kn', e.target.value)}
                className="w-full rounded-lg px-3 py-2 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Button Labels */}
          <div className="p-3.5 rounded-xl bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] space-y-3">
            <div>
              <div className="text-[var(--admin-heading)] font-medium">Button Labels (Optional, links to /rooms and /booking stay fixed)</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[var(--admin-muted)] block mb-1">Primary Button (English → /rooms)</label>
                <input
                  type="text"
                  disabled={!isAdmin || saving}
                  value={form.heroPrimaryLabel.en}
                  onChange={(e) => updateBilingual('heroPrimaryLabel', 'en', e.target.value)}
                  className="w-full rounded-lg px-3 py-2 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="text-[var(--admin-muted)] block mb-1">Primary Button (Kannada → /rooms)</label>
                <input
                  type="text"
                  disabled={!isAdmin || saving}
                  value={form.heroPrimaryLabel.kn}
                  onChange={(e) => updateBilingual('heroPrimaryLabel', 'kn', e.target.value)}
                  className="w-full rounded-lg px-3 py-2 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="text-[var(--admin-muted)] block mb-1">Secondary Button (English → /booking)</label>
                <input
                  type="text"
                  disabled={!isAdmin || saving}
                  value={form.heroSecondaryLabel.en}
                  onChange={(e) => updateBilingual('heroSecondaryLabel', 'en', e.target.value)}
                  className="w-full rounded-lg px-3 py-2 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="text-[var(--admin-muted)] block mb-1">Secondary Button (Kannada → /booking)</label>
                <input
                  type="text"
                  disabled={!isAdmin || saving}
                  value={form.heroSecondaryLabel.kn}
                  onChange={(e) => updateBilingual('heroSecondaryLabel', 'kn', e.target.value)}
                  className="w-full rounded-lg px-3 py-2 disabled:opacity-60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {isAdmin && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--admin-border)]">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="submit"
                disabled={saving || Boolean(uploadingKind)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl admin-btn-primary uppercase text-xs disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Saving...' : 'Save'}
              </button>

              <button
                type="button"
                disabled={!isDirty || saving || Boolean(uploadingKind)}
                onClick={handleDiscardChanges}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl admin-btn-outline disabled:opacity-45 text-xs cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Discard changes
              </button>
            </div>

            {isDirty && (
              <span className="text-[11px] text-[#78591C] font-medium">
                Save changes before opening Preview to see updates live on Home page.
              </span>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

