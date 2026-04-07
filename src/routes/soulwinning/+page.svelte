<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { db } from '$lib/db/db';
	import { createSelectionManager, longpress, copySelected, favoriteSelected, locateSelected } from '$lib/utils/helpers';
	import SelectionActionBar from '$lib/components/SelectionActionBar.svelte';
	import { headerTitle, headerAction } from '$lib/stores/header';

	$: headerTitle.set('Soulwinning');
	$: headerAction.set(null);

	/** @type {Array<{title: string, citations: string[], verses: any[]}>} */
let topics = [
  {
    title: "All have sinned",
    citations: [
      "Romans 3:10",
      "Romans 3:23",
      "Romans 5:12",
      "Isaiah 53:6",
      "1 John 1:8"
    ],
    verses: [
      "As it is written, There is none righteous, no, not one:",
      "For all have sinned, and come short of the glory of God;",
      "Wherefore, as by one man sin entered into the world, and death by sin; and so death passed upon all men, for that all have sinned:",
      "All we like sheep have gone astray; we have turned every one to his own way; and the LORD hath laid on him the iniquity of us all.",
      "If we say that we have no sin, we deceive ourselves, and the truth is not in us."
    ]
  },
  {
    title: "The wages of sin is death",
    citations: [
      "Romans 6:23",
      "James 1:15",
      "Hebrews 9:27",
      "Revelation 20:14",
      "John 8:24"
    ],
    verses: [
      "For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.",
      "Then when lust hath conceived, it bringeth forth sin: and sin, when it is finished, bringeth forth death.",
      "And as it is appointed unto men once to die, but after this the judgment:",
      "And death and hell were cast into the lake of fire. This is the second death.",
      "I said therefore unto you, that ye shall die in your sins: for if ye believe not that I am he, ye shall die in your sins."
    ]
  },
  {
    title: "Hell is real",
    citations: [
      "Luke 16:23",
      "Matthew 10:28",
      "Psalm 9:17",
      "Mark 9:43",
      "Revelation 20:15"
    ],
    verses: [
      "And in hell he lift up his eyes, being in torments, and seeth Abraham afar off, and Lazarus in his bosom.",
      "And fear not them which kill the body, but are not able to kill the soul: but rather fear him which is able to destroy both soul and body in hell.",
      "The wicked shall be turned into hell, and all the nations that forget God.",
      "And if thy hand offend thee, cut it off: it is better for thee to enter into life maimed, than having two hands to go into hell, into the fire that never shall be quenched:",
      "And whosoever was not found written in the book of life was cast into the lake of fire."
    ]
  },
  {
    title: "Hell is fire",
    citations: [
      "Revelation 21:8",
      "Matthew 13:42",
      "Mark 9:44",
      "Matthew 25:41",
      "Luke 16:24"
    ],
    verses: [
      "But the fearful, and unbelieving, and the abominable, and murderers, and whoremongers, and sorcerers, and idolaters, and all liars, shall have their part in the lake which burneth with fire and brimstone: which is the second death.",
      "And shall cast them into a furnace of fire: there shall be wailing and gnashing of teeth.",
      "Where their worm dieth not, and the fire is not quenched.",
      "Then shall he say also unto them on the left hand, Depart from me, ye cursed, into everlasting fire, prepared for the devil and his angels:",
      "And he cried and said, Father Abraham, have mercy on me, and send Lazarus, that he may dip the tip of his finger in water, and cool my tongue; for I am tormented in this flame."
    ]
  },
  {
    title: "Jesus is god",
    citations: [
      "John 1:1",
      "John 10:30",
      "1 Timothy 3:16",
      "Colossians 2:9",
      "John 8:58"
    ],
    verses: [
      "In the beginning was the Word, and the Word was with God, and the Word was God.",
      "I and my Father are one.",
      "And without controversy great is the mystery of godliness: God was manifest in the flesh, justified in the Spirit, seen of angels, preached unto the Gentiles, believed on in the world, received up into glory.",
      "For in him dwelleth all the fulness of the Godhead bodily.",
      "Jesus said unto them, Verily, verily, I say unto you, Before Abraham was, I am."
    ]
  },
  {
    title: "Jesus did no sins",
    citations: [
      "2 Corinthians 5:21",
      "Hebrews 4:15",
      "1 Peter 2:22",
      "1 John 3:5",
      "Hebrews 7:26"
    ],
    verses: [
      "For he hath made him to be sin for us, who knew no sin; that we might be made the righteousness of God in him.",
      "For we have not an high priest which cannot be touched with the feeling of our infirmities; but was in all points tempted like as we are, yet without sin.",
      "Who did no sin, neither was guile found in his mouth:",
      "And ye know that he was manifested to take away our sins; and in him is no sin.",
      "For such an high priest became us, who is holy, harmless, undefiled, separate from sinners, and made higher than the heavens;"
    ]
  },
  {
    title: "Jesus died, was buried and rose again",
    citations: [
      "1 Corinthians 15:3",
      "1 Corinthians 15:4",
      "Romans 5:8",
      "Romans 4:25",
      "1 Thessalonians 4:14"
    ],
    verses: [
      "For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures;",
      "And that he was buried, and that he rose again the third day according to the scriptures:",
      "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.",
      "Who was delivered for our offences, and was raised again for our justification.",
      "For if we believe that Jesus died and rose again, even so them also which sleep in Jesus will God bring with him."
    ]
  },
  {
    title: "Faith alone",
    citations: [
      "Ephesians 2:8",
      "Ephesians 2:9",
      "Romans 5:1",
      "Galatians 2:16",
      "John 3:16"
    ],
    verses: [
      "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:",
      "Not of works, lest any man should boast.",
      "Therefore being justified by faith, we have peace with God through our Lord Jesus Christ:",
      "Knowing that a man is not justified by the works of the law, but by the faith of Jesus Christ, even we have believed in Jesus Christ, that we might be justified by the faith of Christ, and not by the works of the law: for by the works of the law shall no flesh be justified.",
      "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
    ]
  },
  {
    title: "Repenting of your sin is not required for salvation",
    citations: [
      "Romans 4:5",
      "Jonah 3:10",
      "Romans 11:6",
      "Titus 3:5",
      "John 6:47"
    ],
    verses: [
      "But to him that worketh not, but believeth on him that justifieth the ungodly, his faith is counted for righteousness.",
      "And God saw their works, that they turned from their evil way; and God repented of the evil, that he had said that he would do unto them; and he did it not.",
      "And if by grace, then is it no more of works: otherwise grace is no more grace. But if it be of works, then is it no more grace: otherwise work is no more work.",
      "Not by works of righteousness which we have done, but according to his mercy he saved us, by the washing of regeneration, and renewing of the Holy Ghost;",
      "Verily, verily, I say unto you, He that believeth on me hath everlasting life."
    ]
  },
  {
    title: "Once saved always saved",
    citations: [
      "John 10:28",
      "Ephesians 1:13",
      "Romans 8:38",
      "Romans 8:39",
      "1 John 5:13"
    ],
    verses: [
      "And I give unto them eternal life; and they shall never perish, neither shall any man pluck them out of my hand.",
      "In whom ye also trusted, after that ye heard the word of truth, the gospel of your salvation: in whom also after that ye believed, ye were sealed with that holy Spirit of promise,",
      "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,",
      "Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.",
      "These things have I written unto you that believe on the name of the Son of God; that ye may know that ye have eternal life, and that ye may believe on the name of the Son of God."
    ]
  }
];

	/** @type {Set<any>} */
	let favoriteIds = new Set();
	/** @type {Array<any>} */
	let allVerses = []; // Flat list for selection actions

	const { selected, selectionMode, clear, handleLongPress, handleClick } = createSelectionManager();

	async function loadSoulwinningVerses() {
		const favs = await db.favorite_verses.toArray();
		favoriteIds = new Set(favs.map(f => f.id));

		/** @type {any[]} */
		let loadedVerses = [];

		for (let i = 0; i < topics.length; i++) {
			// Fetch the verses for this topic using the citation index
			const fetched = await db.kjv_text.where('citation').anyOf(topics[i].citations).toArray();
			
			// Sort the fetched verses to match the exact order of the citations array
			topics[i].verses = topics[i].citations
				.map(cit => fetched.find(v => v.citation === cit))
				.filter(Boolean); // Remove undefined if a verse wasn't found
			
			loadedVerses = [...loadedVerses, ...topics[i].verses];
		}
		
		allVerses = loadedVerses;
		topics = topics; // Trigger Svelte reactivity
	}

	onMount(() => {
		loadSoulwinningVerses();
	});

	/** @param {any} verse */
	async function toggleFavorite(verse) {
		if (favoriteIds.has(verse.id)) {
			await db.favorite_verses.delete(verse.id);
			favoriteIds.delete(verse.id);
		} else {
			await db.favorite_verses.put({
				id: verse.id,
				citation: verse.citation,
				timestamp: Date.now()
			});
			favoriteIds.add(verse.id);
		}
		favoriteIds = favoriteIds; 
	}
</script>

{#each topics as topic}
	<div class="mb-8">
		<h2 class="mb-3 ml-1 text-xl font-bold text-[var(--text-main)]">{topic.title}</h2>
		<div class="space-y-1 rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow sm:p-6">
			{#if topic.verses.length === 0}
				<p class="text-[var(--text-main)]">Loading verses...</p>
			{/if}
			{#each topic.verses as v}
				<div
					role="button"
					tabindex="0"
					class="group -mx-2 flex cursor-pointer select-none items-start gap-3 rounded p-2 transition-colors {$selected.has(v.id) ? 'bg-[var(--theme-light)]' : 'hover:bg-[var(--hover-bg)]'}"
					use:longpress
					on:longpress={() => handleLongPress(v.id)}
					on:click={() => handleClick(v.id, () => {})}
					on:keydown={(/** @type {KeyboardEvent} */ e) => e.key === 'Enter' && handleClick(v.id, () => {})}
				>
					<!-- Replaced standard superscript verse number with a bolded reference citation for context -->
					<p class="flex-1 text-lg text-[var(--text-main)]">
						<span class="mr-2 text-sm font-bold text-[var(--theme-color)]">{v.citation}</span>
						{v.text}
					</p>
					
					<button 
						on:click|stopPropagation={() => toggleFavorite(v)}
						class="mt-1 text-2xl transition-colors {favoriteIds.has(v.id) ? 'text-red-500' : 'text-[var(--border-color)] hover:text-red-400'}"
						aria-label="Toggle Favorite"
					>
						♥
					</button>
				</div>
			{/each}
		</div>
	</div>
{/each}

<!-- Bottom padding to prevent the action bar from overlapping the last verse -->
<div class="h-32"></div>

<SelectionActionBar selectedCount={$selected.size} bottomClass="bottom-6" onClear={clear}>
	<button on:click={() => copySelected($selected, allVerses, clear)} class="transition-colors hover:text-[var(--theme-color)]">Copy</button>
	<button on:click={() => favoriteSelected($selected, allVerses, favoriteIds, db, (f) => favoriteIds = f, clear)} class="transition-colors hover:text-red-400">Favorite</button>
	<button on:click={() => locateSelected($selected, allVerses, goto)} class="transition-colors hover:text-green-400">Locate</button>
</SelectionActionBar>