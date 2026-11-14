import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAdmin, resolveFullHomePrice } from '../../context/AdminContext';
import {
  getRoomBalcony,
  getRoomUnitsCount,
  getRoomTotalUnits,
  getStandardRoomPrice,
  getLowestRoomPrice,
  getPackagePriceMeta
} from '../../utils/homestayFormatting';
import {
  cleanInternationalPhone,
  resolveHostPhone,
  resolveHostEmail,
  DEFAULT_HOST_WHATSAPP_DIGITS
} from '../../utils/whatsappMessages';
import { MessageCircle, X, Send, Sparkles, Bot, User, CheckCircle2, Phone, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Chatbot = () => {
  const { t, language } = useLanguage();
  const { rooms, packages, diningMenu, siteSettings, inclusions } = useAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: t('chatbot.welcome'),
      time: 'Just now'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const hostDisplayPhone = resolveHostPhone(siteSettings?.whatsappNumber || siteSettings?.whatsapp || siteSettings?.phone);
  const hostWaDigits = cleanInternationalPhone(hostDisplayPhone) || DEFAULT_HOST_WHATSAPP_DIGITS;
  const hostDisplayEmail = resolveHostEmail(siteSettings?.email);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Intelligent estate concierge automated responses
  const generateBotReply = (userQuery) => {
    const q = userQuery.toLowerCase();

    // Inclusions and Exclusions Check
    if (
      q.includes('included') ||
      q.includes('include') ||
      q.includes('not included') ||
      q.includes('exclude') ||
      q.includes('what is included') ||
      q.includes('what is provided') ||
      q.includes('facilities') ||
      q.includes('ಅಡಕವಾಗಿದೆ') ||
      q.includes('ಒಳಗೊಂಡಿದೆ') ||
      q.includes('ಸೇರಿದೆ')
    ) {
      const activeInclusions = (inclusions && inclusions.length > 0)
        ? inclusions.filter((item) => item.isActive !== false)
        : [];
      const incList = activeInclusions.filter((i) => i.type === 'include');
      const excList = activeInclusions.filter((i) => i.type === 'exclude');

      const incTitles = incList.length > 0
        ? incList.map((i) => (typeof i.title === 'object' ? (i.title[language] || i.title.en) : i.title)).join(', ')
        : 'Wi-Fi, Homely food, Parking facility, Campfire, Indoor & outdoor games, Estate walk';

      const excTitles = excList.length > 0
        ? excList.map((i) => (typeof i.title === 'object' ? (i.title[language] || i.title.en) : i.title)).join(', ')
        : 'Meals beyond those included, Travel and transport to the homestay, Personal expenses, Guests beyond stated capacity';

      if (language === 'kn') {
        return `ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ನಿಮ್ಮ ವಾಸ್ತವ್ಯಕ್ಕೆ:\n\n✓ ಒಳಗೊಂಡಿರುವ ಸೌಲಭ್ಯಗಳು:\n${incTitles}\n\n✕ ಒಳಗೊಂಡಿಲ್ಲದ ವೆಚ್ಚಗಳು:\n${excTitles}\n\nಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ 'ಪ್ಯಾಕೇಜ್ಗಳು' ಪುಟವನ್ನು ವೀಕ್ಷಿಸಿ!`;
      }

      return `Here is what is included and not included in your reservation at Marichin Homestay:\n\n✓ Included in your stay:\n${incTitles}\n\n✕ Not included:\n${excTitles}\n\nYou can also explore the full interactive list on our Packages page!`;
    }

    if (q.includes('price') || q.includes('rate') || q.includes('cost') || q.includes('room') || q.includes('cottage') || q.includes('ದರ') || q.includes('ಕೊಠಡಿ')) {
      const activeRooms = (Array.isArray(rooms) && rooms.length > 0 ? rooms : []).filter((r) => r?.isActive !== false);
      if (activeRooms.length > 0) {
        const roomLines = activeRooms.map((r, idx) => {
          const units = getRoomUnitsCount(r);
          const adultsMax = Number(r.maxAdults) || 2;
          const childMax = r.maxChildren !== undefined ? Number(r.maxChildren) : 0;
          const balcony = getRoomBalcony(r);
          const weekday = Number(r.pricePerNight ?? r.price ?? 8000);
          const weekend = Number(r.weekendPrice ?? weekday);
          const rateText = weekend > 0 && weekend !== weekday
            ? `₹${weekday.toLocaleString('en-IN')} (${language === 'kn' ? 'ವಾರಾಂತ್ಯ' : 'wknd'} ₹${weekend.toLocaleString('en-IN')})`
            : `₹${weekday.toLocaleString('en-IN')}`;
          const meals = r.mealsIncluded || 'Morning breakfast';

          if (language === 'kn') {
            const slug = String(r.slug || r.name || '').toLowerCase();
            const rName = r.nameKn || (slug.includes('suite') ? 'ಸೂಟ್ ಕೊಠಡಿ' : slug.includes('single') ? 'ಸಿಂಗಲ್ ಕೊಠಡಿ' : r.name || 'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿ');
            const cap = childMax > 0
              ? `${adultsMax} ವಯಸ್ಕರು + ${childMax} ${childMax === 1 ? 'ಮಗು' : 'ಮಕ್ಕಳು'}`
              : `${adultsMax} ವಯಸ್ಕರು`;
            const balcText = balcony ? 'ಬಾಲ್ಕನಿ ವೀಕ್ಷಣೆ' : 'ಬಾಲ್ಕನಿ ಇಲ್ಲ';
            const uText = units === 1 ? '1 ಕೊಠಡಿ ಲಭ್ಯ' : `${units} ಕೊಠಡಿಗಳು ಲಭ್ಯ`;
            return `${idx + 1}. ${rName}: ${rateText} / ರಾತ್ರಿ (${uText}, ${cap}, ${balcText}, ${r.mealsIncludedKn || 'ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ'})`;
          }

          const cap = childMax > 0
            ? `${adultsMax} ${adultsMax === 1 ? 'adult' : 'adults'} + ${childMax} ${childMax === 1 ? 'child' : 'children'}`
            : `${adultsMax} ${adultsMax === 1 ? 'adult' : 'adults'}`;
          const balcText = balcony ? 'balcony facing' : 'without balcony';
          const uText = units === 1 ? '1 room available' : `${units} rooms available`;
          return `${idx + 1}. ${r.name}: ${rateText} / night (${uText}, ${cap}, ${balcText}, ${meals.toLowerCase()} included)`;
        });

        if (language === 'kn') {
          return `ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ${activeRooms.length} ವಿಧದ ಕೊಠಡಿಗಳು ಲಭ್ಯವಿವೆ:\n\n${roomLines.join('\n')}\n\nಎಲ್ಲಾ ಕೊಠಡಿಗಳಿಗೂ ಬೆಳಗಿನ ಉಪಹಾರ, ಹೈ-ಸ್ಪೀಡ್ ವೈ-ಫೈ, ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ, ಸಂಜೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್, ಆಟಗಳು ಮತ್ತು ಕಾಫಿ ತೋಟದ ನಡಿಗೆ ಒಳಗೊಂಡಿದೆ.`;
        }
        return `Marichin Homestay offers ${activeRooms.length} comfortable room types:\n\n${roomLines.join('\n')}\n\nAll room stays include wholesome morning breakfast, high-speed Wi-Fi, secure on-site parking, evening campfire, indoor & outdoor games, and a guided coffee estate walk.`;
      }
      if (language === 'kn') {
        return `ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ 3 ವಿಧದ ಕೊಠಡಿಗಳು ಲಭ್ಯವಿವೆ:\n\n1. ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಕೊಠಡಿ: ₹8,000 / ರಾತ್ರಿ (2 ಕೊಠಡಿಗಳು ಲಭ್ಯ, 2 ವಯಸ್ಕರು + 1 ಮಗು, ಬಾಲ್ಕನಿ ವೀಕ್ಷಣೆ, ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ)\n2. ಸೂಟ್ ಕೊಠಡಿ: ₹10,000 / ರಾತ್ರಿ (2 ಕೊಠಡಿಗಳು ಲಭ್ಯ, 2 ವಯಸ್ಕರು + 2 ಮಕ್ಕಳು, ಬಾಲ್ಕನಿ ವೀಕ್ಷಣೆ, ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ)\n3. ಸಿಂಗಲ್ ಕೊಠಡಿ: ₹6,000 / ರಾತ್ರಿ (1 ಕೊಠಡಿ ಲಭ್ಯ, 2 ವಯಸ್ಕರು, ಬಾಲ್ಕನಿ ಇಲ್ಲ, ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ)\n\nಎಲ್ಲಾ ಕೊಠಡಿಗಳಿಗೂ ಬೆಳಗಿನ ಉಪಹಾರ, ಹೈ-ಸ್ಪೀಡ್ ವೈ-ಫೈ, ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯ, ಸಂಜೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್, ಆಟಗಳು ಮತ್ತು ಕಾಫಿ ತೋಟದ ನಡಿಗೆ ಒಳಗೊಂಡಿದೆ.`;
      }
      return `Marichin Homestay offers three comfortable room types:\n\n1. Standard Room: ₹8,000 / night (2 rooms available, 2 adults + 1 child, balcony facing, morning breakfast included)\n2. Suite Room: ₹10,000 / night (2 rooms available, 2 adults + 2 children, balcony facing, morning breakfast included)\n3. Single Room: ₹6,000 / night (1 room available, 2 adults, without balcony, morning breakfast included)\n\nAll room stays include wholesome morning breakfast, high-speed Wi-Fi, secure on-site parking, evening campfire, indoor & outdoor games, and a guided coffee estate walk.`;
    }

    if (q.includes('package') || q.includes('stay plan') || q.includes('ಪ್ಯಾಕೇಜ್') || q.includes('ಯೋಜನೆ')) {
      const activePackages = (Array.isArray(packages) && packages.length > 0 ? packages : []).filter((p) => p?.isActive !== false);
      if (activePackages.length > 0) {
        const lowestRoomPrice = getLowestRoomPrice(rooms);
        const standardRoomPrice = getStandardRoomPrice(rooms);
        const entireHomestayPrice = resolveFullHomePrice(siteSettings, activePackages);
        const totalRooms = getRoomTotalUnits(rooms);
        const pkgLines = activePackages.map((pkg, idx) => {
          const isKn = language === 'kn';
          const priceMeta = getPackagePriceMeta(pkg, {
            lowestRoomPrice,
            standardRoomPrice,
            entireHomestayPrice,
            isKn
          });
          const pkgTitle = (isKn && pkg.titleKn) || pkg.title || pkg.name || 'Package';
          const pkgDesc = (isKn && pkg.descriptionKn) || pkg.description || '';
          const noteSuffix = pkg.durationLabel ? ` (${pkg.durationLabel}${pkgDesc ? ` - ${pkgDesc}` : ''})` : (pkgDesc ? ` (${pkgDesc})` : '');
          return `${idx + 1}. ${pkgTitle}: ${priceMeta.amountText}${noteSuffix}`;
        });
        if (language === 'kn') {
          return `ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ${activePackages.length} ವಿಶೇಷ ಪ್ಯಾಕೇಜ್‌ಗಳು (ಒಟ್ಟು ${totalRooms} ಕೊಠಡಿಗಳು) ಲಭ್ಯವಿವೆ:\n\n${pkgLines.join('\n')}\n\nಎಲ್ಲಾ ಪ್ಯಾಕೇಜ್‌ಗಳಲ್ಲೂ ಬೆಳಗಿನ ಉಪಹಾರ, ವೈ-ಫೈ, ಪಾರ್ಕಿಂಗ್, ಕ್ಯಾಂಪ್‌ಫೈರ್, ಆಟಗಳು ಮತ್ತು ಕಾಫಿ ತೋಟದ ನಡಿಗೆ ಒಳಗೊಂಡಿದೆ.`;
        }
        return `Marichin Homestay offers ${activePackages.length} curated packages (across ${totalRooms} total estate rooms):\n\n${pkgLines.join('\n')}\n\nAll packages include morning breakfast, Wi-Fi, secure on-site parking, evening campfire, games, and a guided coffee estate walk.`;
      }
      if (language === 'kn') {
        return `ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ 4 ವಿಶೇಷ ಪ್ಯಾಕೇಜ್‌ಗಳು ಲಭ್ಯವಿವೆ:\n\n1. ಕೊಠಡಿ + ಉಪಹಾರ: ₹6,000 (ಯಾವುದೇ ಕೊಠಡಿ, ಬೆಳಗಿನ ಉಪಹಾರ ಒಳಗೊಂಡಿದೆ)\n2. ಕೊಠಡಿ + ಉಪಹಾರ + ರಾತ್ರಿಯ ಊಟ: ₹8,000 (ರಾತ್ರಿಯ ಊಟದ ಆಯ್ಕೆ: ಸಸ್ಯಾಹಾರಿ ಅಥವಾ ಮಾಂಸಾಹಾರಿ)\n3. ಸಂಪೂರ್ಣ ಹೋಂಸ್ಟೇ (ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳು): ₹42,000 / ರಾತ್ರಿ (ಎಲ್ಲಾ 5 ಕೊಠಡಿಗಳ ಸಂಪೂರ್ಣ ಕಾಯ್ದಿರಿಸುವಿಕೆ, ಗರಿಷ್ಠ 10 ವಯಸ್ಕರು + 6 ಮಕ್ಕಳು)\n4. ಫ್ಯಾಮಿಲಿ ವಾಸ್ತವ್ಯ: ₹8,000 (ಉಪಹಾರದೊಂದಿಗೆ 1 ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಅಥವಾ ಸೂಟ್ ಕೊಠಡಿ)\n\nಎಲ್ಲಾ ಪ್ಯಾಕೇಜ್‌ಗಳಲ್ಲೂ ಬೆಳಗಿನ ಉಪಹಾರ, ವೈ-ಫೈ, ಪಾರ್ಕಿಂಗ್, ಕ್ಯಾಂಪ್‌ಫೈರ್, ಆಟಗಳು ಮತ್ತು ಕಾಫಿ ತೋಟದ ನಡಿಗೆ ಒಳಗೊಂಡಿದೆ.`;
      }
      return `Marichin Homestay offers four curated packages:\n\n1. Room + Breakfast: ₹6,000 per night (Choose any room. Morning breakfast included.)\n2. Room + Breakfast + Dinner: ₹8,000 per night (Dinner choice: veg or non-veg from the menu)\n3. Entire Homestay (all 5 rooms): ₹42,000 / night (Total for all rooms, exclusive reservation of all 5 rooms for up to 10 adults + 6 children)\n4. Family Stay: ₹8,000 per night (1 Standard or Suite room with breakfast)\n\nAll packages include morning breakfast, Wi-Fi, secure on-site parking, evening campfire, games, and a guided coffee estate walk.`;
    }

    if (q.includes('food') || q.includes('dining') || q.includes('veg') || q.includes('breakfast') || q.includes('dinner') || q.includes('menu') || q.includes('ಊಟ') || q.includes('ತಿಂಡಿ')) {
      if (language === 'kn') {
        return `ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ಬಡಿಸುವ ತಾಜಾ ಮನೆಯೂಟದ ಮೆನು:\n\n• ಬೆಳಗಿನ ಉಪಹಾರ:\n  1. ಪಾಪುಟ್ಟು ಮತ್ತು ಮೊಟ್ಟೆ ಸಾರು (ಮಾಂಸಾಹಾರಿ)\n  2. ಚಪಾತಿ ಮತ್ತು ಕಡಲೆ ಸಾರು (ಸಸ್ಯಾಹಾರಿ)\n  3. ಕದಂಬುಟ್ಟು ಮತ್ತು ರಾಜ್ಮಾ ಸಾರು (ಸಸ್ಯಾಹಾರಿ)\n  4. ಲೆಮನ್ ರೈಸ್ (ಸಸ್ಯಾಹಾರಿ)\n  5. ಪುಳಿಯೋಗರೆ (ಸಸ್ಯಾಹಾರಿ)\n  6. ಕಾಫಿ\n  7. ಚಹಾ\n• ರಾತ್ರಿಯ ಊಟ, ಸಸ್ಯಾಹಾರಿ:\n  1. ಚಪಾತಿ\n  2. ಅನ್ನ, ತರಕಾರಿ ಸಾರು, ರಸಂ, ಪಲ್ಯ, ಮೊಸರು ಮತ್ತು ಉಪ್ಪಿನಕಾಯಿ\n• ರಾತ್ರಿಯ ಊಟ, ಮಾಂಸಾಹಾರಿ:\n  1. ಚಪಾತಿ\n  2. ಅನ್ನ ಮತ್ತು ಚಿಕನ್ ಫ್ರೈ ಅಥವಾ ಚಿಕನ್ ಸಾರು\n  3. ಮೊಸರು ಮತ್ತು ತರಕಾರಿ ಸಾರು\n• ಸಂಜೆ:\n  1. ಕಾಫಿ\n  2. ಚಹಾ\n\nನಿಮ್ಮ ವಾಸ್ತವ್ಯದೊಂದಿಗೆ ಬೆಳಗಿನ ಉಪಹಾರ ಸೇರಿದೆ!`;
      }
      return `Marichin Homestay dining menu:\n\n• Morning Breakfast:\n  1. Paputtu with egg curry (non-veg)\n  2. Chapati with kadala curry (chickpea curry) (veg)\n  3. Kadambuttu with rajma curry (veg)\n  4. Lemon rice (veg)\n  5. Puliyogare (veg)\n  6. Coffee (veg)\n  7. Tea (veg)\n• Dinner, Veg:\n  1. Chapati\n  2. White rice with vegetable curry, rasam, veg palya, curd and pickle\n• Dinner, Non-Veg:\n  1. Chapati\n  2. White rice with chicken fry or chicken curry\n  3. Curd and vegetable curry\n• Evening:\n  1. Coffee\n  2. Tea\n\nMorning breakfast is included with your stay!`;
    }

    if (q.includes('reach') || q.includes('route') || q.includes('bangalore') || q.includes('bengaluru') || q.includes('mysore') || q.includes('mysuru') || q.includes('distance') || q.includes('ದಾರಿ')) {
      if (language === 'kn') {
        return `ನಾವು ಕುಶಾಲನಗರ ಸಮೀಪದ ಚಿಕ್ಕಬೆಟ್ಟಗೇರಿ ಗ್ರಾಮದಲ್ಲಿದ್ದೇವೆ (ಕೊಡಗು ಜಿಲ್ಲೆ):\n• ಹತ್ತಿರದ ಪಟ್ಟಣ: ಕುಶಾಲನಗರ\n• ಬೆಂಗಳೂರಿನಿಂದ: ~230 ಕಿ.ಮೀ\n• ಮೈಸೂರಿನಿಂದ: ~90 ಕಿ.ಮೀ\n• ಮಂಗಳೂರಿನಿಂದ: ~145 ಕಿ.ಮೀ\n• ಮಡಿಕೇರಿಯಿಂದ: ~30 ಕಿ.ಮೀ\nಉತ್ತಮ ರಸ್ತೆ ಸಂಪರ್ಕ ಮತ್ತು ವಾಹನಗಳಿಗೆ ಸುರಕ್ಷಿತ ಪಾರ್ಕಿಂಗ್ ಸೌಲಭ್ಯವಿದೆ.`;
      }
      return `We are located in Chikkabettageri Village, Gudde Hosur Post near Kushalnagar (Kodagu District, Karnataka):\n• Nearest Town: Kushalnagar\n• From Bengaluru: ~230 km\n• From Mysuru: ~90 km\n• From Mangaluru: ~145 km\n• From Madikeri: ~30 km\nPaved road access with secure on-site parking for all guest vehicles.`;
    }

    if (q.includes('walk') || q.includes('campfire') || q.includes('waterfall') || q.includes('experience') || q.includes('trek') || q.includes('activity') || q.includes('games')) {
      if (language === 'kn') {
        return `ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇನಲ್ಲಿ ತೋಟದ ಸುಂದರ ಅನುಭವಗಳನ್ನು ಆನಂದಿಸಿ:\n• ತೋಟದ ನಡಿಗೆ: ಕಾಫಿ ಮತ್ತು ಕರಿಮೆಣಸಿನ ತೋಟದಲ್ಲಿ ಮುಂಜಾನೆಯ ನಡಿಗೆ.\n• ಕ್ಯಾಂಪ್‌ಫೈರ್: ಸಂಜೆಯ ಬೆಚ್ಚನೆಯ ಕ್ಯಾಂಪ್‌ಫೈರ್ ಕೂಟ.\n• ಆಟಗಳು: ಕ್ಯಾರಮ್, ಚೆಸ್ ಮತ್ತು ಹೊರಾಂಗಣ ಆಟಗಳು.\n• ಮನೆ ಊಟ: ಪ್ರೀತಿಯಿಂದ ತಯಾರಿಸಿದ ತಾಜಾ ಮನೆ ಊಟ.`;
      }
      return `At Marichin Homestay, enjoy genuine on-site plantation experiences:\n• Estate Walk: Walk through the coffee estate surrounding the homestay.\n• Campfire: Evening campfire at the homestay.\n• Indoor & Outdoor Games: Indoor and outdoor games for guests of all ages.\n• Homely Food: Home-cooked meals prepared at the homestay.`;
    }

    if (q.includes('book') || q.includes('advance') || q.includes('payment') || q.includes('ಬುಕಿಂಗ್')) {
      if (language === 'kn') {
        return `ನೇರ ಬುಕಿಂಗ್ ಸರಳ ಮತ್ತು ಪಾರದರ್ಶಕವಾಗಿದೆ! ನಿಮ್ಮ ದಿನಾಂಕಗಳನ್ನು ಆರಿಸಿ, ನಿಮ್ಮ ಇಷ್ಟದ ಕೊಠಡಿಗಳನ್ನು (ಸ್ಟ್ಯಾಂಡರ್ಡ್, ಸೂಟ್ ಅಥವಾ ಸಿಂಗಲ್) ಆಯ್ಕೆಮಾಡಿ, ಮತ್ತು UPI ಮೂಲಕ ಮುಂಗಡ ಪಾವತಿ (20%, 50%, ಅಥವಾ 100%) ಆಯ್ಕೆಮಾಡಿ. ಲಭ್ಯತೆ ಪರಿಶೀಲಿಸಲು ಮೇಲಿನ 'ಬುಕ್ ನೌ' ಕ್ಲಿಕ್ ಮಾಡಿ!`;
      }
      return `Direct booking is simple and transparent! Choose your dates, pick your desired room types and quantities (Standard Room, Suite Room, or Single Room), and select your preferred advance payment option (20%, 50%, or 100%) via UPI. Click 'Book Now' above to check live dates!`;
    }

    if (q.includes('pet') || q.includes('dog') || q.includes('ನಾಯಿ')) {
      return `Please contact the host directly to enquire about pets prior to making your reservation.`;
    }

    if (q.includes('wifi') || q.includes('workation') || q.includes('internet')) {
      return `Yes, reliable Wi-Fi is provided throughout the homestay rooms and verandah for your convenience.`;
    }

    if (q.includes('contact') || q.includes('phone') || q.includes('whatsapp') || q.includes('call') || q.includes('number') || q.includes('email') || q.includes('mail') || q.includes('gmail') || q.includes('ಸಂಪರ್ಕ') || q.includes('ಇಮೇಲ್')) {
      if (language === 'kn') {
        return `ನಮ್ಮ ಹೋಸ್ಟ್ ಅನ್ನು ನೀವು ನೇರವಾಗಿ ಕರೆ / WhatsApp (${hostDisplayPhone}) ಅಥವಾ ಇಮೇಲ್ (${hostDisplayEmail}) ಮೂಲಕ ಸಂಪರ್ಕಿಸಬಹುದು.`;
      }
      return `You can contact our Marichin Homestay host directly via:\n• WhatsApp / Phone: ${hostDisplayPhone}\n• Email: ${hostDisplayEmail}`;
    }

    return language === 'kn'
      ? `ಸಂಪರ್ಕಿಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು! ಕುಶಾಲನಗರ, ಕೊಡಗಿನ ಮರಿಚಿನ್ ಹೋಂಸ್ಟೇಗೆ ಸ್ವಾಗತ. ಕೊಠಡಿ ಲಭ್ಯತೆ, ಆಹಾರ ಅಥವಾ ಬುಕಿಂಗ್ ಬಗ್ಗೆ ತಿಳಿಯಲು ಬಯಸುವಿರಾ? ನೀವು ನಮ್ಮ ಹೋಸ್ಟ್ ಅನ್ನು WhatsApp (${hostDisplayPhone}) ಅಥವಾ ಇಮೇಲ್ (${hostDisplayEmail}) ಮೂಲಕ ಸಂಪರ್ಕಿಸಬಹುದು!`
      : `Thank you for reaching out! Marichin Homestay is a peaceful coffee estate sanctuary in Kushalnagar, Kodagu. Would you like to check dates, enquire about meals, or reserve your stay? You can also reach our host via WhatsApp (${hostDisplayPhone}) or email (${hostDisplayEmail})!`;
  };

  const handleSend = (textToSend = inputMessage) => {
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponseText = generateBotReply(textToSend);
      const botMsg = {
        sender: 'bot',
        text: botResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  const quickQuestions = [
    "What is included in the stay?",
    "Homestay packages & pricing?",
    "Homely food menu details?",
    "How to reach from Bengaluru / Mysuru?",
    "Experiences & estate walk info?"
  ];

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right, vertically stacked directly above Social & WhatsApp) */}
      <div className="fixed bottom-[152px] right-5 sm:right-6 z-40 print:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-r from-[#C8A55A] to-[#B8964A] hover:from-[#D9BC7A] hover:to-[#C8A55A] text-[#0F2A20] flex items-center justify-center shadow-[0_8px_24px_rgba(184,150,74,0.35)] hover:scale-110 active:scale-95 transition-all duration-300 group border-2 border-[#0F2A20]"
          title="Chat with Marichin Homestay Virtual Concierge"
          aria-label="Open AI Concierge Chat"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-[#0F2A20]" />
          ) : (
            <>
              <Bot className="w-7 h-7 text-[#0F2A20]" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0F2A20] rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0F2A20] rounded-full" />
            </>
          )}

          {/* Tooltip Label (cleanly positioned to the left) */}
          <span className="hidden sm:group-hover:block absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-[#0F2A20] text-[#D9BC7A] text-xs px-3 py-1.5 rounded-lg border border-[#B8964A]/30 shadow-xl pointer-events-none">
            AI Estate Concierge
          </span>
        </button>
      </div>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 w-[92vw] sm:w-[400px] h-[550px] max-h-[85vh] bg-[#0F2A20]/95 border border-[#B8964A]/30 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-xl animate-slide-up print:hidden">
          
          {/* Header */}
          <div className="bg-[#1B4332] border-b border-[#B8964A]/25 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0F2A20] border border-[#B8964A]/30 flex items-center justify-center text-[#D9BC7A]">
                <Sparkles className="w-5 h-5 text-[#D9BC7A]" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-[#F3EDDD] flex items-center gap-1.5">
                  <span>{t('chatbot.title')}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </h3>
                <p className="text-[11px] text-[#D9BC7A] font-sans">{t('chatbot.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close AI Concierge Chat"
              className="p-1.5 text-[#B9C4B8] hover:text-[#D9BC7A] rounded-lg hover:bg-[#0F2A20] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-[#1B4332] border border-[#B8964A]/30 flex items-center justify-center flex-shrink-0 text-[#D9BC7A] mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-[#C8A55A] to-[#B8964A] text-[#0F2A20] font-medium rounded-tr-none'
                      : 'bg-[#1B4332] border border-[#B8964A]/20 text-[#F3EDDD] rounded-tl-none shadow-sm'
                  }`}
                >
                  {m.text}
                  <div
                    className={`text-[9px] mt-1 text-right ${
                      m.sender === 'user' ? 'text-[#0F2A20]/70' : 'text-[#B9C4B8]'
                    }`}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-[#D9BC7A] text-xs italic pl-9">
                <span className="w-1.5 h-1.5 bg-[#D9BC7A] rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-[#D9BC7A] rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-[#D9BC7A] rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px]">Concierge is composing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Query Pills */}
          <div className="px-3 py-2 bg-[#1B4332]/60 border-t border-[#1B4332] flex gap-1.5 overflow-x-auto scrollbar-none">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap bg-[#1B4332] hover:bg-[#B8964A]/20 border border-[#B8964A]/25 text-[#D9BC7A] text-[10px] px-2.5 py-1 rounded-full transition-colors flex-shrink-0 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-[#1B4332] border-t border-[#B8964A]/25">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={t('chatbot.placeholder')}
                className="flex-1 bg-[#0F2A20] border border-[#B8964A]/30 rounded-xl px-3.5 py-2 text-xs text-[#F3EDDD] placeholder-[#B9C4B8]/60 focus:outline-none focus:border-[#D9BC7A] transition-colors"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#C8A55A] to-[#B8964A] text-[#0F2A20] flex items-center justify-center hover:from-[#D9BC7A] hover:to-[#C8A55A] disabled:opacity-40 transition-colors shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between text-[10px] text-[#B9C4B8]">
              <Link to="/booking" onClick={() => setIsOpen(false)} className="text-[#D9BC7A] hover:underline flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Book Directly</span>
              </Link>
              <a
                href={`https://wa.me/${hostWaDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                <span>WhatsApp: {hostDisplayPhone}</span>
              </a>
            </div>
          </div>

        </div>
      )}
    </>
  );
};

