import { EnglishLexiconItem } from '../types';

export const INITIAL_LEXICON_WORDS: EnglishLexiconItem[] = [
  {
    id: 'lex-seed-1',
    english: 'Cozy',
    french: 'Douillet, chaleureux, réconfortant',
    phonetic: '[ Ko-zi ]',
    definition:
      "Se dit d'un endroit, d'une ambiance intime et enveloppante où l'on se sent merveilleusement bien, détendu et au chaud ensemble.",
    contextSentence: "Let's spend a cozy rainy Sunday afternoon in bed together.",
    contextSentenceFrench:
      'Passons un dimanche après-midi pluvieux bien douillet sous la couette ensemble.',
    personalMemory: 'Notre premier dimanche pluvieux emmitouflés avec un bon chocolat chaud.',
    category: 'romantique',
    isFavorite: true,
    isMastered: false,
    addedBy: 'p1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'lex-seed-2',
    english: 'Sweetheart',
    french: 'Mon amour, mon cœur, mon trésor',
    phonetic: '[ Swit-hart ]',
    definition:
      "Surnom affectueux classique et très tendre en anglais pour s'adresser à la personne qu'on aime de tout son cœur.",
    contextSentence: 'Good morning, sweetheart! I made your favorite coffee.',
    contextSentenceFrench: "Bonjour mon amour ! J'ai préparé ton café préféré.",
    personalMemory: "Le petit mot doux qu'on s'est laissé sur la table de chevet.",
    category: 'romantique',
    isFavorite: true,
    isMastered: true,
    addedBy: 'p2',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'lex-seed-3',
    english: 'Serendipity',
    french: 'Heureux hasard, coup de foudre du destin',
    phonetic: '[ Sé-rèn-di-pi-ti ]',
    definition:
      "Le don ou l'événement de faire une découverte extraordinaire et précieuse de manière imprévue et chanceuse.",
    contextSentence: 'Finding you in this huge world was pure serendipity.',
    contextSentenceFrench:
      'Te trouver dans ce monde immense a été un pur coup de foudre du destin.',
    personalMemory: "Le jour de notre toute première rencontre qu'aucun de nous n'avait prévue.",
    category: 'romantique',
    isFavorite: false,
    isMastered: false,
    addedBy: 'p1',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'lex-seed-4',
    english: 'Craving',
    french: 'Avoir une folle envie de, désirer ardemment',
    phonetic: '[ Krey-ving ]',
    definition:
      "Une envie intense et soudaine, souvent pour un péché mignon, une gourmandise sucrée ou un câlin réconfortant.",
    contextSentence: 'I am craving for some chocolate cake and your warm hugs tonight.',
    contextSentenceFrench:
      "J'ai une envie folle de gâteau au chocolat et de tes câlins chaleureux ce soir.",
    personalMemory: 'Nos fringales nocturnes improvisées devant nos séries favorites.',
    category: 'restaurant',
    isFavorite: false,
    isMastered: false,
    addedBy: 'p2',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'lex-seed-5',
    english: 'Wanderlust',
    french: "Soif de voyage, envie d'explorer le monde à deux",
    phonetic: '[ Wan-der-leust ]',
    definition:
      "Le désir irrésistible de partir à l'aventure, de visiter des pays inconnus et de contempler le monde main dans la main.",
    contextSentence: 'Our wanderlust takes us on the most breathtaking adventures.',
    contextSentenceFrench: "Notre soif d'aventures nous emmène dans les voyages les plus époustouflants.",
    personalMemory: 'La liste secrète de pays et de plages que nous voulons visiter ensemble.',
    category: 'voyage',
    isFavorite: true,
    isMastered: false,
    addedBy: 'p1',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
  },
];
