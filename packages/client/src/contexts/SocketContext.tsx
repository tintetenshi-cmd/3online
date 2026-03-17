import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@3online/shared';

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
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
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
    // URL du serveur (configurable via variable d'environnement)
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
    
    console.log('Connexion au serveur:', serverUrl);

    // Créer la connexion Socket.IO
    const newSocket: SocketType = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      retries: 3,
    });

    // Gestionnaires d'événements de connexion
    newSocket.on('connect', () => {
      console.log('Connecté au serveur:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Déconnecté du serveur:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Le serveur a fermé la connexion, reconnecter manuellement
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Erreur de connexion:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnecté après', attemptNumber, 'tentatives');
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Erreur de reconnexion:', error);
      setConnectionError('Impossible de se reconnecter au serveur');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Échec de la reconnexion');
      setConnectionError('Connexion au serveur impossible');
    });

    // Gestionnaires d'événements du jeu
    newSocket.on('error', (message, code) => {
      console.error('Erreur du serveur:', message, code);
      // Les erreurs spécifiques au jeu seront gérées par les composants
    });

    newSocket.on('notification', (message, type) => {
      console.log(`Notification ${type}:`, message);
      // Les notifications seront gérées par les composants
    });

    setSocket(newSocket);

    // Nettoyage lors du démontage
    return () => {
      console.log('Fermeture de la connexion Socket.IO');
      newSocket.close();
    };
  }, []);

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionError,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};