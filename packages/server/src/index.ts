/**
 * Point d'entrée du serveur 3online
 * Initialise et connecte tous les composants
 */

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GameEngine } from './game/GameEngine.js';
import { RoomManager } from './room/RoomManager.js';
import { AIEngine } from './ai/AIEngine.js';
import { WebSocketGateway } from './websocket/WebSocketGateway.js';

// Configuration
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveClientDistPath(): string | null {
  const candidates = [
    // Render (build in repo)
    path.resolve(process.cwd(), 'packages/client/dist'),
    // Dockerfile runner stage copies Vite dist here
    path.resolve(process.cwd(), 'client'),
    // Fallback if running from packages/server/dist with repo layout
    path.resolve(__dirname, '../../client/dist'),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) return candidate;
    } catch {
      // ignore
    }
  }
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
    
    // Initialiser les composants
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

  /**
   * Configure les middlewares Express
   */
  private setupMiddleware(): void {
    // CORS simple
    this.app.use((req, res, next) => {
      const origin = req.headers.origin;
      const isLocalOrigin =
        typeof origin === 'string' &&
        (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin));

      const allowOrigin =
        // Dev local (Vite peut changer de port)
        isLocalOrigin ? origin :
        // URL explicitement configurée (prod)
        (typeof origin === 'string' && CLIENT_URL && origin === CLIENT_URL) ? origin :
        // En prod, être permissif pour éviter les blocages CORS sur Render/preview domains
        (NODE_ENV === 'production' ? origin : CLIENT_URL);

      if (allowOrigin) res.header('Access-Control-Allow-Origin', allowOrigin);
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Parsing JSON
    this.app.use(express.json());

    // Logging des requêtes
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Configure les routes REST
   */
  private setupRoutes(): void {
    // Route de santé
    this.app.get('/health', (req, res) => {
      const roomStats = this.roomManager.getStats();
      const connectionStats = this.webSocketGateway.getConnectionStats();
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        stats: {
          rooms: roomStats,
          connections: connectionStats,
        },
      });
    });

    // Route d'information sur le serveur
    this.app.get('/info', (req, res) => {
      res.json({
        name: '3online Server',
        version: '1.0.0',
        description: 'Serveur pour le jeu de cartes 3online',
        features: [
          'Multijoueur temps réel',
          'Intelligence artificielle',
          'Chat intégré',
          'Reconnexion automatique',
        ],
      });
    });

    // Route pour obtenir les statistiques détaillées
    this.app.get('/stats', (req, res) => {
      const roomStats = this.roomManager.getStats();
      const connectionStats = this.webSocketGateway.getConnectionStats();
      
      res.json({
        rooms: roomStats,
        connections: connectionStats,
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          platform: process.platform,
          nodeVersion: process.version,
        },
      });
    });

    // Route pour les métriques (format simple)
    this.app.get('/metrics', (req, res) => {
      const roomStats = this.roomManager.getStats();
      const connectionStats = this.webSocketGateway.getConnectionStats();
      const memUsage = process.memoryUsage();
      
      const metrics = [
        `# HELP rooms_total Total number of rooms`,
        `# TYPE rooms_total gauge`,
        `rooms_total ${roomStats.totalRooms}`,
        ``,
        `# HELP rooms_active Number of active rooms`,
        `# TYPE rooms_active gauge`,
        `rooms_active ${roomStats.activeRooms}`,
        ``,
        `# HELP players_total Total number of players`,
        `# TYPE players_total gauge`,
        `players_total ${roomStats.totalPlayers}`,
        ``,
        `# HELP connections_total Total WebSocket connections`,
        `# TYPE connections_total gauge`,
        `connections_total ${connectionStats.totalConnections}`,
        ``,
        `# HELP memory_usage_bytes Memory usage in bytes`,
        `# TYPE memory_usage_bytes gauge`,
        `memory_usage_bytes{type="rss"} ${memUsage.rss}`,
        `memory_usage_bytes{type="heapTotal"} ${memUsage.heapTotal}`,
        `memory_usage_bytes{type="heapUsed"} ${memUsage.heapUsed}`,
        ``,
        `# HELP uptime_seconds Server uptime in seconds`,
        `# TYPE uptime_seconds counter`,
        `uptime_seconds ${process.uptime()}`,
      ].join('\n');

      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    });

    // Servir le client (Vite build) en production
    const clientDistPath = resolveClientDistPath();
    if (clientDistPath) {
      this.app.use(express.static(clientDistPath));

      // SPA fallback (React Router)
      this.app.get('*', (req, res, next) => {
        // Laisser les routes API/health/etc répondre en JSON (déjà définies au-dessus)
        // Ici, on ne fallback que pour les requêtes GET "HTML" (navigations)
        const accept = req.headers.accept || '';
        if (typeof accept === 'string' && accept.includes('text/html')) {
          res.sendFile(path.join(clientDistPath, 'index.html'));
          return;
        }
        next();
      });
    }

    // Route 404 pour les routes non trouvées
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route non trouvée',
        path: req.originalUrl,
        method: req.method,
      });
    });

    // Gestionnaire d'erreurs global
    this.app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Erreur serveur:', err);
      
      res.status(500).json({
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue',
      });
    });
  }

  /**
   * Configure les tâches de nettoyage périodiques
   */
  private setupCleanupTasks(): void {
    // Nettoyage toutes les 5 minutes
    setInterval(() => {
      console.log('Exécution du nettoyage périodique...');
      
      try {
        this.roomManager.cleanup();
        this.aiEngine.cleanup();
        this.webSocketGateway.cleanup();
        
        console.log('Nettoyage terminé');
      } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Affichage des statistiques toutes les 10 minutes
    setInterval(() => {
      const roomStats = this.roomManager.getStats();
      const connectionStats = this.webSocketGateway.getConnectionStats();
      
      console.log('=== Statistiques du serveur ===');
      console.log(`Salles: ${roomStats.totalRooms} (${roomStats.activeRooms} actives)`);
      console.log(`Joueurs: ${roomStats.totalPlayers} (moyenne: ${roomStats.averagePlayersPerRoom}/salle)`);
      console.log(`Connexions: ${connectionStats.totalConnections} (${connectionStats.authenticatedPlayers} authentifiées)`);
      console.log(`Mémoire: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      console.log('===============================');
    }, 10 * 60 * 1000); // 10 minutes
  }

  /**
   * Démarre le serveur
   */
  public start(): void {
    this.httpServer.listen(PORT, () => {
      console.log(`🚀 Serveur 3online démarré sur le port ${PORT}`);
      console.log(`📡 WebSocket prêt pour les connexions`);
      console.log(`🌐 Client autorisé: ${CLIENT_URL}`);
      console.log(`📊 Santé du serveur: http://localhost:${PORT}/health`);
      console.log(`📈 Statistiques: http://localhost:${PORT}/stats`);
    });

    // Gestion de l'arrêt propre
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
  }

  /**
   * Arrête le serveur proprement
   */
  private shutdown(signal: string): void {
    console.log(`\n🛑 Arrêt du serveur (signal: ${signal})`);
    
    this.httpServer.close(() => {
      console.log('✅ Serveur HTTP fermé');
      
      // Nettoyer les ressources
      try {
        this.roomManager.cleanup();
        this.aiEngine.cleanup();
        this.webSocketGateway.cleanup();
        console.log('✅ Ressources nettoyées');
      } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
      }
      
      console.log('👋 Arrêt terminé');
      process.exit(0);
    });

    // Forcer l'arrêt après 10 secondes
    setTimeout(() => {
      console.log('⚠️  Arrêt forcé après timeout');
      process.exit(1);
    }, 10000);
  }
}

// Démarrer le serveur
const server = new Server();
server.start();