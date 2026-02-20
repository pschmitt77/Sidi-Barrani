/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useRef } from 'react';
import { Suit, SpecialGameType, GameType, Bid } from './types';
import type { Game } from './types';

const HomePage = ({ ws, setPlayerId, setGame, isConnected }: {
  ws: WebSocket | null;
  setPlayerId: (id: string) => void;
  setGame: (game: Game) => void;
  isConnected: boolean;
}) => {
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const handleCreateGame = () => {
    if (playerName.trim() && ws) {
      ws.send(JSON.stringify({ type: 'createGame', payload: { playerName } }));
    }
  };

  const handleJoinGame = () => {
    if (playerName.trim() && joinCode.trim() && ws) {
      ws.send(JSON.stringify({ type: 'joinGame', payload: { playerName, gameCode: joinCode } }));
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Sidi Barrani Bidding</h1>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Dein Name"
          className="w-full p-2 border rounded mb-4"
        />
                <button onClick={handleCreateGame} className="w-full bg-blue-500 text-white p-2 rounded mb-4 hover:bg-blue-600 disabled:bg-gray-400" disabled={!isConnected || !playerName.trim()}>
          Neues Spiel erstellen
        </button>
        <div className="flex items-center my-4">
            <hr className="flex-grow border-t"/>
            <span className="px-2 text-gray-500">oder</span>
            <hr className="flex-grow border-t"/>
        </div>
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toLowerCase())}
          placeholder="Spiel-Code beitreten"
          className="w-full p-2 border rounded mb-4"
          maxLength={4}
        />
                <button onClick={handleJoinGame} className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-gray-400" disabled={!isConnected || !playerName.trim() || !joinCode.trim()}>
          Spiel beitreten
        </button>
      </div>
    </div>
  );
};

const GamePage = ({ game, playerId, ws }: { game: Game, playerId: string, ws: WebSocket | null }) => {
  const isCreator = game.creatorId === playerId;

  const handleNewRound = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'newRound', payload: { gameCode: game.gameCode } }));
    }
  };

  const handleStartGame = () => {
    if (ws) {
      ws.send(JSON.stringify({ type: 'startGame', payload: { gameCode: game.gameCode } }));
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Spiel: {game.gameCode}</h1>
          {isCreator && (
            <button onClick={handleNewRound} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 ml-2">
              Neue Runde
            </button>
          )}
          {isCreator && !game.started && (
            <button onClick={handleStartGame} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Spiel starten
            </button>
          )}
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Spieler</h2>
          <ul className="list-disc list-inside bg-gray-50 p-3 rounded">
            {game.players.map(p => (
              <li key={p.id} className={`${p.id === playerId ? 'font-bold' : ''}`}>
                {p.name} {p.id === game.creatorId && '(Ersteller)'}
              </li>
            ))}
          </ul>
        </div>

        {game.started ? (
          <BiddingComponent game={game} playerId={playerId} ws={ws} />
        ) : (
          <div className="text-center text-gray-500">Das Spiel hat noch nicht begonnen.</div>
        )}
      </div>
    </div>
  );
};

const BiddingComponent = ({ game, playerId, ws }: { game: Game, playerId: string, ws: WebSocket | null }) => {
  const [selectedGameType, setSelectedGameType] = useState<GameType | ''>('');
  const [bidValue, setBidValue] = useState<number | ''>('');
  const [isMatch, setIsMatch] = useState(false);

  const handleBid = () => {
    if (!selectedGameType || (bidValue === '' && !isMatch) || !ws) return;

    const bid: Bid = {
      playerId,
      playerName: game.players.find(p => p.id === playerId)?.name || 'Unknown',
      gameType: selectedGameType,
      value: isMatch ? 'Match' : (bidValue as number),
    };

    ws.send(JSON.stringify({ type: 'placeBid', payload: { gameCode: game.gameCode, bid } }));
    // Reset form
    setSelectedGameType('');
    setBidValue('');
    setIsMatch(false);
  };

  const bidValues = Array.from({ length: (150 - 10) / 10 + 1 }, (_, i) => 10 + i * 10);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Bieten</h2>
      <div className="grid grid-cols-2 gap-2 mb-2">
        {(Object.values(Suit) as GameType[]).concat(Object.values(SpecialGameType)).map(gt => (
          <button key={gt} onClick={() => setSelectedGameType(gt)} className={`p-2 rounded text-white ${selectedGameType === gt ? 'bg-indigo-600' : 'bg-indigo-400'}`}>
            {gt}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-2">
        <select value={bidValue} onChange={e => setBidValue(Number(e.target.value))} className="flex-grow p-2 border rounded" disabled={isMatch}>
          <option value="" disabled>Wert</option>
          {bidValues.map(val => <option key={val} value={val}>{val}</option>)}
        </select>
        <label className="flex items-center gap-2 p-2 border rounded">
          <input type="checkbox" checked={isMatch} onChange={e => setIsMatch(e.target.checked)} />
          Match
        </label>
      </div>
      <button onClick={handleBid} className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600" disabled={!selectedGameType || (bidValue === '' && !isMatch)}>
        Bieten
      </button>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Aktuelle Gebote</h3>
        <ul className="list-disc list-inside bg-gray-50 p-3 rounded mt-2">
          {game.bids.map((b, i) => (
            <li key={i}>{b.playerName}: {b.gameType} {b.value}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = window.location.origin.replace(/^http/, 'ws');
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };
    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'gameCreated':
        case 'gameJoined':
          setGame(data.game);
          setPlayerId(data.playerId);
          setError(null);
          break;
        case 'gameStateUpdate':
          setGame(data.game);
          break;
        case 'error':
          setError(data.message);
          break;
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  if (error) {
    // Simple error display, could be a toast notification
    alert(error);
    setError(null);
  }

  if (!game || !playerId) {
    return <HomePage ws={ws.current} setPlayerId={setPlayerId} setGame={setGame} isConnected={isConnected} />;
  }

  return <GamePage game={game} playerId={playerId} ws={ws.current} />;
}
