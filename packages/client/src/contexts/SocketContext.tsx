import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@3online/shared';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextType {
  socket: SocketType | null;
  isConnected: boolean;
  connectionError: string | null;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionError: null,
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const serverUrl =
      import.meta.env.VITE_SERVER_URL ||
      (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

    console.log('Connexion au serveur:', serverUrl);

    const newSocket: SocketType = io(serverUrl, {
      transports: ['polling', 'websocket'], // polling en premier — plus fiable sur Render
      timeout: 20000,                       // 20s pour le cold start Render
      reconnectionAttempts: 3,              // max 3 tentatives
      reconnectionDelay: 3000,              // 3s entre chaque tentative
      reconnectionDelayMax: 15000,
      // 'retries' n'existe pas dans socket.io-client — supprimé
    });

    newSocket.on('connect', () => {
      console.log('Connecté au serveur:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Déconnecté du serveur:', reason);
      setIsConnected(false);
      // Ne pas reconnecter manuellement si le serveur a fermé — laisser socket.io gérer
    });

    newSocket.on('connect_error', (error) => {
      console.error('Erreur de connexion:', error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnecté après', attemptNumber, 'tentatives');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Erreur de reconnexion:', error.message);
      setConnectionError('Impossible de se reconnecter au serveur');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Échec de la reconnexion');
      setConnectionError('Serveur inaccessible. Rechargez la page pour réessayer.');
      newSocket.disconnect(); // stopper toute tentative supplémentaire
    });

    newSocket.on('error', (message) => {
      // signature ServerToClientEvents : error(message: string)
      console.error('Erreur du serveur:', message);
    });

    // 'notification' n'existe pas dans ServerToClientEvents — supprimé

    setSocket(newSocket);

    return () => {
      newSocket.disconnect(); // disconnect() plutôt que close()
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
};
