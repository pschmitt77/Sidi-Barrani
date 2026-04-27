/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { Share2 } from 'lucide-react';
import { Suit, SpecialGameType, GameType, Bid } from './types';
import type { Game, BidValue } from './types';

const HomePage = ({ socket, setPlayerId, setGame, isConnected }: {
  socket: Socket | null;
  setPlayerId: (id: string) => void;
  setGame: (game: Game) => void;
  isConnected: boolean;
}) => {
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join');
    if (joinParam) {
      setJoinCode(joinParam);
      setMode('join');
    }
  }, []);

  const handleCreateGame = () => {
    if (playerName.trim() && socket) {
      socket.emit('createGame', { playerName });
    }
  };

  const handleJoinGame = () => {
    if (playerName.trim() && joinCode.trim() && socket) {
      socket.emit('joinGame', { playerName, gameCode: joinCode });
      // clean up url after join
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-sm bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-slate-800">Sidi Barrani</h1>
        
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

const GamePage = ({ game, playerId, socket }: { game: Game, playerId: string, socket: Socket | null }) => {
  const isCreator = game.creatorId === playerId;
  const [showShareModal, setShowShareModal] = useState(false);

  const handleNewRound = () => {
    if (socket) {
      socket.emit('newRound', { gameCode: game.gameCode });
    }
  };

  const handleStartGame = () => {
    if (socket) {
      socket.emit('startGame', { gameCode: game.gameCode });
    }
  };

  const shareUrl = `${window.location.origin}?join=${game.gameCode}`;

  const handleShareClick = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Sidi Barrani',
        text: `Komm und spiel Sidi Barrani! Code: ${game.gameCode}`,
        url: shareUrl,
      }).catch(console.error);
    } else {
      setShowShareModal(true);
    }
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md relative">
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center max-w-sm w-full">
              <h3 className="text-xl font-bold mb-4">Spiel einladen</h3>
              <p className="text-gray-600 mb-6 text-center">Scan den Code oder teile den Link mit deinen Freunden</p>
              <div className="bg-white p-4 rounded-lg shadow-inner border mb-6">
                 <QRCodeSVG value={shareUrl} size={200} />
              </div>
              <p className="font-mono text-2xl font-bold tracking-widest mb-6">{game.gameCode}</p>
              <div className="flex gap-2 w-full">
                <button onClick={() => setShowShareModal(false)} className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg font-bold hover:bg-gray-300">Schliessen</button>
                {navigator.share && (
                  <button onClick={handleShareClick} className="flex-1 bg-blue-500 text-white p-3 rounded-lg font-bold hover:bg-blue-600 flex items-center justify-center gap-2">
                    <Share2 size={18} /> Teilen
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Spiel: 
              <button 
                onClick={() => setShowShareModal(true)} 
                className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors cursor-pointer group"
                title="Spiel teilen"
              >
                <span className="font-mono text-blue-600 tracking-wider">{game.gameCode}</span>
                <Share2 size={16} className="text-gray-400 group-hover:text-blue-500" />
              </button>
            </h1>
          </div>
          <div className="flex gap-2">
            {isCreator && (
              <button onClick={handleNewRound} className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded font-semibold hover:bg-yellow-600 shadow-sm">
                Neue Runde
              </button>
            )}
            {isCreator && !game.started && (
              <button onClick={handleStartGame} className="flex-1 bg-green-500 text-white px-4 py-2 rounded font-semibold hover:bg-green-600 shadow-sm">
                Spiel starten
              </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Spieler</h2>
          <div className="grid grid-cols-2 gap-2">
            {game.players.map(p => (
              <div key={p.id} className={`p-2 rounded-md bg-white shadow-sm border border-gray-200 flex items-center justify-between ${p.id === playerId ? 'font-bold text-indigo-700' : 'text-gray-700'}`}>
                <span className="truncate">{p.name}</span>
                {p.id === game.creatorId && <span className="text-[10px] uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-2">Ersteller</span>}
              </div>
            ))}
          </div>
        </div>

        {game.started ? (
          <BiddingComponent game={game} playerId={playerId} socket={socket} />
        ) : (
          <div className="text-center text-gray-500">Das Spiel hat noch nicht begonnen.</div>
        )}
      </div>
    </div>
  );
};

const BiddingComponent = ({ game, playerId, socket }: { game: Game, playerId: string, socket: Socket | null }) => {
  const [selectedGameType, setSelectedGameType] = useState<GameType | ''>('');
  const [bidValue, setBidValue] = useState<number | 'Match'>('');
  const [errorMsg, setErrorMsg] = useState('');

  // Helper zum Vergleich von Werten
  const getNumericValue = (val: BidValue): number => {
    if (val === 'Match') return 157;
    if (val === 'Pass') return -1;
    return val as number;
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
    if (!socket) return;
    setErrorMsg('');

    if (isPass) {
      const passBid: Bid = {
        playerId,
        playerName: game.players.find(p => p.id === playerId)?.name || 'Unknown',
        gameType: Suit.ROSEN, // Dummy suit for Pass
        value: 'Pass',
      };
      socket.emit('placeBid', { gameCode: game.gameCode, bid: passBid });
      return;
    }

    if (!selectedGameType) {
      setErrorMsg('Bitte wähle eine Farbe oder ein Spiel.');
      return;
    }

    if (bidValue === '') return;

    const bid: Bid = {
      playerId,
      playerName: game.players.find(p => p.id === playerId)?.name || 'Unknown',
      gameType: selectedGameType,
      value: bidValue,
    };

    socket.emit('placeBid', { gameCode: game.gameCode, bid });
    // Reset selection where appropriate, but keep auto-suggest working
    setSelectedGameType('');
  };

  const getSuitDisplay = (suit: string) => {
    switch (suit) {
      case 'Eicheln': return { color: 'bg-[#1b4332] hover:bg-[#2d6a4f] text-white', label: 'Eicheln' };
      case 'Schellen': return { color: 'bg-[#f9a825] hover:bg-[#fbc02d] text-black', label: 'Schellen' };
      case 'Schilten': return { color: 'bg-[#00509d] hover:bg-[#003f88] text-white', label: 'Schilten' };
      case 'Rosen': return { color: 'bg-[#9d0208] hover:bg-[#6a040f] text-white', label: 'Rosen' };
      case 'Obeabe': return { color: 'bg-gray-600 hover:bg-gray-700 text-white', label: 'Obeabe' };
      case 'Uneufe': return { color: 'bg-gray-600 hover:bg-gray-700 text-white', label: 'Uneufe' };
      default: return { color: 'bg-gray-600 hover:bg-gray-700 text-white', label: suit };
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Bieten</h2>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {(Object.values(Suit) as GameType[]).concat(Object.values(SpecialGameType)).map(gt => {
          const display = getSuitDisplay(gt as string);
          return (
            <button 
              key={gt} 
              onClick={() => { setSelectedGameType(gt); setErrorMsg(''); }} 
              className={`p-3 rounded-lg font-bold transition-all transform active:scale-95 shadow-sm ${selectedGameType === gt ? 'ring-4 ring-black ring-opacity-50' : ''} ${display.color}`}
            >
              {display.label}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 mb-2">
        <select 
          value={bidValue} 
          onChange={e => {
            const val = e.target.value;
            setBidValue(val === 'Match' ? 'Match' : Number(val));
          }} 
          className="flex-1 p-3 border-2 rounded-lg bg-white font-semibold outline-none focus:border-indigo-500" 
          disabled={availableValues.length === 0}
        >
          <option value="" disabled>Wert wählen...</option>
          {availableValues.map(val => (
            <option key={val} value={val}>{val === 'Match' ? 'Match (157)' : val}</option>
          ))}
        </select>
        <button 
          onClick={() => handleBid(true)} 
          className="flex-1 bg-gray-400 text-white p-3 rounded-lg font-bold hover:bg-gray-500 transition-all shadow-sm active:scale-95"
        >
          Ich passe
        </button>
      </div>
      
      {errorMsg && <p className="text-red-500 text-sm font-semibold mb-2 text-center">{errorMsg}</p>}

      <button 
        onClick={() => handleBid(false)} 
        className="w-full bg-slate-800 text-white p-3 rounded-lg font-bold hover:bg-slate-900 transition-all shadow-sm active:scale-95 disabled:opacity-50" 
        disabled={bidValue === '' || availableValues.length === 0}
      >
        Bieten
      </button>

      <div className="mt-8">
        <h3 className="text-lg font-bold border-b-2 border-gray-100 pb-2 mb-3 px-1 flex items-center">
          Aktuelle Gebote
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
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.io connected');
      setIsConnected(true);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
      setIsConnected(false);
    });

    socket.on('gameCreated', (data) => {
      setGame(data.game);
      setPlayerId(data.playerId);
      setError(null);
    });

    socket.on('gameJoined', (data) => {
      setGame(data.game);
      setPlayerId(data.playerId);
      setError(null);
    });

    socket.on('gameStateUpdate', (data) => {
      setGame(data.game);
    });

    socket.on('error', (data) => {
      setError(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (error) {
    // Simple error display, could be a toast notification
    alert(error);
    setError(null);
  }

  if (!game || !playerId) {
    return <HomePage socket={socketRef.current} setPlayerId={setPlayerId} setGame={setGame} isConnected={isConnected} />;
  }

  return <GamePage game={game} playerId={playerId} socket={socketRef.current} />;
}
