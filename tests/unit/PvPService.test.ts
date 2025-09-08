import { PvPService } from '@/game/services/PvPService';
import { BattleStatus } from '@prisma/client';

describe('PvPService', () => {
  let pvpService: PvPService;

  beforeEach(() => {
    pvpService = new PvPService();
  });

  describe('createMatch', () => {
    it('should create a PvP match between two characters', async () => {
      const challengerId = 'challenger-123';
      const opponentId = 'opponent-456';

      const match = await pvpService.createMatch(challengerId, opponentId);

      expect(match).toBeDefined();
      expect(match.challengerId).toBe(challengerId);
      expect(match.opponentId).toBe(opponentId);
      expect(match.status).toBe(BattleStatus.PENDING);
      expect(match.round).toBe(1);
    });

    it('should throw error when challenging self', async () => {
      const characterId = 'character-123';

      await expect(pvpService.createMatch(characterId, characterId)).rejects.toThrow('Cannot challenge yourself');
    });
  });

  describe('acceptMatch', () => {
    it('should accept a pending match', async () => {
      const challengerId = 'challenger-123';
      const opponentId = 'opponent-456';

      const match = await pvpService.createMatch(challengerId, opponentId);
      const acceptedMatch = await pvpService.acceptMatch(match.id);

      expect(acceptedMatch.status).toBe(BattleStatus.ACTIVE);
      expect(acceptedMatch.log).toContain('Match accepted! Battle begins!');
    });

    it('should throw error for non-existent match', async () => {
      await expect(pvpService.acceptMatch('non-existent')).rejects.toThrow('Match not found');
    });
  });

  describe('takeTurn', () => {
    it('should execute a turn in an active match', async () => {
      const challengerId = 'challenger-123';
      const opponentId = 'opponent-456';

      const match = await pvpService.createMatch(challengerId, opponentId);
      await pvpService.acceptMatch(match.id);

      const result = await pvpService.takeTurn(match.id, challengerId, 'attack');

      expect(result.success).toBe(true);
      expect(result.damage).toBeGreaterThan(0);
      expect(result.log).toBeDefined();
    });

    it('should throw error for non-existent match', async () => {
      await expect(pvpService.takeTurn('non-existent', 'character-123', 'attack')).rejects.toThrow('Match not found');
    });

    it('should throw error for character not in match', async () => {
      const challengerId = 'challenger-123';
      const opponentId = 'opponent-456';
      const outsiderId = 'outsider-789';

      const match = await pvpService.createMatch(challengerId, opponentId);
      await pvpService.acceptMatch(match.id);

      const result = await pvpService.takeTurn(match.id, outsiderId, 'attack');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Character is not part of this match');
    });
  });

  describe('getMatch', () => {
    it('should return match by ID', async () => {
      const challengerId = 'challenger-123';
      const opponentId = 'opponent-456';

      const createdMatch = await pvpService.createMatch(challengerId, opponentId);
      const retrievedMatch = await pvpService.getMatch(createdMatch.id);

      expect(retrievedMatch).toBeDefined();
      expect(retrievedMatch?.id).toBe(createdMatch.id);
    });

    it('should return null for non-existent match', async () => {
      const match = await pvpService.getMatch('non-existent');
      expect(match).toBeNull();
    });
  });

  describe('getCharacterRating', () => {
    it('should return null for character without rating', async () => {
      const rating = await pvpService.getCharacterRating('non-existent');
      expect(rating).toBeNull();
    });
  });

  describe('updateRating', () => {
    it('should create new rating for character', async () => {
      const characterId = 'character-123';
      const ratingChange = 25;

      const rating = await pvpService.updateRating(characterId, ratingChange);

      expect(rating).toBeDefined();
      expect(rating.characterId).toBe(characterId);
      expect(rating.rating).toBe(1025);
      expect(rating.wins).toBe(1);
      expect(rating.losses).toBe(0);
    });

    it('should update existing rating', async () => {
      const characterId = 'character-123';
      const initialChange = 25;
      const secondChange = -15;

      await pvpService.updateRating(characterId, initialChange);
      const rating = await pvpService.updateRating(characterId, secondChange);

      expect(rating.rating).toBe(1010);
      expect(rating.wins).toBe(1);
      expect(rating.losses).toBe(1);
    });
  });

  describe('getLeaderboard', () => {
    it('should return empty leaderboard initially', async () => {
      const leaderboard = await pvpService.getLeaderboard();
      expect(leaderboard).toEqual([]);
    });

    it('should return leaderboard with ratings', async () => {
      const character1 = 'character-1';
      const character2 = 'character-2';

      await pvpService.updateRating(character1, 100);
      await pvpService.updateRating(character2, 50);

      const leaderboard = await pvpService.getLeaderboard();

      expect(leaderboard.length).toBe(2);
      expect(leaderboard[0].rating).toBeGreaterThanOrEqual(leaderboard[1].rating);
    });
  });

  describe('calculateRatingChange', () => {
    it('should calculate rating changes correctly', () => {
      const winnerRating = 1200;
      const loserRating = 1000;

      const changes = pvpService.calculateRatingChange(winnerRating, loserRating);

      expect(changes.winnerChange).toBeGreaterThan(0);
      expect(changes.loserChange).toBeLessThan(0);
      expect(Math.abs(changes.winnerChange)).toBe(Math.abs(changes.loserChange));
    });

    it('should give smaller changes for closer ratings', () => {
      const closeWinner = 1010;
      const closeLoser = 1000;
      const farWinner = 1200;
      const farLoser = 1000;

      const closeChanges = pvpService.calculateRatingChange(closeWinner, closeLoser);
      const farChanges = pvpService.calculateRatingChange(farWinner, farLoser);

      expect(Math.abs(closeChanges.winnerChange)).toBeLessThan(Math.abs(farChanges.winnerChange));
    });
  });

  describe('isMatchValid', () => {
    it('should return true for valid match', async () => {
      const challengerId = 'challenger-123';
      const opponentId = 'opponent-456';

      const match = await pvpService.createMatch(challengerId, opponentId);
      const isValid = await pvpService.isMatchValid(match.id, challengerId);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid match', async () => {
      const isValid = await pvpService.isMatchValid('non-existent', 'character-123');
      expect(isValid).toBe(false);
    });
  });

  describe('getActiveMatches', () => {
    it('should return empty array for character with no matches', async () => {
      const matches = await pvpService.getActiveMatches('character-123');
      expect(matches).toEqual([]);
    });

    it('should return active matches for character', async () => {
      const challengerId = 'challenger-123';
      const opponentId = 'opponent-456';

      const match = await pvpService.createMatch(challengerId, opponentId);
      const matches = await pvpService.getActiveMatches(challengerId);

      expect(matches.length).toBe(1);
      expect(matches[0].id).toBe(match.id);
    });
  });

  describe('forfeitMatch', () => {
    it('should forfeit match and update ratings', async () => {
      const challengerId = 'challenger-123';
      const opponentId = 'opponent-456';

      const match = await pvpService.createMatch(challengerId, opponentId);
      await pvpService.acceptMatch(match.id);

      const result = await pvpService.forfeitMatch(match.id, challengerId);

      expect(result.match.status).toBe(BattleStatus.FINISHED);
      expect(result.winner?.id).toBe(opponentId);
      expect(result.loser?.id).toBe(challengerId);
      expect(result.ratingChanges.winnerChange).toBeGreaterThan(0);
      expect(result.ratingChanges.loserChange).toBeLessThan(0);
    });

    it('should throw error for non-existent match', async () => {
      await expect(pvpService.forfeitMatch('non-existent', 'character-123')).rejects.toThrow('Match not found');
    });
  });
});
