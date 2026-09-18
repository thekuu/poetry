import { db } from './index.js';
import { poems } from './schema.js';
import { hashToken } from '../utils/crypto.js';

async function runSeed() {
  if (!db) {
      console.log('No database configured. Skipping seed.');
      process.exit(0);
  }
  
  console.log('Seeding database with second batch of classic formal poems...');
  
  try {
    const defaultToken = "seed_formal_token_456";
    const hashedToken = hashToken(defaultToken);
    
    // Love ("ፍቅር")
    await db.insert(poems).values({
      title: 'Sonnet 18',
      content: "Shall I compare thee to a summer's day?\nThou art more lovely and more temperate:\nRough winds do shake the darling buds of May,\nAnd summer's lease hath all too short a date.",
      authorName: 'William Shakespeare',
      category: 'ፍቅር',
      type: 'formal',
      authorTokenHash: hashedToken,
    });

    // Life ("ሕይወት")
    await db.insert(poems).values({
      title: 'A Psalm of Life',
      content: 'Tell me not, in mournful numbers,\nLife is but an empty dream!\nFor the soul is dead that slumbers,\nAnd things are not what they seem.\n\nLife is real! Life is earnest!\nAnd the grave is not its goal;\nDust thou art, to dust returnest,\nWas not spoken of the soul.',
      authorName: 'Henry Wadsworth Longfellow',
      category: 'ሕይወት',
      type: 'formal',
      authorTokenHash: hashedToken,
    });

    // Nature ("ተፈጥሮ")
    await db.insert(poems).values({
      title: 'To Autumn',
      content: 'Season of mists and mellow fruitfulness,\nClose bosom-friend of the maturing sun;\nConspiring with him how to load and bless\nWith fruit the vines that round the thatch-eves run;',
      authorName: 'John Keats',
      category: 'ተፈጥሮ',
      type: 'formal',
      authorTokenHash: hashedToken,
    });

    // Sadness ("ሐዘን")
    await db.insert(poems).values({
      title: 'Remember',
      content: 'Remember me when I am gone away,\nGone far away into the silent land;\nWhen you can no more hold me by the hand,\nNor I half turn to go yet turning stay.',
      authorName: 'Christina Rossetti',
      category: 'ሐዘን',
      type: 'formal',
      authorTokenHash: hashedToken,
    });

    // Hope ("ተስፋ")
    await db.insert(poems).values({
      title: 'Hope',
      content: 'Hope was but a timid friend;\nShe sat without the grated den,\nWatching how my fate would tend,\nEven as selfish-hearted men.',
      authorName: 'Emily Brontë',
      category: 'ተስፋ',
      type: 'formal',
      authorTokenHash: hashedToken,
    });

    // Other ("ሌላ")
    await db.insert(poems).values({
      title: 'The Road Not Taken',
      content: 'Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth;',
      authorName: 'Robert Frost',
      category: 'ሌላ',
      type: 'formal',
      authorTokenHash: hashedToken,
    });

    console.log('Second batch of formal poems seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

runSeed();
