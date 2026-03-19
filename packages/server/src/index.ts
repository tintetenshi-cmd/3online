import express from 'express';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GameEngine } from './game/GameEngine.js';
import { RoomManager } from './room/RoomManager.js';
import { AIEngine } from './ai/AIEngine.js';
import { WebSocketGateway } from './websocket/WebSocketGateway.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveClientDistPath(): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'client'),
    path.resolve(__dirname, '../../../client'),
    path.resolve(__dirname, '../../client'),
    path.resolve(process.cwd(), 'packages/client/dist'),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))) {
        console.log(`✅ Client trouvé: ${candidate}`);
        return candidate;
      }
    } catch { /* ignore */ }
  }

  console.warn('⚠️  Client dist non trouvé — mode API uniquement');
  return null;
}

class Server {
  private app: express.Application;
  private httpServer: ReturnType<typeof createServer>;
  private gameEngine: GameEngine;
  private roomManager: RoomManager;
  private aiEngine: AIEngine;
  private webSocketGateway: WebSocketGateway;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.gameEngine = new GameEngine();
    this.roomManager = new RoomManager();
    this.aiEngine = new AIEngine();
    this.webSocketGateway = new WebSocketGateway(
      this.httpServer,
      this.roomManager,
      this.gameEngine,
      this.aiEngine
    );

    this.setupMiddleware();
    this.setupRoutes();
    this.setupCleanupTasks();
  }

  private setupMiddleware(): void {
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      const isLocal =
        typeof origin === 'string' &&
        (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin));

      const allowOrigin =
        isLocal ? origin :
        (typeof origin === 'string' && CLIENT_URL && origin === CLIENT_URL) ? origin :
        NODE_ENV === 'production' ? origin :
        CLIENT_URL;

      if (allowOrigin) res.header('Access-Control-Allow-Origin', allowOrigin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');

      if (req.method === 'OPTIONS') res.sendStatus(200);
      else next();
    });

    this.app.use(express.json());

    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        stats: {
          rooms: this.roomManager.getStats(),
          connections: this.webSocketGateway.getConnectionStats(),
        },
      });
    });

    this.app.get('/info', (req, res) => {
      res.json({
        name: '3online Server',
        version: '1.0.0',
        description: 'Serveur pour le jeu de cartes 3online',
        features: ['Multijoueur temps réel', 'Intelligence artificielle', 'Chat intégré', 'Reconnexion automatique'],
      });
    });

    this.app.get('/stats', (req, res) => {
      res.json({
        rooms: this.roomManager.getStats(),
        connections: this.webSocketGateway.getConnectionStats(),
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          platform: process.platform,
          nodeVersion: process.version,
        },
      });
    });

    this.app.get('/metrics', (req, res) => {
      const roomStats = this.roomManager.getStats();
      const connectionStats = this.webSocketGateway.getConnectionStats();
      const mem = process.memoryUsage();

      res.set('Content-Type', 'text/plain');
      res.send([
        `rooms_total ${roomStats.totalRooms}`,
        `rooms_active ${roomStats.activeRooms}`,
        `players_total ${roomStats.totalPlayers}`,
        `connections_total ${connectionStats.totalConnections}`,
        `memory_rss_bytes ${mem.rss}`,
        `memory_heap_used_bytes ${mem.heapUsed}`,
        `uptime_seconds ${process.uptime()}`,
      ].join('\n'));
    });

    const clientDistPath = resolveClientDistPath();

    if (clientDistPath) {
      this.app.use(express.static(clientDistPath, {
        maxAge: NODE_ENV === 'production' ? '1d' : 0,
      }));

      this.app.get('*', (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
      });
    } else {
      this.app.use('*', (req, res) => {
        res.status(404).json({ error: 'Route non trouvée', path: req.originalUrl });
      });
    }

    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Erreur serveur:', err);
      res.status(500).json({
        error: 'Erreur interne du serveur',
        message: NODE_ENV === 'development' ? err.message : 'Une erreur est survenue',
      });
    });
  }

  private setupCleanupTasks(): void {
    setInterval(() => {
      try {
        this.roomManager.cleanup();
        this.aiEngine.cleanup();
        this.webSocketGateway.cleanup();
      } catch (error) {
        console.error('Erreur nettoyage:', error);
      }
    }, 5 * 60 * 1000);

    setInterval(() => {
      const r = this.roomManager.getStats();
      const c = this.webSocketGateway.getConnectionStats();
      console.log(`[Stats] Salles: ${r.totalRooms} | Joueurs: ${r.totalPlayers} | Connexions: ${c.totalConnections} | Mémoire: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    }, 10 * 60 * 1000);
  }

  public start(): void {
    this.httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur 3online démarré sur le port ${PORT}`);
      console.log(`🌐 CLIENT_URL: ${CLIENT_URL}`);
      console.log(`📊 Health: http://localhost:${PORT}/health`);
    });

    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
  }

  private shutdown(signal: string): void {
    console.log(`\n🛑 Arrêt (${signal})`);
    this.httpServer.close(() => {
      try {
        this.roomManager.cleanup();
        this.aiEngine.cleanup();
        this.webSocketGateway.cleanup();
      } catch (e) {
        console.error('Erreur nettoyage shutdown:', e);
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  }
}

const server = new Server();
server.start();
