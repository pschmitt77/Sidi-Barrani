import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Game } from './src/types.js';

const games = new Map<string, Game>();
const clients = new Map<WebSocket, { playerId: string; gameCode: string }>();

function generateGameCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return games.has(code) ? generateGameCode() : code;
}

function broadcastGameState(gameCode: string) {
  const game = games.get(gameCode);
  if (!game) return;
  const gameState = JSON.stringify({ type: 'gameStateUpdate', game });
  clients.forEach((info, client) => {
    if (info.gameCode === gameCode && client.readyState === WebSocket.OPEN) {
      client.send(gameState);
    }
  });
}

async function createServer() {
  const app = express();
  
  // Stellt sicher, dass Express erkennt, wenn es hinter einem Proxy (Cloud Run, Plesk/Nginx) läuft
  app.set('trust proxy', 1);

  // Automatische Umleitung von HTTP auf HTTPS in Produktion
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        const { type, payload } = data;

        switch (type) {
          case 'createGame': {
            const { playerName } = payload;
            const playerId = `player_${Math.random().toString(36).slice(2, 9)}`;
            const gameCode = generateGameCode();
            const newGame: Game = {
              gameCode,
              players: [{ id: playerId, name: playerName }],
              bids: [],
              creatorId: playerId,
              started: false,
            };
            games.set(gameCode, newGame);
            clients.set(ws, { playerId, gameCode });
            ws.send(JSON.stringify({ type: 'gameCreated', game: newGame, playerId }));
            break;
          }
          case 'startGame': {
            const { gameCode } = payload;
            const game = games.get(gameCode);
            // Basic validation: only creator can start
            // In a real app, you'd check against the player's ID from the websocket connection
            if (game) {
              game.started = true;
              broadcastGameState(gameCode);
            } else {
              // Handle game not found
            }
            break;
          }
          case 'placeBid': {
            const { gameCode, bid } = payload;
            const game = games.get(gameCode);
            if (game && game.started) {
              game.bids.push(bid);
              broadcastGameState(gameCode);
            } else {
              // Handle error: game not found or not started
            }
            break;
          }
          case 'newRound': {
            const { gameCode } = payload;
            const game = games.get(gameCode);
            // Add validation to ensure only creator can start a new round
            if (game) {
              game.bids = [];
              broadcastGameState(gameCode);
            } else {
              // Handle game not found
            }
            break;
          }
          case 'joinGame': {
            const { gameCode, playerName } = payload;
            const game = games.get(gameCode);
            if (game) {
              if (game.players.length >= 4) {
                ws.send(JSON.stringify({ type: 'error', message: 'Game is full' }));
                return;
              }
              const playerId = `player_${Math.random().toString(36).slice(2, 9)}`;
              game.players.push({ id: playerId, name: playerName });
              clients.set(ws, { playerId, gameCode });
              ws.send(JSON.stringify({ type: 'gameJoined', game, playerId }));
              broadcastGameState(gameCode);
            } else {
              ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
            }
            break;
          }
        }
      } catch (error) {
        console.error('Failed to handle message:', error);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      const clientInfo = clients.get(ws);
      if (clientInfo) {
        const { gameCode, playerId } = clientInfo;
        const game = games.get(gameCode);
        if (game) {
          game.players = game.players.filter(p => p.id !== playerId);
          if (game.players.length === 0) {
            games.delete(gameCode);
            console.log(`Game ${gameCode} deleted.`);
          } else {
            broadcastGameState(gameCode);
          }
        }
        clients.delete(ws);
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    app.use(express.static(path.join(__dirname, '../dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

createServer();
