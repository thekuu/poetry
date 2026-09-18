import { db } from './index.js';
import { poems } from './schema.js';
import { hashToken } from '../utils/crypto.js';

async function runSeed() {
  if (!db) {
      console.log('No database configured. Skipping seed.');
      process.exit(0);
  }
  
  console.log('Seeding database with classic formal poems...');
  
  try {
    const defaultToken = "seed_formal_token_123";
    const hashedToken = hashToken(defaultToken);
    
    // Love ("ፍቅር")
    await db.insert(poems).values({
      title: 'How Do I Love Thee?',
      content: 'How do I love thee? Let me count the ways.\nI love thee to the depth and breadth and height\nMy soul can reach, when feeling out of sight\nFor the ends of being and ideal grace.\nI love thee to the level of every day\'s\nMost quiet need, by sun and candle-light.\nI love thee freely, as men strive for right.\nI love thee purely, as they turn from praise.',
      authorName: 'Elizabeth Barrett Browning',
      category: 'ፍቅር',
      type: 'formal',
      authorTokenHash: hashedToken,
    });

    // Life ("ሕይወት")
    await db.insert(poems).values({
      title: 'Invictus',
      content: 'Out of the night that covers me,\nBlack as the pit from pole to pole,\nI thank whatever gods may be\nFor my unconquerable soul.\n\nIn the fell clutch of circumstance\nI have not winced nor cried aloud.\nUnder the bludgeonings of chance\nMy head is bloody, but unbowed.',
      authorName: 'William Ernest Henley',
      category: 'ሕይወት',
      type: 'formal',
      authorTokenHash: hashedToken,
    });

    // Nature ("ተፈጥሮ")
    await db.insert(poems).values({
      title: 'I Wandered Lonely as a Cloud',
      content: 'I wandered lonely as a cloud\nThat floats on high o\'er vales and hills,\nWhen all at once I saw a crowd,\nA host, of golden daffodils;\nBeside the lake, beneath the trees,\nFluttering and dancing in the breeze.',
      authorName: 'William Wordsworth',
      category: 'ተፈጥሮ',
      type: 'formal',
      authorTokenHash: hashedToken,
    });

    // Sadness ("ሐዘን")
    await db.insert(poems).values({
      title: 'Tears, Idle Tears',
      content: 'Tears, idle tears, I know not what they mean,\nTears from the depth of some divine despair\nRise in the heart, and gather to the eyes,\nIn looking on the happy Autumn-fields,\nAnd thinking of the days that are no more.',
      authorName: 'Alfred, Lord Tennyson',
      category: 'ሐዘን',
      type: 'formal',
      authorTokenHash: hashedToken,
    });

    // Hope ("ተስፋ")
    await db.insert(poems).values({
      title: 'Hope is the thing with feathers',
      content: 'Hope is the thing with feathers\nThat perches in the soul,\nAnd sings the tune without the words,\nAnd never stops at all,\n\nAnd sweetest in the Gale is heard;\nAnd sore must be the storm\nThat could abash the little Bird\nThat kept so many warm.',
      authorName: 'Emily Dickinson',
      category: 'ተስፋ',
      type: 'formal',
      authorTokenHash: hashedToken,
    });

    // Other ("ሌላ")
    await db.insert(poems).values({
      title: 'Ozymandias',
      content: 'I met a traveller from an antique land,\nWho said: "Two vast and trunkless legs of stone\nStand in the desert... Near them, on the sand,\nHalf sunk a shattered visage lies, whose frown,\nAnd wrinkled lip, and sneer of cold command,\nTell that its sculptor well those passions read\nWhich yet survive, stamped on these lifeless things,\nThe hand that mocked them, and the heart that fed.',
      authorName: 'Percy Bysshe Shelley',
      category: 'ሌላ',
      type: 'formal',
      authorTokenHash: hashedToken,
    });

    console.log('Formal poems seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

runSeed();
