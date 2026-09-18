import { db } from './index.js';
import { poems, replies } from './schema.js';
import { hashToken } from '../utils/crypto.js';

async function runSeed() {
  if (!db) {
      console.log('No database configured. Skipping seed.');
      process.exit(0);
  }
  
  console.log('Seeding database with poetic & funny English conversations...');
  
  try {
    const defaultToken = "seed_token_123";
    const hashedToken = hashToken(defaultToken);
    
    // Conversation 1
    const poemResult1 = await db.insert(poems).values({
      title: 'The Morning Coffee',
      content: 'Dark elixir of the waking dead,\nBanish the fog from within my head.\nI offer this porcelain cup to thee,\nNow grant me the power to simply *be*.',
      authorName: 'Caffeine Dependent',
      category: 'ሕይወት',
      type: 'prompt',
      authorTokenHash: hashedToken,
    }).returning();
    
    await db.insert(replies).values([
      {
        poemId: poemResult1[0].id,
        content: 'I am but a humble bean, roasted and bruised,\nYet without me, the entire world is confused.',
        authorName: 'The Espresso',
        authorTokenHash: hashedToken,
      },
      {
        poemId: poemResult1[0].id,
        content: 'Be careful, mortal, sip me too fast,\nAnd your anxiety will certainly last.',
        authorName: 'The Third Cup',
        authorTokenHash: hashedToken,
      }
    ]);

    // Conversation 2
    const poemResult2 = await db.insert(poems).values({
        title: 'The WiFi Disconnects',
        content: 'The signal fades, the bars do drop,\nThe spinning wheel refuses to stop.\nAm I now forced to look outside?\nOr stare at the router until I cry?',
        authorName: 'Modern Tragedy',
        category: 'ሌላ',
        type: 'prompt',
        authorTokenHash: hashedToken,
    }).returning();
    
    await db.insert(replies).values([
        {
          poemId: poemResult2[0].id,
          content: 'Look at the sky, it is rendered in 8K.\nNo buffering needed, just go out and play.',
          authorName: 'The Outside World',
          authorTokenHash: hashedToken,
        },
        {
          poemId: poemResult2[0].id,
          content: 'Have you tried turning me off and on again?\nOr must we repeat this infinite pain?',
          authorName: 'The Router',
          authorTokenHash: hashedToken,
        }
    ]);

    // Conversation 3
    const poemResult3 = await db.insert(poems).values({
        title: 'To the Sock Who Lost Its Mate',
        content: 'We entered the wash as a pair so fine,\nBut now you are gone, lost to space and time.\nWhere did you go? The great abyss?\nLeaving my left foot cold, in an awkward twist.',
        authorName: 'The Lonely Right Sock',
        category: 'ሐዘን',
        type: 'prompt',
        authorTokenHash: hashedToken,
    }).returning();
    
    await db.insert(replies).values([
        {
          poemId: poemResult3[0].id,
          content: 'I live behind the dryer now, coated in lint.\nIt is a quiet life, peaceful... but I am ruined.',
          authorName: 'The Left Sock',
          authorTokenHash: hashedToken,
        },
        {
          poemId: poemResult3[0].id,
          content: 'Accept your fate, you are now a dusting rag.\nA tragic end to a cotton swag.',
          authorName: 'The Housekeeper',
          authorTokenHash: hashedToken,
        }
    ]);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

runSeed();
