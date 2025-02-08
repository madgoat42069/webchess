import { Chess, Move, Square } from 'chess.js';
import { Socket } from 'socket.io-client';

export type GameStatus = 'waiting' | 'playing' | 'finished';
export type PlayerColor = 'white' | 'black';

interface GameState {
  fen: string;
  status: GameStatus;
  playerColor?: PlayerColor;
  isPlayerTurn: boolean;
  lastMove?: Move;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
}

export class GameManager {
  private chess: Chess;
  private socket: Socket;
  private roomId?: string;
  private playerColor?: PlayerColor;
  private onStateChange: (state: GameState) => void;

  constructor(socket: Socket, onStateChange: (state: GameState) => void) {
    this.chess = new Chess();
    this.socket = socket;
    this.onStateChange = onStateChange;
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('gameCreated', ({ roomId, color }) => {
      this.roomId = roomId;
      this.playerColor = color;
      this.emitState('waiting');
    });

    this.socket.on('gameStart', () => {
      this.emitState('playing');
    });

    this.socket.on('move', (move) => {
      this.makeMove(move);
    });
  }

  private emitState(status: GameStatus) {
    const state: GameState = {
      fen: this.chess.fen(),
      status,
      playerColor: this.playerColor,
      isPlayerTurn: this.isPlayerTurn(),
      lastMove: this.chess.history({ verbose: true }).pop(),
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isDraw: this.chess.isDraw(),
    };
    this.onStateChange(state);
  }

  private isPlayerTurn(): boolean {
    if (!this.playerColor) return false;
    return (this.chess.turn() === 'w' && this.playerColor === 'white') ||
           (this.chess.turn() === 'b' && this.playerColor === 'black');
  }

  public createGame() {
    this.socket.emit('createGame');
  }

  public joinGame(roomId: string) {
    this.socket.emit('joinGame', roomId);
    this.roomId = roomId;
  }

  public makeMove(from: Square, to: Square): boolean {
    if (!this.isPlayerTurn()) return false;

    try {
      const move = this.chess.move({ from, to, promotion: 'q' });
      if (move && this.roomId) {
        this.socket.emit('move', { roomId: this.roomId, move });
        this.emitState('playing');
        
        if (this.chess.isGameOver()) {
          this.socket.emit('gameOver', {
            roomId: this.roomId,
            result: this.chess.isCheckmate() ? 'checkmate' : 'draw'
          });
          this.emitState('finished');
        }
        return true;
      }
    } catch (e) {
      console.error('Invalid move:', e);
    }
    return false;
  }

  public reset() {
    this.chess.reset();
    this.roomId = undefined;
    this.playerColor = undefined;
    this.emitState('waiting');
  }

  public cleanup() {
    this.socket.off('gameCreated');
    this.socket.off('gameStart');
    this.socket.off('move');
  }
} 