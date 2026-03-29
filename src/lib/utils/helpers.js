export const BIBLE_BOOKS = {
  // Old Testament
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34,
  Joshua: 24, Judges: 21, Ruth: 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
  Ezra: 10, Nehemiah: 13, Esther: 10, Job: 42, Psalms: 150, Proverbs: 31,
  Ecclesiastes: 12, "Song of Solomon": 8, Isaiah: 66, Jeremiah: 52,
  Lamentations: 5, Ezekiel: 48, Daniel: 12, Hosea: 14, Joel: 3, Amos: 9,
  Obadiah: 1, Jonah: 4, Micah: 7, Nahum: 3, Habakkuk: 3, Zephaniah: 3,
  Haggai: 2, Zechariah: 14, Malachi: 4,

  // New Testament
  Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28, Romans: 16,
  "1 Corinthians": 16, "2 Corinthians": 13, Galatians: 6, Ephesians: 6,
  Philippians: 4, Colossians: 4, "1 Thessalonians": 5, "2 Thessalonians": 3,
  "1 Timothy": 6, "2 Timothy": 4, Titus: 3, Philemon: 1, Hebrews: 13,
  James: 5, "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1,
  "3 John": 1, Jude: 1, Revelation: 22
};

export const BOOK_ABBREVIATIONS = {
  Genesis: 'Ge', Exodus: 'Ex', Leviticus: 'Le', Numbers: 'Nu', Deuteronomy: 'De',
  Joshua: 'Jo', Judges: 'Ju', Ruth: 'Ru', '1 Samuel': '1S', '2 Samuel': '2S',
  '1 Kings': '1K', '2 Kings': '2K', '1 Chronicles': '1C', '2 Chronicles': '2C',
  Ezra: 'Ez', Nehemiah: 'Ne', Esther: 'Es', Job: 'Jb', Psalms: 'Ps',
  Proverbs: 'Pr', Ecclesiastes: 'Ec', 'Song of Solomon': 'SoS', Isaiah: 'Is',
  Jeremiah: 'Je', Lamentations: 'La', Ezekiel: 'Ek', Daniel: 'Da', Hosea: 'Ho',
  Joel: 'Jl', Amos: 'Am', Obadiah: 'Ob', Jonah: 'Jh', Micah: 'Mi', Nahum: 'Na',
  Habakkuk: 'Ha', Zephaniah: 'Ze', Haggai: 'Hg', Zechariah: 'Zc', Malachi: 'Ma',
  Matthew: 'Mt', Mark: 'Mk', Luke: 'Lu', John: 'Jn', Acts: 'Ac', Romans: 'Ro',
  '1 Corinthians': '1C', '2 Corinthians': '2C', Galatians: 'Ga', Ephesians: 'Ep',
  Philippians: 'Ph', Colossians: 'Co', '1 Thessalonians': '1T', '2 Thessalonians': '2T',
  '1 Timothy': '1Ti', '2 Timothy': '2Ti', Titus: 'Ti', Philemon: 'Pm', Hebrews: 'He',
  James: 'Ja', '1 Peter': '1P', '2 Peter': '2P', '1 John': '1J', '2 John': '2J',
  '3 John': '3J', Jude: 'Jd', Revelation: 'Re'
};

export const TOTAL_CHAPTERS = 1189;

export function stripPunctuation(word) {
	return word.replace(/[^\w\s]|_/g, '').replace(/\s+/g, ' ');
}

export function getFirstLetters(text) {
	return text
		.split(' ')
		.map((word) => {
			const cleanWord = stripPunctuation(word);
			return cleanWord.length > 0 ? cleanWord[0].toLowerCase() : '';
		})
		.filter((l) => l !== '');
}

export async function getCycleStats(db) {
	const progress = await db.reading_progress.toArray();
    
    // Retrieve global completion count from metadata table
    const countRecord = await db.metadata.get('completion_counts');
    const globalMin = countRecord ? countRecord.value : 0;

	const completedInCycle = progress.filter((p) => p.is_completed).length;

	return { globalMin, completedInCycle, progressMap: progress };
}