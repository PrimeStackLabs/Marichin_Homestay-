/**
 * Shared live-formatting and pricing helpers computed from live Admin Rooms & Packages.
 */

export const getRoomBalcony = (room) => {
  if (typeof room?.hasBalcony === 'boolean') return room.hasBalcony;
  const slugOrName = String(room?.slug || room?.name || '').toLowerCase();
  return !slugOrName.includes('single');
};

export const getRoomUnitsCount = (room) => {
  const units = Number(room?.totalUnits);
  if (Number.isFinite(units) && units > 0) return units;
  const slugOrName = String(room?.slug || room?.name || '').toLowerCase();
  return slugOrName.includes('single') ? 1 : 2;
};

export const getRoomTotalUnits = (roomsList = []) => {
  const active = (roomsList || []).filter((r) => r?.isActive !== false);
  const sum = active.reduce((acc, r) => acc + getRoomUnitsCount(r), 0);
  return sum > 0 ? sum : 5;
};

export const buildFullHomeBreakdown = (roomsList = [], isKn = false) => {
  const active = (roomsList || []).filter((r) => r?.isActive !== false);
  if (active.length === 0) {
    return isKn
      ? '2 ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿಗಳು + 2 ಸೂಟ್ ಕೊಠಡಿಗಳು + 1 ಸಿಂಗಲ್ ಕೊಠಡಿ'
      : '2 Standard Rooms + 2 Suite Rooms + 1 Single Room';
  }
  return active
    .map((r) => {
      const count = getRoomUnitsCount(r);
      const slug = String(r?.slug || r?.name || '').toLowerCase();
      if (isKn) {
        const knBase =
          r.nameKn ||
          (slug.includes('suite')
            ? 'ಸೂಟ್ ಕೊಠಡಿ'
            : slug.includes('single')
            ? 'ಸಿಂಗಲ್ ಕೊಠಡಿ'
            : 'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿ');
        return `${count} ${knBase}`;
      }
      const rawName = r.name || 'Room';
      const pluralName = count === 1 ? rawName : rawName.endsWith('s') ? rawName : `${rawName}s`;
      return `${count} ${pluralName}`;
    })
    .join(' + ');
};

export const getStandardRoomPrice = (roomsList = []) => {
  const list = Array.isArray(roomsList) ? roomsList : [];
  const std = list.find(
    (r) =>
      String(r?.slug || '').toLowerCase().includes('standard') ||
      String(r?.name || '').toLowerCase().includes('standard')
  );
  const rate = Number(std?.pricePerNight ?? std?.price ?? 8000);
  return Number.isFinite(rate) && rate > 0 ? rate : 8000;
};

export const getLowestRoomPrice = (roomsList = []) => {
  const rates = (roomsList || [])
    .map((r) => Number(r?.pricePerNight ?? r?.price ?? 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  return rates.length > 0 ? Math.min(...rates) : 6000;
};

export const getPackagePriceMeta = (
  pkg,
  {
    lowestRoomPrice = 6000,
    standardRoomPrice = 8000,
    entireHomestayPrice = 42000,
    isKn = false
  } = {}
) => {
  const slug = String(pkg?.slug || pkg?.id || pkg?.title || '').toLowerCase();
  const explicitPrice = Number(pkg?.price ?? pkg?.offerPrice ?? 0);
  const customDurationNote =
    pkg?.durationLabel || pkg?.duration || (isKn ? 'ಪ್ರತಿ ರಾತ್ರಿಗೆ' : 'per night');
  const validDiscount =
    pkg?.discount && typeof pkg.discount === 'string' && pkg.discount.trim()
      ? pkg.discount.trim()
      : null;

  if (Number.isFinite(explicitPrice) && explicitPrice > 0) {
    return {
      numericPrice: explicitPrice,
      amountText: `₹${explicitPrice.toLocaleString('en-IN')}`,
      isContact: false,
      note: customDurationNote,
      discount: validDiscount
    };
  }

  if (slug.includes('room-breakfast') && !slug.includes('dinner')) {
    const formatted = `₹${Number(lowestRoomPrice).toLocaleString('en-IN')}`;
    return {
      numericPrice: Number(lowestRoomPrice),
      amountText: isKn ? `ಪ್ರತಿ ರಾತ್ರಿಗೆ ${formatted} ರಿಂದ` : `From ${formatted} per night`,
      isContact: false,
      note: isKn ? 'ಕನಿಷ್ಠ ಕೊಠಡಿ ದರ' : (pkg?.durationLabel || 'Starting Room Tariff'),
      discount: validDiscount
    };
  }

  if (
    slug.includes('entire-homestay') ||
    slug.includes('all-5-rooms') ||
    slug.includes('all 5 rooms')
  ) {
    const formatted = `₹${Number(entireHomestayPrice).toLocaleString('en-IN')}`;
    return {
      numericPrice: Number(entireHomestayPrice),
      amountText: formatted,
      isContact: false,
      note: isKn ? 'ಎಲ್ಲಾ ಕೊಠಡಿಗಳಿಗೆ ಒಟ್ಟು ಮೊತ್ತ' : (pkg?.durationLabel || 'Total for all rooms'),
      discount: validDiscount
    };
  }

  if (slug.includes('family-stay')) {
    const formatted = `₹${Number(standardRoomPrice).toLocaleString('en-IN')}`;
    return {
      numericPrice: Number(standardRoomPrice),
      amountText: formatted,
      isContact: false,
      note: pkg?.durationLabel || (isKn ? 'ಪ್ರತಿ ರಾತ್ರಿಗೆ' : 'Per Night'),
      discount: validDiscount
    };
  }

  return {
    numericPrice: null,
    amountText: isKn ? 'ದರಗಳಿಗಾಗಿ ಸಂಪರ್ಕಿಸಿ' : 'Contact us for rates',
    isContact: true,
    note: isKn ? 'ನೇರ ವಿಚಾರಣೆ' : 'Direct Inquiry',
    discount: validDiscount
  };
};

