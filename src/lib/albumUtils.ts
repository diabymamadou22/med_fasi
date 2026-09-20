import { GalleryItem } from '../components/views/SharedGalleryView';

export interface MonthAlbum {
  id: string; // e.g. "2026-09" or "undated"
  year: number | null;
  yearLabel: string;
  monthIndex: number | null; // 0..11
  label: string; // e.g. "Septembre 2026"
  shortLabel: string; // e.g. "Sep 2026"
  monthName: string; // e.g. "Septembre"
  items: GalleryItem[];
  coverPhoto: string;
  coverItem?: GalleryItem;
  photoCount: number;
  videoCount: number;
  latestDate?: string;
}

export interface YearGroup {
  year: number | 'undated';
  yearLabel: string; // "2026" or "Moments intemporels"
  albums: MonthAlbum[];
  totalItems: number;
  totalPhotos: number;
  totalVideos: number;
}

const MONTH_NAMES_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const SHORT_MONTH_NAMES_FR = [
  'Janv.',
  'Févr.',
  'Mars',
  'Avr.',
  'Mai',
  'Juin',
  'Juil.',
  'Août',
  'Sept.',
  'Oct.',
  'Nov.',
  'Déc.',
];

/**
 * Parses a date string safely and returns year and monthIndex (0..11)
 */
export function parseDateSafe(dateStr?: string): { year: number; monthIndex: number; valid: boolean } {
  if (!dateStr || typeof dateStr !== 'string' || dateStr.trim() === '') {
    return { year: 0, monthIndex: 0, valid: false };
  }

  // Check YYYY-MM-DD pattern
  const match = dateStr.match(/^(\d{4})-(\d{1,2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    if (!isNaN(year) && !isNaN(month) && month >= 0 && month <= 11) {
      return { year, monthIndex: month, valid: true };
    }
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return {
      year: parsed.getFullYear(),
      monthIndex: parsed.getMonth(),
      valid: true,
    };
  }

  return { year: 0, monthIndex: 0, valid: false };
}

/**
 * Groups a flat list of GalleryItem into chronological MonthAlbums and YearGroups
 */
export function groupGalleryItemsByDate(items: GalleryItem[]): {
  albums: MonthAlbum[];
  yearGroups: YearGroup[];
  availableYears: number[];
  totalPhotos: number;
  totalVideos: number;
} {
  const albumMap = new Map<string, MonthAlbum>();
  let totalPhotos = 0;
  let totalVideos = 0;

  items.forEach((item) => {
    const isVideo = item.mediaType === 'video';
    if (isVideo) {
      totalVideos++;
    } else {
      totalPhotos++;
    }

    const { year, monthIndex, valid } = parseDateSafe(item.date);

    let albumId: string;
    let albumLabel: string;
    let shortLabel: string;
    let monthName: string;
    let yearLabel: string;
    let albumYear: number | null = null;
    let albumMonth: number | null = null;

    if (valid) {
      albumId = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      monthName = MONTH_NAMES_FR[monthIndex] || 'Mois';
      const shortMonth = SHORT_MONTH_NAMES_FR[monthIndex] || 'Mois';
      albumLabel = `${monthName} ${year}`;
      shortLabel = `${shortMonth} ${year}`;
      yearLabel = `${year}`;
      albumYear = year;
      albumMonth = monthIndex;
    } else {
      albumId = 'undated';
      albumLabel = 'Moments intemporels';
      shortLabel = 'Intemporels';
      monthName = 'Intemporels';
      yearLabel = 'Moments intemporels';
    }

    let album = albumMap.get(albumId);
    if (!album) {
      album = {
        id: albumId,
        year: albumYear,
        yearLabel,
        monthIndex: albumMonth,
        label: albumLabel,
        shortLabel,
        monthName,
        items: [],
        coverPhoto: item.photoUrl,
        coverItem: item,
        photoCount: 0,
        videoCount: 0,
        latestDate: item.date,
      };
      albumMap.set(albumId, album);
    }

    album.items.push(item);
    if (isVideo) {
      album.videoCount++;
    } else {
      album.photoCount++;
    }
  });

  // Sort albums descending (newest month first, undated at end)
  const sortedAlbums = Array.from(albumMap.values()).sort((a, b) => {
    if (a.id === 'undated') return 1;
    if (b.id === 'undated') return -1;
    return b.id.localeCompare(a.id);
  });

  // Extract available years
  const yearSet = new Set<number>();
  sortedAlbums.forEach((album) => {
    if (album.year !== null) {
      yearSet.add(album.year);
    }
  });
  const availableYears = Array.from(yearSet).sort((a, b) => b - a);

  // Group albums by Year
  const yearGroupMap = new Map<number | 'undated', YearGroup>();

  sortedAlbums.forEach((album) => {
    const groupKey = album.year !== null ? album.year : 'undated';
    let group = yearGroupMap.get(groupKey);

    if (!group) {
      group = {
        year: groupKey,
        yearLabel: groupKey !== 'undated' ? `${groupKey}` : 'Moments intemporels',
        albums: [],
        totalItems: 0,
        totalPhotos: 0,
        totalVideos: 0,
      };
      yearGroupMap.set(groupKey, group);
    }

    group.albums.push(album);
    group.totalItems += album.items.length;
    group.totalPhotos += album.photoCount;
    group.totalVideos += album.videoCount;
  });

  const sortedYearGroups = Array.from(yearGroupMap.values()).sort((a, b) => {
    if (a.year === 'undated') return 1;
    if (b.year === 'undated') return -1;
    return (b.year as number) - (a.year as number);
  });

  return {
    albums: sortedAlbums,
    yearGroups: sortedYearGroups,
    availableYears,
    totalPhotos,
    totalVideos,
  };
}
