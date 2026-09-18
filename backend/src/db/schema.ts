import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').default('user').notNull(), // 'user' or 'admin'
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const poems = pgTable('poems', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    authorName: text('author_name'),
    authorTokenHash: text('author_token_hash').notNull(),
    userId: uuid('user_id').references(() => users.id),
    category: text('category'),
    type: text('type').default('formal').notNull(), // 'formal', 'prompt'
    sourceUrl: text('source_url'), // for formal poems fetched from other social media
    status: text('status').default('active').notNull(), // active, hidden, deleted
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const replies = pgTable('replies', {
    id: uuid('id').defaultRandom().primaryKey(),
    poemId: uuid('poem_id').references(() => poems.id, { onDelete: 'cascade' }).notNull(),
    parentReplyId: uuid('parent_reply_id'),
    content: text('content').notNull(),
    authorName: text('author_name'),
    authorTokenHash: text('author_token_hash').notNull(),
    userId: uuid('user_id').references(() => users.id),
    status: text('status').default('active').notNull(), // active, hidden, deleted
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const telegramChannels = pgTable('telegram_channels', {
    id: uuid('id').defaultRandom().primaryKey(),
    url: text('url').notNull().unique(),
    addedBy: uuid('added_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
    poems: many(poems),
    replies: many(replies),
}));

export const poemsRelations = relations(poems, ({ one, many }) => ({
    user: one(users, {
        fields: [poems.userId],
        references: [users.id],
    }),
    replies: many(replies),
}));

export const repliesRelations = relations(replies, ({ one }) => ({
    poem: one(poems, {
        fields: [replies.poemId],
        references: [poems.id],
    }),
    user: one(users, {
        fields: [replies.userId],
        references: [users.id],
    }),
}));
