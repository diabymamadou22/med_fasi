/**
 * Collection of beautifully illustrated romantic vector stickers for couple messages
 * Categories: Cœur (Hearts), Bisou (Kisses), Câlin (Hugs), Tendresse & Complicité
 */

export interface RomanticSticker {
  id: string;
  name: string;
  category: 'coeur' | 'bisou' | 'calin' | 'mignon';
  label: string;
  svgDataUri: string;
}

// Generates SVG encoded as Data URI for instant loading without external network latency
function createSvgDataUri(svgContent: string): string {
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">${svgContent}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(fullSvg)}`;
}

export const ROMANTIC_STICKERS: RomanticSticker[] = [
  // ==================== CŒUR & AMOUR ====================
  {
    id: 'heart_sparkle',
    name: 'Cœur étincelant',
    category: 'coeur',
    label: 'Mon cœur brille pour toi',
    svgDataUri: createSvgDataUri(`
      <defs>
        <radialGradient id="h_spark_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff1f2"/>
          <stop offset="100%" stop-color="#ffe4e6"/>
        </radialGradient>
        <linearGradient id="h_spark_grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fb7185"/>
          <stop offset="50%" stop-color="#f43f5e"/>
          <stop offset="100%" stop-color="#e11d48"/>
        </linearGradient>
        <filter id="shadow1" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#f43f5e" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#h_spark_bg)"/>
      <path d="M60 92 C25 68 18 42 34 26 C44 16 55 22 60 30 C65 22 76 16 86 26 C102 42 95 68 60 92 Z" fill="url(#h_spark_grad)" filter="url(#shadow1)"/>
      <ellipse cx="44" cy="34" rx="6" ry="3" transform="rotate(-30 44 34)" fill="#ffffff" opacity="0.6"/>
      <polygon points="90,20 92,26 98,28 92,30 90,36 88,30 82,28 88,26" fill="#fbbf24"/>
      <polygon points="26,70 27,74 31,75 27,76 26,80 25,76 21,75 25,74" fill="#fbbf24"/>
      <polygon points="95,72 96,75 99,76 96,77 95,80 94,77 91,76 94,75" fill="#fbbf24"/>
    `),
  },
  {
    id: 'heart_duo_bound',
    name: 'Deux cœurs unis',
    category: 'coeur',
    label: 'Unis pour toujours',
    svgDataUri: createSvgDataUri(`
      <defs>
        <radialGradient id="h_duo_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff5f5"/>
          <stop offset="100%" stop-color="#fed7aa"/>
        </radialGradient>
        <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f43f5e"/>
          <stop offset="100%" stop-color="#be123c"/>
        </linearGradient>
        <linearGradient id="coralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fb923c"/>
          <stop offset="100%" stop-color="#ea580c"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#h_duo_bg)"/>
      <g transform="translate(16, 20) scale(0.65)">
        <path d="M60 90 C25 68 18 42 34 26 C44 16 55 22 60 30 C65 22 76 16 86 26 C102 42 95 68 60 90 Z" fill="url(#coralGrad)"/>
      </g>
      <g transform="translate(38, 28) scale(0.65)">
        <path d="M60 90 C25 68 18 42 34 26 C44 16 55 22 60 30 C65 22 76 16 86 26 C102 42 95 68 60 90 Z" fill="url(#roseGrad)"/>
        <ellipse cx="44" cy="34" rx="6" ry="3" transform="rotate(-30 44 34)" fill="#ffffff" opacity="0.6"/>
      </g>
      <path d="M 45 42 Q 60 25 75 42" stroke="#f59e0b" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="60" cy="30" r="3" fill="#f59e0b"/>
    `),
  },
  {
    id: 'heart_arrow',
    name: 'Cœur fléché de Cupidon',
    category: 'coeur',
    label: 'Coup de foudre',
    svgDataUri: createSvgDataUri(`
      <defs>
        <radialGradient id="h_arr_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fdf2f8"/>
          <stop offset="100%" stop-color="#fce7f3"/>
        </radialGradient>
        <linearGradient id="cupidHeart" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ec4899"/>
          <stop offset="100%" stop-color="#be185d"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#h_arr_bg)"/>
      <path d="M60 88 C30 68 22 46 36 32 C45 22 55 28 60 35 C65 28 75 22 84 32 C98 46 90 68 60 88 Z" fill="url(#cupidHeart)"/>
      <ellipse cx="46" cy="38" rx="6" ry="3" transform="rotate(-30 46 38)" fill="#ffffff" opacity="0.5"/>
      <!-- Arrow -->
      <line x1="18" y1="84" x2="100" y2="28" stroke="#d97706" stroke-width="3.5" stroke-linecap="round"/>
      <polygon points="104,25 96,24 99,32" fill="#d97706"/>
      <polygon points="18,84 24,80 20,76" fill="#f59e0b"/>
      <polygon points="18,84 26,88 22,92" fill="#f59e0b"/>
    `),
  },
  {
    id: 'heart_gift',
    name: 'Cœur boîte cadeau',
    category: 'coeur',
    label: 'Mon amour en cadeau',
    svgDataUri: createSvgDataUri(`
      <defs>
        <radialGradient id="h_gift_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff7ed"/>
          <stop offset="100%" stop-color="#ffedd5"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#h_gift_bg)"/>
      <!-- Heart Base -->
      <path d="M60 90 C25 68 18 42 34 26 C44 16 55 22 60 30 C65 22 76 16 86 26 C102 42 95 68 60 90 Z" fill="#e11d48"/>
      <!-- Gold Ribbon -->
      <path d="M60 28 L60 90" stroke="#fcd34d" stroke-width="6" stroke-linecap="round"/>
      <path d="M26 50 Q60 56 94 50" stroke="#fcd34d" stroke-width="6" stroke-linecap="round" fill="none"/>
      <!-- Bow -->
      <circle cx="60" cy="38" r="4.5" fill="#f59e0b"/>
      <path d="M60 38 Q50 24 45 32 Q45 42 60 38" fill="#f59e0b"/>
      <path d="M60 38 Q70 24 75 32 Q75 42 60 38" fill="#f59e0b"/>
    `),
  },

  // ==================== BISOU (KISSES) ====================
  {
    id: 'kiss_lips',
    name: 'Bouche de bisou rouge',
    category: 'bisou',
    label: 'Gros bisou passionné',
    svgDataUri: createSvgDataUri(`
      <defs>
        <radialGradient id="k_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff1f2"/>
          <stop offset="100%" stop-color="#fecdd3"/>
        </radialGradient>
        <linearGradient id="lipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f43f5e"/>
          <stop offset="100%" stop-color="#9f1239"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#k_bg)"/>
      <!-- Upper Lip -->
      <path d="M22 62 C32 45 46 45 60 52 C74 45 88 45 98 62 C86 67 74 65 60 67 C46 65 34 67 22 62 Z" fill="url(#lipGrad)"/>
      <!-- Lower Lip -->
      <path d="M24 64 C36 82 84 82 96 64 C80 72 40 72 24 64 Z" fill="url(#lipGrad)"/>
      <!-- Highlights -->
      <ellipse cx="60" cy="74" rx="8" ry="2.5" fill="#ffffff" opacity="0.4"/>
      <!-- Tiny floating hearts -->
      <path d="M88 32 C82 24 76 28 80 34 L88 42 L96 34 C100 28 94 24 88 32 Z" fill="#e11d48"/>
      <path d="M26 40 C22 34 18 36 20 40 L26 46 L32 40 C34 36 30 34 26 40 Z" fill="#e11d48"/>
    `),
  },
  {
    id: 'kiss_flying_hearts',
    name: 'Bisou volant plein de tendresse',
    category: 'bisou',
    label: 'Un million de bisous',
    svgDataUri: createSvgDataUri(`
      <defs>
        <radialGradient id="k_fly_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fdf4ff"/>
          <stop offset="100%" stop-color="#fae8ff"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#k_fly_bg)"/>
      <!-- Sweet face with closed eyes & kissing mouth -->
      <circle cx="48" cy="66" r="32" fill="#fed7aa"/>
      <!-- Happy Eye -->
      <path d="M34 60 Q40 54 46 60" stroke="#78350f" stroke-width="3" stroke-linecap="round" fill="none"/>
      <!-- Blush -->
      <ellipse cx="36" cy="70" rx="6" ry="3.5" fill="#f43f5e" opacity="0.5"/>
      <!-- Kissing lips sticking out -->
      <path d="M68 64 Q74 61 74 66 Q74 71 68 68 Z" fill="#e11d48"/>
      <!-- Flying Hearts Stream -->
      <g transform="translate(74, 38) scale(0.35)">
        <path d="M60 90 C25 68 18 42 34 26 C44 16 55 22 60 30 C65 22 76 16 86 26 C102 42 95 68 60 90 Z" fill="#e11d48"/>
      </g>
      <g transform="translate(86, 22) scale(0.25)">
        <path d="M60 90 C25 68 18 42 34 26 C44 16 55 22 60 30 C65 22 76 16 86 26 C102 42 95 68 60 90 Z" fill="#f43f5e"/>
      </g>
      <g transform="translate(68, 16) scale(0.2)">
        <path d="M60 90 C25 68 18 42 34 26 C44 16 55 22 60 30 C65 22 76 16 86 26 C102 42 95 68 60 90 Z" fill="#fb7185"/>
      </g>
    `),
  },
  {
    id: 'kiss_forehead',
    name: 'Bisou sur le front',
    category: 'bisou',
    label: 'Doux baiser apaisant',
    svgDataUri: createSvgDataUri(`
      <defs>
        <radialGradient id="k_fh_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="100%" stop-color="#fef3c7"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#k_fh_bg)"/>
      <!-- Left head kissing right forehead -->
      <circle cx="44" cy="54" r="24" fill="#fed7aa"/>
      <circle cx="76" cy="64" r="22" fill="#ffedd5"/>
      <!-- Closed smiling eyes -->
      <path d="M34 52 Q38 46 42 52" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M72 64 Q76 58 80 64" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <!-- Blushes -->
      <ellipse cx="36" cy="60" rx="4" ry="2.5" fill="#f43f5e" opacity="0.4"/>
      <ellipse cx="80" cy="70" rx="4" ry="2.5" fill="#f43f5e" opacity="0.4"/>
      <!-- Gentle Kiss Mouth -->
      <path d="M58 54 Q64 56 62 60" stroke="#e11d48" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <!-- Halo of warmth -->
      <circle cx="60" cy="30" r="6" fill="#f59e0b" opacity="0.3"/>
      <path d="M60 22 C56 16 50 18 52 24 L60 30 L68 24 C70 18 64 16 60 22 Z" fill="#e11d48"/>
    `),
  },

  // ==================== CÂLIN (HUGS) ====================
  {
    id: 'hug_warm_embrace',
    name: 'Gros câlin réconfortant',
    category: 'calin',
    label: 'Câlin tout chaud dans mes bras',
    svgDataUri: createSvgDataUri(`
      <defs>
        <radialGradient id="hug_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#f0fdf4"/>
          <stop offset="100%" stop-color="#dcfce7"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#hug_bg)"/>
      <!-- Bear 1 (Brown/Warm) -->
      <circle cx="46" cy="60" r="26" fill="#b45309"/>
      <circle cx="30" cy="38" r="9" fill="#b45309"/>
      <circle cx="30" cy="38" r="5" fill="#fde68a"/>
      <!-- Bear 2 (White/Cream) -->
      <circle cx="74" cy="60" r="26" fill="#fef08a"/>
      <circle cx="90" cy="38" r="9" fill="#fef08a"/>
      <circle cx="90" cy="38" r="5" fill="#fef9c3"/>
      <!-- Arm of Bear 1 hugging Bear 2 -->
      <path d="M38 68 C45 68 64 68 76 64 C80 62 82 58 78 56 C74 54 70 56 64 58 C54 60 40 60 36 62 Z" fill="#92400e"/>
      <!-- Closed happy eyes -->
      <path d="M40 56 Q44 52 48 56" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M72 56 Q76 52 80 56" stroke="#854d0e" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <!-- Soft blush -->
      <ellipse cx="38" cy="62" rx="4" ry="2.5" fill="#f43f5e" opacity="0.6"/>
      <ellipse cx="80" cy="62" rx="4" ry="2.5" fill="#f43f5e" opacity="0.6"/>
      <!-- Floating heart over hug -->
      <path d="M60 26 C55 18 48 20 52 27 L60 35 L68 27 C72 20 65 18 60 26 Z" fill="#f43f5e"/>
    `),
  },
  {
    id: 'hug_nestle',
    name: 'Blotti contre toi',
    category: 'calin',
    label: 'Mon refuge préféré',
    svgDataUri: createSvgDataUri(`
      <defs>
        <radialGradient id="hug_nest_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff1f2"/>
          <stop offset="100%" stop-color="#ffe4e6"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#hug_nest_bg)"/>
      <!-- Cozy Blanket/Body Base -->
      <path d="M20 90 Q60 68 100 90 Z" fill="#f43f5e"/>
      <!-- Left head leaning on chest -->
      <circle cx="48" cy="56" r="22" fill="#fed7aa"/>
      <circle cx="72" cy="50" r="22" fill="#fdba74"/>
      <!-- Peaceful sleeping eyes -->
      <path d="M42 56 Q46 60 50 56" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <path d="M68 50 Q72 54 76 50" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <!-- Zzz floating -->
      <text x="78" y="32" font-family="sans-serif" font-weight="bold" font-size="14" fill="#fb7185">z</text>
      <text x="86" y="24" font-family="sans-serif" font-weight="bold" font-size="11" fill="#f43f5e">z</text>
      <!-- Tiny heart -->
      <path d="M34 36 C31 30 26 31 28 36 L34 42 L40 36 C42 31 37 30 34 36 Z" fill="#e11d48"/>
    `),
  },
  {
    id: 'hug_tight',
    name: 'Je te serre fort',
    category: 'calin',
    label: 'Câlin serré de tout mon être',
    svgDataUri: createSvgDataUri(`
      <defs>
        <radialGradient id="hug_tight_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fdf4ff"/>
          <stop offset="100%" stop-color="#fae8ff"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#hug_tight_bg)"/>
      <!-- Big round cute cuddle -->
      <circle cx="60" cy="64" r="32" fill="#fb7185"/>
      <!-- Two pairs of arms wrapped -->
      <path d="M30 64 Q60 84 90 64" stroke="#ffffff" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M34 56 Q60 40 86 56" stroke="#be123c" stroke-width="5" stroke-linecap="round" fill="none"/>
      <!-- Big joyful squeeze eyes -->
      <path d="M48 54 L54 58 L48 62" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M72 54 L66 58 L72 62" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <!-- Smiles -->
      <path d="M55 64 Q60 68 65 64" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" fill="none"/>
      <!-- Hearts Bursting -->
      <polygon points="60,18 64,24 72,24 66,29 68,36 60,32 52,36 54,29 48,24 56,24" fill="#fbbf24"/>
    `),
  },

  // ==================== MIGNON & TENDRESSE ====================
  {
    id: 'cute_love_cat',
    name: 'Chaton amoureux',
    category: 'mignon',
    label: 'Miaou d\'amour',
    svgDataUri: createSvgDataUri(`
      <defs>
        <radialGradient id="cat_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff7ed"/>
          <stop offset="100%" stop-color="#fed7aa"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#cat_bg)"/>
      <!-- Cat Head -->
      <circle cx="60" cy="64" r="28" fill="#ffffff"/>
      <!-- Ears -->
      <polygon points="40,46 32,24 50,38" fill="#ffffff"/>
      <polygon points="40,44 35,28 47,38" fill="#fda4af"/>
      <polygon points="80,46 88,24 70,38" fill="#ffffff"/>
      <polygon points="80,44 85,28 73,38" fill="#fda4af"/>
      <!-- Heart Eyes -->
      <path d="M48 58 C45 54 41 55 43 59 L48 64 L53 59 C55 55 51 54 48 58 Z" fill="#e11d48"/>
      <path d="M72 58 C69 54 65 55 67 59 L72 64 L77 59 C79 55 75 54 72 58 Z" fill="#e11d48"/>
      <!-- Nose & Mouth -->
      <polygon points="60,68 58,66 62,66" fill="#f43f5e"/>
      <path d="M57 68 Q54 72 50 70 M63 68 Q66 72 70 70" stroke="#78350f" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Whiskers -->
      <line x1="34" y1="64" x2="22" y2="62" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
      <line x1="34" y1="68" x2="22" y2="70" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
      <line x1="86" y1="64" x2="98" y2="62" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
      <line x1="86" y1="68" x2="98" y2="70" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
    `),
  },
  {
    id: 'cute_love_letter',
    name: 'Lettre d\'amour avec cœur',
    category: 'mignon',
    label: 'Un mot doux pour ton cœur',
    svgDataUri: createSvgDataUri(`
      <defs>
        <radialGradient id="let_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff1f2"/>
          <stop offset="100%" stop-color="#ffe4e6"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#let_bg)"/>
      <!-- Envelope base -->
      <rect x="25" y="40" width="70" height="48" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
      <path d="M25 40 L60 66 L95 40" stroke="#cbd5e1" stroke-width="2" fill="none"/>
      <path d="M25 88 L52 62" stroke="#cbd5e1" stroke-width="1.5"/>
      <path d="M95 88 L68 62" stroke="#cbd5e1" stroke-width="1.5"/>
      <!-- Big Red Wax Heart Seal -->
      <g transform="translate(48, 54) scale(0.4)">
        <path d="M60 90 C25 68 18 42 34 26 C44 16 55 22 60 30 C65 22 76 16 86 26 C102 42 95 68 60 90 Z" fill="#e11d48"/>
      </g>
      <!-- Sparkles -->
      <polygon points="34,26 35,30 39,31 35,32 34,36 33,32 29,31 33,30" fill="#f59e0b"/>
      <polygon points="86,28 87,31 90,32 87,33 86,36 85,33 82,32 85,31" fill="#f59e0b"/>
    `),
  },
  {
    id: 'cute_cupid_teddy',
    name: 'Nounours avec cœur',
    category: 'mignon',
    label: 'Plein de douceur',
    svgDataUri: createSvgDataUri(`
      <defs>
        <radialGradient id="ted_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fdf2f8"/>
          <stop offset="100%" stop-color="#fce7f3"/>
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#ted_bg)"/>
      <!-- Ears -->
      <circle cx="36" cy="38" r="10" fill="#d97706"/>
      <circle cx="36" cy="38" r="6" fill="#fed7aa"/>
      <circle cx="84" cy="38" r="10" fill="#d97706"/>
      <circle cx="84" cy="38" r="6" fill="#fed7aa"/>
      <!-- Head -->
      <circle cx="60" cy="54" r="26" fill="#d97706"/>
      <!-- Snout -->
      <ellipse cx="60" cy="60" rx="11" ry="8" fill="#fed7aa"/>
      <circle cx="60" cy="56" r="3" fill="#78350f"/>
      <path d="M60 59 L60 64 M57 63 Q60 66 63 63" stroke="#78350f" stroke-width="2" stroke-linecap="round" fill="none"/>
      <!-- Eyes -->
      <circle cx="48" cy="50" r="3" fill="#451a03"/>
      <circle cx="49" cy="49" r="1" fill="#ffffff"/>
      <circle cx="72" cy="50" r="3" fill="#451a03"/>
      <circle cx="73" cy="49" r="1" fill="#ffffff"/>
      <!-- Big Heart Held in Paws -->
      <path d="M60 92 C40 76 34 60 45 48 C52 40 60 45 60 50 C60 45 68 40 75 48 C86 60 80 76 60 92 Z" fill="#ef4444"/>
      <circle cx="42" cy="68" r="6" fill="#b45309"/>
      <circle cx="78" cy="68" r="6" fill="#b45309"/>
    `),
  },
  {
    id: 'cute_infinity_love',
    name: 'Infini d\'amour',
    category: 'coeur',
    label: 'Je t\'aime à l\'infini',
    svgDataUri: createSvgDataUri(`
      <defs>
        <radialGradient id="inf_bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff1f2"/>
          <stop offset="100%" stop-color="#ffe4e6"/>
        </radialGradient>
        <linearGradient id="inf_grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f43f5e"/>
          <stop offset="50%" stop-color="#ec4899"/>
          <stop offset="100%" stop-color="#a855f7"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="54" fill="url(#inf_bg)"/>
      <!-- Infinity Symbol -->
      <path d="M38 46 C24 46 20 60 28 68 C36 76 52 50 60 58 C68 66 84 40 92 48 C100 56 96 70 82 70 C68 70 56 50 48 58 C44 62 42 66 38 66 C30 66 28 58 34 52 C38 48 42 50 44 54" stroke="url(#inf_grad)" stroke-width="7" stroke-linecap="round" fill="none"/>
      <!-- Heart on top -->
      <path d="M60 30 C56 22 48 24 52 32 L60 40 L68 32 C72 24 64 22 60 30 Z" fill="#f43f5e"/>
    `),
  },
];
