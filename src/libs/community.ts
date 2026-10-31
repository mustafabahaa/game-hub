/** Cursor-paginated Community feed and per-user public game pages. */
import { profilesLib } from './profiles';
import { publicGamesLib } from './publicGames';
import type { CommunityProfile, PublicGameDoc, UserProfile } from '@/domain/types';
import type { CursorPage, PageCursor } from './db';

export const COMMUNITY_USERS_PER_PAGE = 12;
export const COMMUNITY_GAMES_PER_PREVIEW = 6;
export const COMMUNITY_GAMES_PER_PAGE = 24;

export interface CommunityProfilesPage {
  profiles: CommunityProfile[];
  nextCursor: PageCursor | null;
  hasMoreUsers: boolean;
  scannedUsers: number;
}

export const communityLib = {
  /** Page public users, fetching no more than a six-game preview per user. */
  async getProfilesPage(cursor: PageCursor | null): Promise<CommunityProfilesPage> {
    const users = await profilesLib.getPage(cursor, COMMUNITY_USERS_PER_PAGE);
    const profiles = await Promise.all(users.items.map(async (profile) => {
      const preview = await publicGamesLib.getOwnerPreview(profile.uid, COMMUNITY_GAMES_PER_PREVIEW + 1);
      if (preview.length === 0) return null;
      return {
        ownerUid: profile.uid,
        ownerUsername: profile.username,
        ownerDisplayName: profile.displayName,
        ownerAvatarUrl: profile.avatarUrl ?? null,
        ownerBio: profile.bio ?? null,
        games: preview.slice(0, COMMUNITY_GAMES_PER_PREVIEW),
        hasMoreGames: preview.length > COMMUNITY_GAMES_PER_PREVIEW,
      } satisfies CommunityProfile;
    }));

    return {
      profiles: profiles.filter((profile): profile is CommunityProfile => profile !== null),
      nextCursor: users.nextCursor,
      hasMoreUsers: users.hasMore,
      scannedUsers: users.items.length,
    };
  },

  getProfile(ownerUid: string): Promise<UserProfile | undefined> {
    return profilesLib.get(ownerUid);
  },

  getGamesPage(ownerUid: string, cursor: PageCursor | null): Promise<CursorPage<PublicGameDoc>> {
    return publicGamesLib.getOwnerPage(ownerUid, cursor, COMMUNITY_GAMES_PER_PAGE);
  },
};
