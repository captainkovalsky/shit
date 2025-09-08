import { PvpMatch, BattleStatus, Character, CharacterRating } from '@prisma/client';
import prisma from '../../database/client';
import { CombatService, CharacterStats } from './CombatService';
// import { LevelingService } from './LevelingService';

export interface PvPMatchResult {
  match: PvpMatch;
  winner: Character | null;
  loser: Character | null;
  ratingChanges: {
    winner: number;
    loser: number;
  };
}

export interface PvPTurnResult {
  success: boolean;
  damage?: number;
  enemyDamage?: number;
  mpCost?: number;
  log?: string[];
  error?: string;
  matchState?: any;
  result?: 'WIN' | 'LOSE' | null;
}

export interface IPvPService {
  createMatch(challengerId: string, opponentId: string): Promise<PvpMatch>;
  acceptMatch(matchId: string): Promise<PvpMatch>;
  takeTurn(matchId: string, characterId: string, action: 'attack' | 'skill', skillId?: string): Promise<PvPTurnResult>;
  getMatch(matchId: string): Promise<PvpMatch | null>;
  getCharacterRating(characterId: string): Promise<CharacterRating | null>;
  updateRating(characterId: string, ratingChange: number): Promise<CharacterRating>;
  getLeaderboard(season?: string, limit?: number): Promise<CharacterRating[]>;
  calculateRatingChange(winnerRating: number, loserRating: number): { winnerChange: number; loserChange: number };
  isMatchValid(matchId: string, characterId: string): Promise<boolean>;
  getActiveMatches(characterId: string): Promise<PvpMatch[]>;
  forfeitMatch(matchId: string, characterId: string): Promise<PvPMatchResult>;
}

export class PvPService implements IPvPService {
  private combatService: CombatService;
  // private _levelingService: LevelingService;

  constructor() {
    this.combatService = new CombatService();
    // this._levelingService = new LevelingService();
  }

  async createMatch(challengerId: string, opponentId: string): Promise<PvpMatch> {
    if (challengerId === opponentId) {
      throw new Error('Cannot challenge yourself');
    }

    const challenger = await prisma.character.findUnique({
      where: { id: challengerId },
    });

    const opponent = await prisma.character.findUnique({
      where: { id: opponentId },
    });

    if (!challenger || !opponent) {
      throw new Error('Character not found');
    }

    const existingMatch = await prisma.pvpMatch.findFirst({
      where: {
        OR: [
          { challengerId, opponentId, status: { in: [BattleStatus.PENDING, BattleStatus.ACTIVE] } },
          { challengerId: opponentId, opponentId: challengerId, status: { in: [BattleStatus.PENDING, BattleStatus.ACTIVE] } },
        ],
      },
    });

    if (existingMatch) {
      throw new Error('Match already exists between these characters');
    }

    return prisma.pvpMatch.create({
      data: {
        challengerId,
        opponentId,
        status: BattleStatus.PENDING,
        round: 1,
        log: [],
      },
    });
  }

  async acceptMatch(matchId: string): Promise<PvpMatch> {
    const match = await prisma.pvpMatch.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== BattleStatus.PENDING) {
      throw new Error('Match is not pending');
    }

    return prisma.pvpMatch.update({
      where: { id: matchId },
      data: {
        status: BattleStatus.ACTIVE,
        log: [...(match.log as string[]), 'Match accepted! Battle begins!'],
      },
    });
  }

  async takeTurn(matchId: string, characterId: string, action: 'attack' | 'skill', skillId?: string): Promise<PvPTurnResult> {
    const match = await prisma.pvpMatch.findUnique({
      where: { id: matchId },
      include: {
        challenger: true,
        opponent: true,
      },
    });

    if (!match) {
      return {
        success: false,
        error: 'Match not found',
      };
    }

    if (match.status !== BattleStatus.ACTIVE) {
      return {
        success: false,
        error: 'Match is not active',
      };
    }

    const isChallenger = match.challengerId === characterId;
    const isOpponent = match.opponentId === characterId;

    if (!isChallenger && !isOpponent) {
      return {
        success: false,
        error: 'Character is not part of this match',
      };
    }

    const attacker = isChallenger ? match.challenger : match.opponent;
    const defender = isChallenger ? match.opponent : match.challenger;

    if (!attacker || !defender) {
      return {
        success: false,
        error: 'Character data not found',
      };
    }

    const attackerStats = attacker.stats as unknown as CharacterStats;
    const defenderStats = defender.stats as unknown as CharacterStats;

    let turnResult: PvPTurnResult;

    if (action === 'attack') {
      const damage = this.combatService.calculateDamage(attackerStats, attackerStats, 1.0);
      turnResult = {
        success: true,
        damage: damage,
        enemyDamage: 0,
        log: [`${attacker.name} attacks ${defender.name} for ${damage} damage!`],
      };
    } else if (action === 'skill' && skillId) {
      const skillResult = this.combatService.calculateDamage(attackerStats, attackerStats, 1.5);
      turnResult = {
        success: true,
        damage: skillResult,
        enemyDamage: 0,
        mpCost: 10,
        log: [`${attacker.name} uses ${skillId} on ${defender.name} for ${skillResult} damage!`],
      };
    } else {
      return {
        success: false,
        error: 'Invalid action or missing skill ID',
      };
    }

    if (!turnResult.success) {
      return turnResult;
    }

    const newDefenderHp = Math.max(0, defenderStats.hp - (turnResult.damage || 0));
    const newAttackerHp = Math.max(0, attackerStats.hp - (turnResult.enemyDamage || 0));
    const newAttackerMp = Math.max(0, attackerStats.mp - (turnResult.mpCost || 0));

    const isDefenderDefeated = newDefenderHp <= 0;
    const isAttackerDefeated = newAttackerHp <= 0;

    let result: 'WIN' | 'LOSE' | null = null;
    let winnerId: string | null = null;

    if (isDefenderDefeated) {
      result = isChallenger ? 'WIN' : 'LOSE';
      winnerId = attacker.id;
    } else if (isAttackerDefeated) {
      result = isChallenger ? 'LOSE' : 'WIN';
      winnerId = defender.id;
    }

    const newLog = [...(match.log as string[]), ...(turnResult.log || [])];
    const newRound = match.round + 1;

    await prisma.pvpMatch.update({
      where: { id: matchId },
      data: {
        round: newRound,
        log: newLog,
        winnerId,
        status: result ? BattleStatus.FINISHED : BattleStatus.ACTIVE,
      },
    });

    if (result) {
      const ratingChanges = this.calculateRatingChange(
        isChallenger ? (await this.getCharacterRating(attacker.id))?.rating || 1000 : (await this.getCharacterRating(defender.id))?.rating || 1000,
        isChallenger ? (await this.getCharacterRating(defender.id))?.rating || 1000 : (await this.getCharacterRating(attacker.id))?.rating || 1000
      );

      await this.updateRating(attacker.id, result === 'WIN' ? ratingChanges.winnerChange : ratingChanges.loserChange);
      await this.updateRating(defender.id, result === 'WIN' ? ratingChanges.loserChange : ratingChanges.winnerChange);

      await prisma.pvpMatch.update({
        where: { id: matchId },
        data: {
          ratingDelta: result === 'WIN' ? ratingChanges.winnerChange : ratingChanges.loserChange,
        },
      });
    }

    return {
      ...turnResult,
      matchState: {
        round: newRound,
        challengerHp: isChallenger ? newAttackerHp : newDefenderHp,
        opponentHp: isChallenger ? newDefenderHp : newAttackerHp,
        challengerMp: isChallenger ? newAttackerMp : defenderStats.mp,
        opponentMp: isChallenger ? defenderStats.mp : newAttackerMp,
        log: newLog,
      },
      result,
    };
  }

  async getMatch(matchId: string): Promise<PvpMatch | null> {
    return prisma.pvpMatch.findUnique({
      where: { id: matchId },
      include: {
        challenger: true,
        opponent: true,
        winner: true,
      },
    });
  }

  async getCharacterRating(characterId: string): Promise<CharacterRating | null> {
    return prisma.characterRating.findUnique({
      where: { characterId },
    });
  }

  async updateRating(characterId: string, ratingChange: number): Promise<CharacterRating> {
    const existingRating = await this.getCharacterRating(characterId);
    
    if (existingRating) {
      const newRating = Math.max(0, existingRating.rating + ratingChange);
      const isWin = ratingChange > 0;
      
      return prisma.characterRating.update({
        where: { characterId },
        data: {
          rating: newRating,
          wins: isWin ? existingRating.wins + 1 : existingRating.wins,
          losses: isWin ? existingRating.losses : existingRating.losses + 1,
        },
      });
    } else {
      const newRating = Math.max(0, 1000 + ratingChange);
      const isWin = ratingChange > 0;
      
      return prisma.characterRating.create({
        data: {
          characterId,
          rating: newRating,
          wins: isWin ? 1 : 0,
          losses: isWin ? 0 : 1,
        },
      });
    }
  }

  async getLeaderboard(season: string = '2025-01', limit: number = 100): Promise<CharacterRating[]> {
    return prisma.characterRating.findMany({
      where: { season },
      orderBy: { rating: 'desc' },
      take: limit,
      include: {
        character: {
          select: {
            id: true,
            name: true,
            class: true,
            level: true,
          },
        },
      },
    });
  }

  calculateRatingChange(winnerRating: number, loserRating: number): { winnerChange: number; loserChange: number } {
    const kFactor = 32;
    const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));

    const winnerChange = Math.round(kFactor * (1 - expectedWinner));
    const loserChange = Math.round(kFactor * (0 - expectedLoser));

    return { winnerChange, loserChange };
  }

  async isMatchValid(matchId: string, characterId: string): Promise<boolean> {
    const match = await prisma.pvpMatch.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return false;
    }

    return match.challengerId === characterId || match.opponentId === characterId;
  }

  async getActiveMatches(characterId: string): Promise<PvpMatch[]> {
    return prisma.pvpMatch.findMany({
      where: {
        OR: [
          { challengerId: characterId },
          { opponentId: characterId },
        ],
        status: { in: [BattleStatus.PENDING, BattleStatus.ACTIVE] },
      },
      include: {
        challenger: true,
        opponent: true,
      },
    });
  }

  async forfeitMatch(matchId: string, characterId: string): Promise<PvPMatchResult> {
    const match = await prisma.pvpMatch.findUnique({
      where: { id: matchId },
      include: {
        challenger: true,
        opponent: true,
      },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    if (match.status !== BattleStatus.ACTIVE) {
      throw new Error('Match is not active');
    }

    const isChallenger = match.challengerId === characterId;
    const isOpponent = match.opponentId === characterId;

    if (!isChallenger && !isOpponent) {
      throw new Error('Character is not part of this match');
    }

    const winner = isChallenger ? match.opponent : match.challenger;
    const loser = isChallenger ? match.challenger : match.opponent;

    if (!winner || !loser) {
      throw new Error('Character data not found');
    }

    const ratingChanges = this.calculateRatingChange(
      (await this.getCharacterRating(winner.id))?.rating || 1000,
      (await this.getCharacterRating(loser.id))?.rating || 1000
    );

    await this.updateRating(winner.id, ratingChanges.winnerChange);
    await this.updateRating(loser.id, ratingChanges.loserChange);

    const updatedMatch = await prisma.pvpMatch.update({
      where: { id: matchId },
      data: {
        status: BattleStatus.FINISHED,
        winnerId: winner.id,
        ratingDelta: ratingChanges.winnerChange,
        log: [...(match.log as string[]), `${loser.name} forfeited the match!`],
      },
    });

    return {
      match: updatedMatch,
      winner,
      loser,
      ratingChanges: {
        winner: ratingChanges.winnerChange,
        loser: ratingChanges.loserChange,
      },
    };
  }
}
