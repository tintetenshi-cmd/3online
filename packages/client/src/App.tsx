import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { GameProvider } from './contexts/SimpleGame'
import MainMenu from './components/MainMenu'
import GameLobby from './components/GameLobby'
import GameBoard from './components/GameBoard'
import Rules from './components/Rules'
import WorkModeToggle from './components/WorkModeToggle'
import './App.css'

function App() {
  return (
    <GameProvider>
      <div className="app">
        <WorkModeToggle className="work-mode-toggle" />
        <Routes>
          <Route path="/" element={<MainMenu />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/lobby/:roomCode?" element={<GameLobby />} />
          <Route path="/game/:roomId" element={<GameBoard />} />
        </Routes>
      </div>
    </GameProvider>
  )
}

export default App