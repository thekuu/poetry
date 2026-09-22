import { db } from './index.ts';
import { poems, replies } from './schema.ts';
import { hashToken } from '../utils/crypto.ts';
import { eq } from 'drizzle-orm';

async function runSeed() {
  if (!db) {
    console.log('No database configured. Skipping seed.');
    process.exit(0);
  }
  
  console.log('Seeding database with poetic & funny English conversations...');
  
  try {
    const defaultToken = "seed_token_123";
    const hashedToken = hashToken(defaultToken);

    const conversations = [
      {
        title: 'The Morning Coffee',
        content: 'Dark elixir of the waking dead,\nBanish the fog from within my head.\nI offer this porcelain cup to thee,\nNow grant me the power to simply *be*.',
        authorName: 'Caffeine Dependent',
        category: 'ሕይወት',
        type: 'prompt' as const,
        replies: [
          {
            content: 'I am but a humble bean, roasted and bruised,\nYet without me, the entire world is confused.',
            authorName: 'The Espresso'
          },
          {
            content: 'Be careful, mortal, sip me too fast,\nAnd your anxiety will certainly last.',
            authorName: 'The Third Cup'
          }
        ]
      },
      {
        title: 'The WiFi Disconnects',
        content: 'The signal fades, the bars do drop,\nThe spinning wheel refuses to stop.\nAm I now forced to look outside?\nOr stare at the router until I cry?',
        authorName: 'Modern Tragedy',
        category: 'ሌላ',
        type: 'prompt' as const,
        replies: [
          {
            content: 'Look at the sky, it is rendered in 8K.\nNo buffering needed, just go out and play.',
            authorName: 'The Outside World'
          },
          {
            content: 'Have you tried turning me off and on again?\nOr must we repeat this infinite pain?',
            authorName: 'The Router'
          }
        ]
      },
      {
        title: 'To the Sock Who Lost Its Mate',
        content: 'We entered the wash as a pair so fine,\nBut now you are gone, lost to space and time.\nWhere did you go? The great abyss?\nLeaving my left foot cold, in an awkward twist.',
        authorName: 'The Lonely Right Sock',
        category: 'ሐዘን',
        type: 'prompt' as const,
        replies: [
          {
            content: 'I live behind the dryer now, coated in lint.\nIt is a quiet life, peaceful... but I am ruined.',
            authorName: 'The Left Sock'
          },
          {
            content: 'Accept your fate, you are now a dusting rag.\nA tragic end to a cotton swag.',
            authorName: 'The Housekeeper'
          }
        ]
      }
    ];

    for (const conv of conversations) {
      const existing = await db.select().from(poems).where(eq(poems.title, conv.title)).limit(1);
      if (existing.length > 0) {
        console.log(`Skipping already seeded poem: "${conv.title}"`);
        continue;
      }

      const poemResult = await db.insert(poems).values({
        title: conv.title,
        content: conv.content,
        authorName: conv.authorName,
        category: conv.category,
        type: conv.type,
        authorTokenHash: hashedToken,
      }).returning();

      await db.insert(replies).values(
        conv.replies.map(r => ({
          poemId: poemResult[0].id,
          content: r.content,
          authorName: r.authorName,
          authorTokenHash: hashedToken,
        }))
      );
      console.log(`Seeded poem: "${conv.title}"`);
    }

    console.log('Database seeding finished.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

runSeed();
