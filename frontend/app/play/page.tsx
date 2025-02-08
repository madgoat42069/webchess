'use client';

import { useSearchParams } from 'next/navigation';
import { Chessboard } from 'react-chessboard';
import { Square } from 'chess.js';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useGame } from '../hooks/useGame';

export default function Play() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');
  const {
    fen,
    status,
    playerColor,
    isPlayerTurn,
    isCheck,
    isCheckmate,
    isDraw,
    error,
    makeMove,
    resetGame,
    isReady,
  } = useGame(roomId ?? undefined);

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/play?room=${roomId}` : '';

  function onDrop(sourceSquare: Square, targetSquare: Square) {
    return makeMove(sourceSquare, targetSquare);
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Play Chess</h1>
            {status === 'waiting' && roomId && (
              <div className="mt-2">
                <p className="text-gray-400 mb-2">Share this link with your opponent:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-[#1a1a1a] text-white px-3 py-2 rounded border border-gray-700"
                  />
                  <Button
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    variant="secondary"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}
            {error && (
              <p className="text-red-500 mt-2">{error}</p>
            )}
            <p className="text-gray-400 mt-2">
              {!isReady ? 'Connecting...' :
                status === 'waiting' ? 'Waiting for opponent...' :
                status === 'playing' ? `You are playing as ${playerColor}` :
                'Game Over'}
            </p>
            {isCheck && !isCheckmate && (
              <p className="text-yellow-500 mt-1">Check!</p>
            )}
          </div>
          
          <div className="aspect-square max-w-2xl mx-auto">
            <Chessboard 
              position={fen}
              onPieceDrop={onDrop}
              boardWidth={800}
              boardOrientation={playerColor || 'white'}
              customDarkSquareStyle={{ backgroundColor: '#4a4a4a' }}
              customLightSquareStyle={{ backgroundColor: '#2a2a2a' }}
            />
          </div>

          <div className="mt-6 flex justify-between">
            <Button
              onClick={resetGame}
              variant="danger"
              disabled={status === 'waiting' || !isReady}
            >
              New Game
            </Button>
            <div className="text-gray-300">
              {isCheckmate ? `Checkmate! ${playerColor === 'white' ? 'Black' : 'White'} wins!` :
               isDraw ? "Draw!" :
               status === 'playing' ? (isPlayerTurn ? "Your turn" : "Opponent's turn") :
               "Waiting to start"}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 