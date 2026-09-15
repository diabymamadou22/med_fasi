import { WeeklyLearningChallenge } from '../types';

export const INITIAL_WEEKLY_LEARNING_CHALLENGES: WeeklyLearningChallenge[] = [
  {
    id: 'week-chal-1',
    weekKey: '2026-W38',
    weekNumber: 38,
    title: "L'art de chérir au quotidien",
    category: 'word',
    targetEnglish: 'cherish',
    targetFrench: 'Chérir / prendre grand soin de tout cœur',
    phonetic: '[ TCHÈR-ich ]',
    grammarRule: 'Sujet + cherish + personne ou souvenir (au présent : I cherish you / I cherish our time together)',
    description:
      "Ce mot est l'un des plus profonds et poétiques de la langue anglaise. Il ne signifie pas seulement aimer, mais protéger avec tendresse et considérer l'autre comme un trésor inestimable.",
    tips: "Glissez 'cherish' dans un message pour rappeler à votre moitié combien vos instants partagés sont sacrés à vos yeux.",
    detectionKeywords: ['cherish', 'cherishing', 'cherished', 'cherishes'],
    exampleSentences: [
      {
        english: 'I cherish every second we spend together.',
        french: 'Je chéris chaque seconde que nous passons ensemble.',
      },
      {
        english: 'I cherish the way you laugh at my silly jokes.',
        french: 'Je chéris la manière dont tu ris à mes blagues un peu bêtes.',
      },
      {
        english: 'Always remember how much I cherish our love.',
        french: 'Rappelle-toi toujours à quel point je chéris notre amour.',
      },
    ],
    pointsReward: 50,
    duoBonusPoints: 100,
    partner1Completed: false,
    partner2Completed: false,
    bothCompleted: false,
    isActive: true,
  },
  {
    id: 'week-chal-2',
    weekKey: '2026-W39',
    weekNumber: 39,
    title: "La spontanéité de l'amour",
    category: 'grammar',
    targetEnglish: "can't help but [verb-ing]",
    targetFrench: "Ne pas pouvoir s'empêcher de...",
    phonetic: '[ kant hèlpe beutt ]',
    grammarRule: "Sujet + can't help but + verbe en -ing (ex: I can't help but smiling... ou I can't help thinking of you)",
    description:
      "Cette structure grammaticale exprime une impulsion irrésistible dictée par le cœur : une pensée ou une émotion si forte qu'on ne peut la retenir.",
    tips: "Parfait quand vous recevez un selfie ou un message mignon au milieu d'une journée de travail.",
    detectionKeywords: ["can't help", 'cannot help', "cant help"],
    exampleSentences: [
      {
        english: "I can't help but smile whenever I see your name pop up.",
        french: "Je ne peux pas m'empêcher de sourire dès que je vois ton nom s'afficher.",
      },
      {
        english: "I can't help falling a little more in love with you each day.",
        french: "Je ne peux pas m'empêcher de tomber un peu plus amoureux(se) de toi chaque jour.",
      },
      {
        english: "I can't help missing you right now.",
        french: "Je ne peux pas m'empêcher d'avoir envie de toi là maintenant.",
      },
    ],
    pointsReward: 50,
    duoBonusPoints: 100,
    partner1Completed: false,
    partner2Completed: false,
    bothCompleted: false,
    isActive: false,
  },
  {
    id: 'week-chal-3',
    weekKey: '2026-W40',
    weekNumber: 40,
    title: 'Mon monde entier',
    category: 'expression',
    targetEnglish: 'mean the world to',
    targetFrench: 'Représenter le monde entier pour quelqu’un',
    phonetic: '[ miinn zeu weurld tou ]',
    grammarRule: 'Sujet + mean(s) the world to + pronom / nom (ex: You mean the world to me)',
    description:
      "L'équivalent anglophone de 'tu es tout pour moi'. C'est une déclaration d'une tendresse absolue qui touche en plein cœur.",
    tips: "À envoyer le soir avant de dormir pour envelopper votre partenaire d'une douce certitude.",
    detectionKeywords: ['mean the world to', 'means the world to', 'meant the world to'],
    exampleSentences: [
      {
        english: 'You mean the world to me, my darling.',
        french: 'Tu représentes le monde entier pour moi, mon amour.',
      },
      {
        english: 'Your hugs mean the world to me after a tiring day.',
        french: 'Tes câlins représentent tout pour moi après une journée fatigante.',
      },
      {
        english: 'Having you by my side means the world to me.',
        french: "T'avoir à mes côtés représente tout pour moi.",
      },
    ],
    pointsReward: 50,
    duoBonusPoints: 100,
    partner1Completed: false,
    partner2Completed: false,
    bothCompleted: false,
    isActive: false,
  },
  {
    id: 'week-chal-4',
    weekKey: '2026-W41',
    weekNumber: 41,
    title: 'Hâte de te retrouver',
    category: 'grammar',
    targetEnglish: 'looking forward to [verb-ing]',
    targetFrench: 'Avoir tellement hâte de / trépigner de plaisir à l’idée de...',
    phonetic: '[ lou-king for-ouarde tou ]',
    grammarRule: 'Sujet + be + looking forward to + verbe en -ing (ou nom) : attention, toujours un -ING après "to" !',
    description:
      "Une structure indispensable en anglais ! En français, 'to' appelle un infinitif, mais ici c'est une préposition : on dit obligatoirement 'looking forward to seeing you' et non 'to see'.",
    tips: "Utilisez-le le matin ou l'après-midi pour exprimer votre impatience de vos retrouvailles du soir ou du week-end.",
    detectionKeywords: ['looking forward to', 'look forward to', 'looking forward'],
    exampleSentences: [
      {
        english: 'I am looking forward to holding you in my arms tonight.',
        french: 'J’ai tellement hâte de te serrer dans mes bras ce soir.',
      },
      {
        english: 'I’m looking forward to our romantic dinner this weekend.',
        french: 'J’ai tellement hâte de notre dîner romantique ce week-end.',
      },
      {
        english: 'Looking forward to hearing your sweet voice.',
        french: 'Hâte d’entendre ta douce voix.',
      },
    ],
    pointsReward: 50,
    duoBonusPoints: 100,
    partner1Completed: false,
    partner2Completed: false,
    bothCompleted: false,
    isActive: false,
  },
  {
    id: 'week-chal-5',
    weekKey: '2026-W42',
    weekNumber: 42,
    title: 'La gratitude amoureuse',
    category: 'word',
    targetEnglish: 'grateful for',
    targetFrench: 'Reconnaissant(e) d’avoir...',
    phonetic: '[ GREÏT-feul for ]',
    grammarRule: 'Sujet + be + grateful for + quelqu’un / une chose / having you in my life',
    description:
      "Exprimer sa gratitude mutuelle est l'un des secrets des couples les plus épanouis. Ce mot renforce le sentiment de sécurité et d'estime dans la relation.",
    tips: "Mentionnez une attention précise que votre partenaire a eue pour vous récemment.",
    detectionKeywords: ['grateful for', 'so grateful for', 'truly grateful for'],
    exampleSentences: [
      {
        english: 'I am so grateful for having you in my life.',
        french: 'Je suis tellement reconnaissant(e) de t’avoir dans ma vie.',
      },
      {
        english: 'I’m grateful for your patience and your kindness.',
        french: 'Je suis reconnaissant(e) pour ta patience et ta gentillesse.',
      },
      {
        english: 'Every single day, I am grateful for our love.',
        french: 'Chaque jour, je suis reconnaissant(e) pour notre amour.',
      },
    ],
    pointsReward: 50,
    duoBonusPoints: 100,
    partner1Completed: false,
    partner2Completed: false,
    bothCompleted: false,
    isActive: false,
  },
  {
    id: 'week-chal-6',
    weekKey: '2026-W43',
    weekNumber: 43,
    title: 'Le conditionnel romantique',
    category: 'grammar',
    targetEnglish: 'If I could..., I would...',
    targetFrench: 'Si je pouvais..., je...',
    phonetic: '[ if aïe coud... aïe ououd ]',
    grammarRule: 'If + Sujet + could + verbe, Sujet + would + verbe (condition irréelle ou désir imaginaire)',
    description:
      "Le conditionnel 2 permet d'exprimer des souhaits tendres, des projections magiques et des fantasmes romantiques lorsque la distance ou le temps vous sépare.",
    tips: "Imaginez ce que vous feriez immédiatement si vous pouviez vous téléporter auprès de votre amour.",
    detectionKeywords: ['if i could', 'i would', 'if we could'],
    exampleSentences: [
      {
        english: 'If I could kiss you right now, I would never stop.',
        french: 'Si je pouvais t’embrasser là maintenant, je ne m’arrêterais plus.',
      },
      {
        english: 'If I could freeze time, I would stay in your arms forever.',
        french: 'Si je pouvais figer le temps, je resterais dans tes bras pour toujours.',
      },
      {
        english: 'If I could give you one thing, it would be the ability to see yourself through my eyes.',
        french: 'Si je pouvais t’offrir une chose, ce serait de te voir à travers mes yeux.',
      },
    ],
    pointsReward: 50,
    duoBonusPoints: 100,
    partner1Completed: false,
    partner2Completed: false,
    bothCompleted: false,
    isActive: false,
  },
  {
    id: 'week-chal-7',
    weekKey: '2026-W44',
    weekNumber: 44,
    title: 'Le mot câlin : Cuddle',
    category: 'word',
    targetEnglish: 'cuddle',
    targetFrench: 'Se faire un gros câlin / se blottir tendrement',
    phonetic: '[ KEUD-eul ]',
    grammarRule: 'Verbe ou nom : to cuddle with someone / we need a cuddle',
    description:
      "Le mot anglais pour les câlins douillets au lit ou sous le plaid. Plus intime et chaleureux qu'un simple 'hug' (accolade).",
    tips: "Proposez une séance de câlins sans modération pour ce soir.",
    detectionKeywords: ['cuddle', 'cuddling', 'cuddled', 'cuddles', 'snuggle', 'snuggling'],
    exampleSentences: [
      {
        english: 'Can we just cuddle under the blanket all evening?',
        french: 'On peut juste se blottir sous la couverture toute la soirée ?',
      },
      {
        english: 'I need a big warm cuddle from you right now.',
        french: 'J’ai besoin d’un gros câlin tout chaud de ta part tout de suite.',
      },
      {
        english: 'Cuddling with you is my absolute favorite hobby.',
        french: 'Me blottir contre toi est mon activité préférée au monde.',
      },
    ],
    pointsReward: 50,
    duoBonusPoints: 100,
    partner1Completed: false,
    partner2Completed: false,
    bothCompleted: false,
    isActive: false,
  },
  {
    id: 'week-chal-8',
    weekKey: '2026-W45',
    weekNumber: 45,
    title: 'Plus je te connais, plus je t’aime',
    category: 'grammar',
    targetEnglish: 'The more..., the more...',
    targetFrench: 'Plus..., plus... (comparative parallèle)',
    phonetic: '[ zeu mor... zeu mor ]',
    grammarRule: 'The more + phrase 1, the more + phrase 2 (ex: The more I see you, the more I miss you)',
    description:
      "Cette élégante figure de style anglaise lie deux émotions en symbiose parfaite. C'est l'une des constructions les plus poétiques pour chanter la progression de votre amour.",
    tips: "Montrez comment votre complicité s'amplifie au fil des jours.",
    detectionKeywords: ['the more', 'the more i', 'the more we'],
    exampleSentences: [
      {
        english: 'The more time I spend with you, the more in love I fall.',
        french: 'Plus je passe de temps avec toi, plus je tombe amoureux(se).',
      },
      {
        english: 'The more I know you, the more precious you become to me.',
        french: 'Plus je te découvre, plus tu deviens précieux(se) à mes yeux.',
      },
      {
        english: 'The more you smile, the brighter my day becomes.',
        french: 'Plus tu souris, plus ma journée s’illumine.',
      },
    ],
    pointsReward: 50,
    duoBonusPoints: 100,
    partner1Completed: false,
    partner2Completed: false,
    bothCompleted: false,
    isActive: false,
  },
  {
    id: 'week-chal-9',
    weekKey: '2026-W46',
    weekNumber: 46,
    title: 'Ce souvenir qui me parle de toi',
    category: 'expression',
    targetEnglish: 'remind me of',
    targetFrench: 'Me faire penser à / me rappeler...',
    phonetic: '[ ri-MAÏNDE mi ov ]',
    grammarRule: 'Sujet + remind(s) me of + personne ou souvenir (ex: This song reminds me of you)',
    description:
      "Partager avec l'autre ce qui évoque sa présence au cours de la journée crée un pont invisible mais magique entre vous deux.",
    tips: "Envoyez une chanson, une photo ou une pensée en disant qu'elle vous a fait penser à votre douce moitié.",
    detectionKeywords: ['remind me of', 'reminds me of', 'reminded me of'],
    exampleSentences: [
      {
        english: 'This love song reminds me of our first dance together.',
        french: 'Cette chanson d’amour me rappelle notre première danse ensemble.',
      },
      {
        english: 'The sweet scent of coffee always reminds me of your mornings.',
        french: 'La douce odeur du café me rappelle toujours tes petits matins.',
      },
      {
        english: 'Everything beautiful in this city reminds me of you.',
        french: 'Tout ce qui est beau dans cette ville me fait penser à toi.',
      },
    ],
    pointsReward: 50,
    duoBonusPoints: 100,
    partner1Completed: false,
    partner2Completed: false,
    bothCompleted: false,
    isActive: false,
  },
  {
    id: 'week-chal-10',
    weekKey: '2026-W47',
    weekNumber: 47,
    title: 'Éperdument amoureux',
    category: 'expression',
    targetEnglish: 'head over heels',
    targetFrench: 'Fou/folle d’amour, amoureux(se) par-dessus la tête',
    phonetic: '[ hède o-veur hiilz ]',
    grammarRule: 'to be head over heels in love with someone',
    description:
      "Une expression anglaise très imagée qui décrit la sensation physique d'avoir fait la culbute amoureuse, la tête à l'envers sous le charme de l'autre.",
    tips: "À utiliser pour rappeler que la flamme et le coup de foudre sont toujours aussi vifs.",
    detectionKeywords: ['head over heels'],
    exampleSentences: [
      {
        english: 'I am still head over heels in love with you.',
        french: 'Je suis toujours aussi follement amoureux(se) de toi.',
      },
      {
        english: 'You got me head over heels from the very first day.',
        french: 'Tu m’as fait perdre la tête dès le tout premier jour.',
      },
      {
        english: 'Head over heels, yesterday, today and tomorrow.',
        french: 'Fou(folle) d’amour, hier, aujourd’hui et demain.',
      },
    ],
    pointsReward: 50,
    duoBonusPoints: 100,
    partner1Completed: false,
    partner2Completed: false,
    bothCompleted: false,
    isActive: false,
  },
  {
    id: 'week-chal-11',
    weekKey: '2026-W48',
    weekNumber: 48,
    title: 'Illuminer ma journée',
    category: 'expression',
    targetEnglish: 'make my day',
    targetFrench: 'Illuminer ma journée / refaire ma journée',
    phonetic: '[ meïk maïe deï ]',
    grammarRule: 'Sujet + make / made / makes my day (ex: Your sweet note made my day)',
    description:
      "Un compliment éclatant qui montre que le simple geste ou message de l'autre a transformé une journée ordinaire en pur bonheur.",
    tips: "Répondez ceci dès que votre partenaire vous envoie un mot doux ou une attention inattendue.",
    detectionKeywords: ['make my day', 'made my day', 'makes my day'],
    exampleSentences: [
      {
        english: 'Your sweet message just made my whole day.',
        french: 'Ton doux message vient d’illuminer toute ma journée.',
      },
      {
        english: 'Hearing your voice always makes my day.',
        french: 'Entendre ta voix illumine toujours ma journée.',
      },
      {
        english: 'A single kiss from you can make my day wonderful.',
        french: 'Un seul baiser de toi peut rendre ma journée merveilleuse.',
      },
    ],
    pointsReward: 50,
    duoBonusPoints: 100,
    partner1Completed: false,
    partner2Completed: false,
    bothCompleted: false,
    isActive: false,
  },
  {
    id: 'week-chal-12',
    weekKey: '2026-W49',
    weekNumber: 49,
    title: 'À couper le souffle',
    category: 'word',
    targetEnglish: 'breathtaking',
    targetFrench: 'À couper le souffle / renversant(e) de beauté',
    phonetic: '[ BRETH-teï-king ]',
    grammarRule: 'Adjectif : You are breathtaking / a breathtaking smile',
    description:
      "Un compliment d'une puissance infinie, bien plus intense que 'pretty' ou 'beautiful'. Il exprime l'émerveillement qui nous laisse sans voix.",
    tips: "Faites chavirer le cœur de votre partenaire en admirant sa tenue, son regard ou un paysage vu ensemble.",
    detectionKeywords: ['breathtaking', 'breath taking'],
    exampleSentences: [
      {
        english: 'You look absolutely breathtaking today, my love.',
        french: 'Tu es absolument à couper le souffle aujourd’hui, mon amour.',
      },
      {
        english: 'Your smile is simply breathtaking.',
        french: 'Ton sourire est tout simplement renversant.',
      },
      {
        english: 'Watching the sunset with you was breathtaking.',
        french: 'Regarder le coucher de soleil avec toi était à couper le souffle.',
      },
    ],
    pointsReward: 50,
    duoBonusPoints: 100,
    partner1Completed: false,
    partner2Completed: false,
    bothCompleted: false,
    isActive: false,
  },
];

/**
 * Calcule la clé de semaine ISO actuelle (ex: "2026-W38")
 */
export function getCurrentIsoWeekKey(date: Date = new Date()): string {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = new Date(firstThursday).getFullYear();
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Récupère le défi actif ou le défi correspondant à la semaine actuelle
 */
export function getActiveOrCurrentWeekChallenge(
  challenges: WeeklyLearningChallenge[]
): WeeklyLearningChallenge {
  if (!challenges || challenges.length === 0) {
    return INITIAL_WEEKLY_LEARNING_CHALLENGES[0];
  }
  // 1. Défi explicitement marqué comme actif
  const explicitlyActive = challenges.find((c) => c.isActive);
  if (explicitlyActive) return explicitlyActive;

  // 2. Défi correspondant à la semaine ISO courante
  const currentKey = getCurrentIsoWeekKey();
  const byWeek = challenges.find((c) => c.weekKey === currentKey);
  if (byWeek) return byWeek;

  // 3. Fallback sur le premier
  return challenges[0];
}

/**
 * Vérifie si le texte d'un message correspond aux mots-clés du défi hebdomadaire
 */
export function matchLearningChallenge(
  messageContent: string,
  challenge: WeeklyLearningChallenge
): boolean {
  if (!messageContent || !challenge || !challenge.detectionKeywords) return false;
  const normalizedMsg = messageContent
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, "'");

  return challenge.detectionKeywords.some((keyword) => {
    const normalizedKeyword = keyword
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’']/g, "'");

    return normalizedMsg.includes(normalizedKeyword);
  });
}
