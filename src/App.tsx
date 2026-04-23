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
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');

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
        
        {mode === 'select' && (
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => setMode('create')}
              className="w-full bg-blue-500 text-white py-4 px-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors shadow-sm"
              disabled={!isConnected}
            >
              Neues Spiel eröffnen
            </button>
            <button 
              onClick={() => setMode('join')}
              className="w-full bg-green-500 text-white py-4 px-2 rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-sm"
              disabled={!isConnected}
            >
              Einem Spiel beitreten
            </button>
            {!isConnected && (
              <p className="text-center text-red-500 text-sm">Verbindung zum Server wird aufgebaut...</p>
            )}
          </div>
        )}

        {mode === 'create' && (
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-center">Spiel eröffnen</h2>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Dein Name"
              className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
            <button 
              onClick={handleCreateGame} 
              className="w-full bg-blue-500 text-white p-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 mb-4" 
              disabled={!isConnected || !playerName.trim()}
            >
              Spiel erstellen
            </button>
            <button 
              onClick={() => setMode('select')}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              &larr; Zurück
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold mb-4 text-center">Spiel beitreten</h2>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Dein Name"
              className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-green-500 outline-none"
              autoFocus
            />
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toLowerCase())}
              placeholder="4-stelliger Spiel-Code"
              className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-green-500 outline-none text-center font-mono text-xl tracking-widest"
              maxLength={4}
            />
            <button 
              onClick={handleJoinGame} 
              className="w-full bg-green-500 text-white p-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-400 mb-4" 
              disabled={!isConnected || !playerName.trim() || !joinCode.trim()}
            >
              Beitreten
            </button>
            <button 
              onClick={() => setMode('select')}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              &larr; Zurück
            </button>
          </div>
        )}
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
  const [bidValue, setBidValue] = useState<number | 'Match'>('');

  // Helper zum Vergleich von Werten
  const getNumericValue = (val: BidValue): number => {
    if (val === 'Match') return 157;
    if (val === 'Pass') return -1;
    return val;
  };

  // Höchstes aktuelles Gebat finden (Pass ignorieren)
  const currentHighestValue = Math.max(
    ...game.bids
      .filter(b => b.value !== 'Pass')
      .map(b => getNumericValue(b.value)),
    0
  );

  // Liste aller möglichen Werte
  const allValues: (number | 'Match')[] = [
    ...Array.from({ length: 15 }, (_, i) => (i + 1) * 10),
    'Match'
  ];

  // Nur Werte erlauben, die höher als das aktuelle Gebot sind
  const availableValues = allValues.filter(val => getNumericValue(val) > currentHighestValue);

  // Automatische Vorauswahl des nächsten Wertes
  useEffect(() => {
    if (availableValues.length > 0) {
      // Wenn nichts gewählt oder das Gewählte nicht mehr gültig ist: Nächsthöheren wählen
      if (bidValue === '' || getNumericValue(bidValue) <= currentHighestValue) {
        setBidValue(availableValues[0]);
      }
    } else if (currentHighestValue >= 157) {
      setBidValue('');
    }
  }, [currentHighestValue, availableValues, bidValue]);

  const handleBid = (isPass: boolean = false) => {
    if (!ws) return;

    if (isPass) {
      const passBid: Bid = {
        playerId,
        playerName: game.players.find(p => p.id === playerId)?.name || 'Unknown',
        gameType: Suit.ROSEN, // Dummy suit for Pass
        value: 'Pass',
      };
      ws.send(JSON.stringify({ type: 'placeBid', payload: { gameCode: game.gameCode, bid: passBid } }));
      return;
    }

    if (!selectedGameType || bidValue === '') return;

    const bid: Bid = {
      playerId,
      playerName: game.players.find(p => p.id === playerId)?.name || 'Unknown',
      gameType: selectedGameType,
      value: bidValue,
    };

    ws.send(JSON.stringify({ type: 'placeBid', payload: { gameCode: game.gameCode, bid } }));
    // Reset selection where appropriate, but keep auto-suggest working
    setSelectedGameType('');
  };

  const getSuitColor = (suit: string) => {
    switch (suit) {
      case 'Eicheln': return 'bg-[#1b4332] hover:bg-[#2d6a4f]'; // Dunkelgrün
      case 'Schellen': return 'bg-[#f9a825] hover:bg-[#fbc02d] text-black'; // Goldgelb
      case 'Schilten': return 'bg-[#00509d] hover:bg-[#003f88]'; // Blau
      case 'Rosen': return 'bg-[#9d0208] hover:bg-[#6a040f]'; // Rot
      default: return 'bg-gray-600 hover:bg-gray-700'; // Obeabe / Uneufe
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Bieten</h2>
      <div className="grid grid-cols-2 gap-2 mb-2">
        {(Object.values(Suit) as GameType[]).concat(Object.values(SpecialGameType)).map(gt => (
          <button 
            key={gt} 
            onClick={() => setSelectedGameType(gt)} 
            className={`p-3 rounded-lg text-white font-bold transition-all transform active:scale-95 shadow-sm ${selectedGameType === gt ? 'ring-4 ring-black ring-opacity-50' : ''} ${getSuitColor(gt as string)}`}
          >
            {gt}
          </button>
        ))}
      </div>
      <div className="mb-4">
        <select 
          value={bidValue} 
          onChange={e => {
            const val = e.target.value;
            setBidValue(val === 'Match' ? 'Match' : Number(val));
          }} 
          className="w-full p-3 border-2 rounded-lg bg-white font-semibold outline-none focus:border-indigo-500" 
          disabled={availableValues.length === 0}
        >
          <option value="" disabled>Wert wählen...</option>
          {availableValues.map(val => (
            <option key={val} value={val}>{val === 'Match' ? 'Match (157)' : val}</option>
          ))}
        </select>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={() => handleBid(true)} 
          className="flex-1 bg-gray-400 text-white p-4 rounded-xl font-bold text-lg hover:bg-gray-500 transition-all shadow-md active:scale-95"
        >
          Ich passe
        </button>
        <button 
          onClick={() => handleBid(false)} 
          className="flex-[2] bg-slate-800 text-white p-4 rounded-xl font-bold text-lg hover:bg-slate-900 transition-all shadow-md active:scale-95 disabled:opacity-50" 
          disabled={!selectedGameType || bidValue === '' || availableValues.length === 0}
        >
          Bieten
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold border-b-2 border-gray-100 pb-2 mb-3 px-1 flex items-center">
          <span className="mr-2">📋</span> Aktuelle Gebote
        </h3>
        <div className="space-y-2">
          {game.bids.length === 0 ? (
            <p className="text-gray-400 italic text-center py-4 bg-gray-50 rounded-lg">Noch keine Gebote vorhanden</p>
          ) : (
            game.bids.map((b, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-lg border-l-4 shadow-sm flex justify-between items-center ${
                  b.playerId === playerId ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-gray-300'
                } ${b.value === 'Pass' ? 'opacity-60' : ''}`}
              >
                <span className="font-bold">{b.playerName}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-mono font-bold ${b.value === 'Pass' ? 'bg-gray-200 text-gray-500' : 'bg-gray-100'}`}>
                  {b.value === 'Pass' ? 'Passe' : `${b.gameType} ${b.value === 'Match' ? 'Match' : b.value}`}
                </span>
              </div>
            )).reverse() 
          )}
        </div>
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
    // Erkennt automatisch ob ws:// oder wss:// genutzt werden muss
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${wsProtocol}//${window.location.host}`);
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
