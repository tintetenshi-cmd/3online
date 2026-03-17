import React from 'react'
import { useNavigate } from 'react-router-dom'
import Button from './ui/Button'
import './Rules.css'

const Rules: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="rules">
      <div className="rules__container">
        <header className="rules__header">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="rules__back-btn"
          >
            ← Retour
          </Button>
          <h1>Règles du jeu</h1>
        </header>

        <div className="rules__content">
          <section className="rules__section">
            <h2>🎯 But du jeu</h2>
            <p>
              Le but est d'être le premier à réaliser l'une des conditions de victoire suivantes :
            </p>
            <ul>
              <li><strong>3 trios</strong> de n'importe quels numéros</li>
              <li><strong>2 trios liés</strong> (numéros consécutifs, ex: 5-6 ou 8-9)</li>
              <li><strong>Le trio de 7</strong> (victoire immédiate)</li>
            </ul>
          </section>

          <section className="rules__section">
            <h2>🃏 Matériel</h2>
            <p>
              Le jeu comprend <strong>36 cartes</strong> numérotées de 1 à 12, 
              avec 3 exemplaires de chaque numéro.
            </p>
          </section>

          <section className="rules__section">
            <h2>🎲 Mise en place</h2>
            <p>La distribution des cartes dépend du nombre de joueurs :</p>
            <div className="distribution-table">
              <div className="distribution-row">
                <span>2-3 joueurs</span>
                <span>9 cartes chacun</span>
              </div>
              <div className="distribution-row">
                <span>4 joueurs</span>
                <span>7 cartes chacun</span>
              </div>
              <div className="distribution-row">
                <span>5 joueurs</span>
                <span>6 cartes chacun</span>
              </div>
              <div className="distribution-row">
                <span>6 joueurs</span>
                <span>5 cartes chacun</span>
              </div>
            </div>
            <p>Les cartes restantes sont placées face cachée au centre de la table.</p>
          </section>

          <section className="rules__section">
            <h2>🎮 Déroulement d'un tour</h2>
            <p>À votre tour, vous devez révéler des cartes une par une pour tenter de former un trio :</p>
            
            <div className="action-types">
              <div className="action-type">
                <h3>Révéler une carte du centre</h3>
                <p>Cliquez sur une carte face cachée au centre</p>
              </div>
              
              <div className="action-type">
                <h3>Révéler la plus petite carte d'un joueur</h3>
                <p>Choisissez un joueur et révélez sa carte la plus petite</p>
              </div>
              
              <div className="action-type">
                <h3>Révéler la plus grande carte d'un joueur</h3>
                <p>Choisissez un joueur et révélez sa carte la plus grande</p>
              </div>
            </div>

            <div className="important-note">
              <h3>⚠️ Important</h3>
              <p>
                Vous ne pouvez jamais révéler une carte "du milieu" d'une main, 
                seulement la plus petite ou la plus grande !
              </p>
            </div>
          </section>

          <section className="rules__section">
            <h2>🏆 Fin du tour</h2>
            
            <div className="end-conditions">
              <div className="end-condition success">
                <h3>✅ Trio réussi</h3>
                <p>
                  Si vous révélez 3 cartes du même numéro, vous gagnez le trio ! 
                  Les cartes sont placées devant vous et vous continuez à jouer.
                </p>
              </div>
              
              <div className="end-condition failure">
                <h3>❌ Trio échoué</h3>
                <p>
                  Si vous révélez 2 numéros différents consécutivement, 
                  toutes les cartes révélées sont remises face cachée et 
                  c'est au tour du joueur suivant.
                </p>
              </div>
            </div>
          </section>

          <section className="rules__section">
            <h2>🎊 Fin de partie</h2>
            <p>La partie se termine immédiatement quand un joueur atteint l'une des conditions :</p>
            
            <div className="victory-conditions">
              <div className="victory-condition">
                <span className="victory-icon">🥇</span>
                <div>
                  <h3>Trio de 7</h3>
                  <p>Victoire immédiate</p>
                </div>
              </div>
              
              <div className="victory-condition">
                <span className="victory-icon">🏆</span>
                <div>
                  <h3>3 trios</h3>
                  <p>N'importe quels numéros</p>
                </div>
              </div>
              
              <div className="victory-condition">
                <span className="victory-icon">🔗</span>
                <div>
                  <h3>2 trios liés</h3>
                  <p>Numéros consécutifs (ex: 4-5)</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rules__section">
            <h2>🤖 Jouer contre l'IA</h2>
            <p>
              Vous pouvez ajouter des joueurs IA à vos parties avec différents niveaux :
            </p>
            <ul>
              <li><strong>Facile :</strong> L'IA fait des choix sous-optimaux</li>
              <li><strong>Normal :</strong> L'IA joue de manière équilibrée</li>
              <li><strong>Difficile :</strong> L'IA mémorise toutes les cartes révélées</li>
            </ul>
          </section>
        </div>

        <div className="rules__footer">
          <Button
            variant="primary"
            size="large"
            onClick={() => navigate('/')}
          >
            Commencer à jouer
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Rules