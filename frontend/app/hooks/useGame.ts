import { useState, useEffect, useCallback } from 'react';
import { Square } from 'chess.js';
import { GameManager, GameStatus, PlayerColor } from '../lib/game';
import SocketClient from '../lib/socket';

interface GameState {
  fen: string;
  status: GameStatus;
  playerColor?: PlayerColor;
  isPlayerTurn: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  error?: string;
}

export function useGame(roomId?: string) {
  const [gameManager, setGameManager] = useState<GameManager | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    fen: 'start',
    status: 'waiting',
    isPlayerTurn: false,
    isCheck: false,
    isCheckmate: false,
    isDraw: false,
  });

  useEffect(() => {
    let mounted = true;

    const initGame = async () => {
      try {
        const socket = await SocketClient.connect();
        if (!mounted) return;

        const manager = new GameManager(socket, (state) => {
          if (mounted) {
            setGameState(state);
          }
        });

        setGameManager(manager);

        if (roomId) {
          manager.joinGame(roomId);
        } else {
          manager.createGame();
        }
      } catch (error) {
        if (mounted) {
          setGameState(prev => ({
            ...prev,
            error: 'Failed to connect to game server'
          }));
        }
      }
    };

    initGame();

    return () => {
      mounted = false;
      gameManager?.cleanup();
      SocketClient.disconnect();
    };
  }, [roomId]);

  const makeMove = useCallback((from: Square, to: Square) => {
    return gameManager?.makeMove(from, to) ?? false;
  }, [gameManager]);

  const resetGame = useCallback(() => {
    gameManager?.reset();
  }, [gameManager]);

  return {
    ...gameState,
    makeMove,
    resetGame,
    isReady: !!gameManager,
  };
} 