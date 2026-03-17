# Document d'Exigences : 3online

## Introduction

3online est un jeu de cartes en ligne multijoueur basé sur les règles de Trio (Cocktail Games). Le système permet à 2-6 joueurs de s'affronter en temps réel via une interface web, avec support des joueurs IA. L'objectif est de former des trios (3 cartes identiques) en révélant stratégiquement des cartes du centre ou des mains adverses. Le système privilégie l'intégrité des règles, la sécurité anti-triche, et une expérience utilisateur fluide.

## Glossaire

- **Système_3online**: L'application web complète incluant client et serveur
- **Moteur_Jeu**: Composant serveur gérant la logique et les règles de Trio
- **Gestionnaire_Salles**: Composant gérant les salles de jeu et sessions joueurs
- **Moteur_IA**: Composant gérant les joueurs artificiels
- **Passerelle_WebSocket**: Composant gérant les communications temps réel
- **Joueur**: Utilisateur humain ou IA participant à une partie
- **Salle**: Espace virtuel où les joueurs se rassemblent avant et pendant une partie
- **Trio**: Combinaison de 3 cartes ayant le même numéro
- **Carte_Révélée**: Carte dont la valeur est visible par tous les joueurs
- **Tour_Actif**: Période pendant laquelle un joueur peut effectuer des actions
- **État_Jeu**: Ensemble des données représentant la situation actuelle d'une partie
- **Action_Valide**: Action respectant les règles du jeu et l'état actuel
- **Condition_Victoire**: Situation permettant à un joueur de gagner la partie
## Exigences

### Exigence 1

**User Story:** En tant que joueur, je veux créer une salle de jeu, afin de pouvoir inviter d'autres joueurs à une partie.

#### Critères d'Acceptation

1. QUAND un joueur demande la création d'une salle ALORS LE Gestionnaire_Salles DOIT créer une nouvelle salle avec un identifiant unique
2. QUAND une salle est créée ALORS LE Système_3online DOIT assigner le créateur comme hôte de la salle
3. QUAND une salle est créée ALORS LE Système_3online DOIT générer un code de salle partageable
4. QUAND une salle est créée ALORS LE Système_3online DOIT initialiser la salle avec une capacité de 2 à 6 joueurs
5. QUAND une salle est créée ALORS LE Système_3online DOIT permettre à l'hôte de configurer les paramètres de jeu

### Exigence 2

**User Story:** En tant que joueur, je veux rejoindre une salle existante, afin de participer à une partie avec d'autres joueurs.

#### Critères d'Acceptation

1. QUAND un joueur fournit un code de salle valide ALORS LE Gestionnaire_Salles DOIT l'ajouter à la salle correspondante
2. QUAND un joueur rejoint une salle ALORS LE Système_3online DOIT vérifier que la salle n'est pas pleine
3. QUAND un joueur rejoint une salle ALORS LE Système_3online DOIT vérifier que le nom du joueur est unique dans la salle
4. QUAND un joueur rejoint une salle ALORS LE Système_3online DOIT notifier tous les autres joueurs de la salle
5. SI une salle est pleine ou inexistante ALORS LE Système_3online DOIT refuser l'accès et informer le joueur
### Exigence 3

**User Story:** En tant qu'hôte de salle, je veux démarrer une partie, afin de commencer le jeu avec les joueurs présents.

#### Critères d'Acceptation

1. QUAND l'hôte demande le démarrage d'une partie ALORS LE Système_3online DOIT vérifier qu'il y a au moins 2 joueurs dans la salle
2. QUAND une partie démarre ALORS LE Moteur_Jeu DOIT distribuer les cartes selon le nombre de joueurs
3. QUAND une partie démarre ALORS LE Moteur_Jeu DOIT placer les cartes restantes au centre
4. QUAND une partie démarre ALORS LE Système_3online DOIT désigner aléatoirement le premier joueur
5. QUAND une partie démarre ALORS LE Système_3online DOIT notifier tous les joueurs du début de partie

### Exigence 4

**User Story:** En tant que joueur, je veux ajouter des joueurs IA à ma salle, afin de jouer même sans suffisamment de joueurs humains.

#### Critères d'Acceptation

1. QUAND l'hôte demande l'ajout d'une IA ALORS LE Gestionnaire_Salles DOIT créer un joueur IA avec le niveau de difficulté spécifié
2. QUAND une IA est ajoutée ALORS LE Système_3online DOIT s'assurer que le total de joueurs ne dépasse pas 6
3. QUAND une IA est ajoutée ALORS LE Système_3online DOIT assigner un nom et avatar uniques à l'IA
4. OÙ le niveau de difficulté est configuré ALORS LE Moteur_IA DOIT adapter sa stratégie de jeu en conséquence
5. QUAND une IA est supprimée ALORS LE Système_3online DOIT la retirer de la salle et notifier les autres joueurs
### Exigence 5

**User Story:** En tant que joueur, je veux révéler des cartes pendant mon tour, afin de former des trios et progresser vers la victoire.

#### Critères d'Acceptation

1. QUAND c'est le tour d'un joueur ALORS LE Moteur_Jeu DOIT permettre uniquement à ce joueur d'effectuer des actions
2. QUAND un joueur révèle une carte du centre ALORS LE Moteur_Jeu DOIT rendre cette carte visible à tous les joueurs
3. QUAND un joueur révèle la plus petite carte d'un adversaire ALORS LE Moteur_Jeu DOIT révéler la carte de valeur minimale de la main de cet adversaire
4. QUAND un joueur révèle la plus grande carte d'un adversaire ALORS LE Moteur_Jeu DOIT révéler la carte de valeur maximale de la main de cet adversaire
5. SI une action de révélation est invalide ALORS LE Moteur_Jeu DOIT rejeter l'action et maintenir l'état actuel

### Exigence 6

**User Story:** En tant que joueur, je veux former des trios, afin de gagner des points et me rapprocher de la victoire.

#### Critères d'Acceptation

1. QUAND trois cartes révélées ont le même numéro ALORS LE Moteur_Jeu DOIT former un trio pour le joueur actif
2. QUAND un trio est formé ALORS LE Moteur_Jeu DOIT retirer les cartes du jeu et les ajouter aux trios du joueur
3. QUAND un trio est formé ALORS LE Moteur_Jeu DOIT permettre au même joueur de continuer son tour
4. QUAND un trio est formé ALORS LE Système_3online DOIT notifier tous les joueurs de la formation du trio
5. SI deux cartes consécutives révélées ont des numéros différents ALORS LE Moteur_Jeu DOIT terminer le tour du joueur
### Exigence 7

**User Story:** En tant que joueur, je veux gagner la partie en remplissant une condition de victoire, afin de remporter le jeu.

#### Critères d'Acceptation

1. QUAND un joueur forme un trio de 7 ALORS LE Moteur_Jeu DOIT déclarer ce joueur vainqueur immédiatement
2. QUAND un joueur possède 3 trios quelconques ALORS LE Moteur_Jeu DOIT déclarer ce joueur vainqueur
3. QUAND un joueur possède 2 trios de numéros consécutifs ALORS LE Moteur_Jeu DOIT déclarer ce joueur vainqueur
4. QUAND une condition de victoire est remplie ALORS LE Système_3online DOIT terminer la partie et afficher le résultat
5. QUAND la partie se termine ALORS LE Système_3online DOIT permettre aux joueurs de rejouer ou quitter

### Exigence 8

**User Story:** En tant que joueur IA, je veux prendre des décisions de jeu automatiquement, afin de participer activement aux parties.

#### Critères d'Acceptation

1. QUAND c'est le tour d'une IA ALORS LE Moteur_IA DOIT analyser l'état de jeu et choisir une action valide
2. QUAND une IA prend une décision ALORS LE Moteur_IA DOIT respecter son niveau de difficulté configuré
3. QUAND une IA de niveau facile joue ALORS LE Moteur_IA DOIT faire des choix sous-optimaux occasionnellement
4. QUAND une IA de niveau difficile joue ALORS LE Moteur_IA DOIT optimiser ses décisions et mémoriser les cartes révélées
5. QUAND une IA agit ALORS LE Système_3online DOIT simuler un temps de réflexion réaliste
### Exigence 9

**User Story:** En tant que joueur, je veux recevoir les mises à jour de jeu en temps réel, afin de suivre l'évolution de la partie.

#### Critères d'Acceptation

1. QUAND l'état de jeu change ALORS LE Passerelle_WebSocket DOIT diffuser la mise à jour à tous les joueurs de la salle
2. QUAND un joueur effectue une action ALORS LE Système_3online DOIT notifier les autres joueurs dans les 300ms
3. QUAND une carte est révélée ALORS LE Système_3online DOIT synchroniser l'affichage chez tous les joueurs
4. QUAND le tour change ALORS LE Système_3online DOIT indiquer clairement quel joueur doit jouer
5. SI la connexion d'un joueur est interrompue ALORS LE Système_3online DOIT maintenir son état de jeu pendant 30 secondes

### Exigence 10

**User Story:** En tant que joueur, je veux une interface utilisateur intuitive, afin de jouer facilement et agréablement.

#### Critères d'Acceptation

1. QUAND un joueur accède au jeu ALORS LE Système_3online DOIT afficher une interface avec thème violet/noir rétro
2. QUAND c'est le tour d'un joueur ALORS LE Système_3online DOIT mettre en évidence les actions possibles
3. QUAND un joueur survole une carte ALORS LE Système_3online DOIT afficher des informations contextuelles
4. QUAND l'état de jeu change ALORS LE Système_3online DOIT utiliser des animations fluides pour les transitions
5. OÙ l'interface est responsive ALORS LE Système_3online DOIT s'adapter aux différentes tailles d'écran
### Exigence 11

**User Story:** En tant qu'administrateur système, je veux que le jeu gère correctement les erreurs, afin d'assurer une expérience stable.

#### Critères d'Acceptation

1. SI un joueur se déconnecte pendant une partie ALORS LE Système_3online DOIT maintenir son état et permettre la reconnexion
2. SI une action invalide est reçue ALORS LE Moteur_Jeu DOIT la rejeter et resynchroniser le client
3. SI l'état de jeu devient incohérent ALORS LE Système_3online DOIT détecter l'anomalie et suspendre la partie
4. QUAND une erreur survient ALORS LE Système_3online DOIT logger l'incident pour analyse
5. SI un joueur tente de tricher ALORS LE Système_3online DOIT bloquer l'action et enregistrer la tentative

### Exigence 12

**User Story:** En tant qu'utilisateur, je veux que le système soit performant, afin d'avoir une expérience de jeu fluide.

#### Critères d'Acceptation

1. QUAND un joueur effectue une action ALORS LE Système_3online DOIT répondre en moins de 300ms
2. QUAND le serveur gère plusieurs parties ALORS LE Système_3online DOIT supporter au moins 50 parties simultanées
3. QUAND une IA réfléchit ALORS LE Moteur_IA DOIT prendre sa décision en moins de 2 secondes
4. PENDANT qu'une partie est active ALORS LE Système_3online DOIT utiliser moins de 100MB de mémoire par partie
5. QUAND les messages sont transmis ALORS LE Passerelle_WebSocket DOIT utiliser la compression pour optimiser la bande passante
### Exigence 13

**User Story:** En tant qu'administrateur système, je veux que le jeu soit sécurisé, afin de protéger l'intégrité des parties.

#### Critères d'Acceptation

1. QUAND un joueur envoie des données ALORS LE Système_3online DOIT valider toutes les entrées côté serveur
2. QUAND des communications ont lieu ALORS LE Système_3online DOIT utiliser le chiffrement TLS
3. QUAND un joueur se connecte ALORS LE Système_3online DOIT limiter le taux de connexions pour prévenir les attaques
4. QUAND des noms de joueurs sont saisis ALORS LE Système_3online DOIT les assainir pour prévenir l'injection de code
5. QUAND des sessions sont créées ALORS LE Système_3online DOIT utiliser des tokens avec expiration automatique

### Exigence 14

**User Story:** En tant que développeur, je veux que le système maintienne l'intégrité des données, afin d'assurer la cohérence du jeu.

#### Critères d'Acceptation

1. POUR TOUTE partie active ALORS LE Moteur_Jeu DOIT maintenir exactement 36 cartes au total dans le système
2. POUR TOUT numéro de 1 à 12 ALORS LE Moteur_Jeu DOIT maintenir exactement 3 exemplaires de chaque carte
3. QUAND des cartes sont distribuées ALORS LE Moteur_Jeu DOIT s'assurer qu'aucune carte n'existe en double
4. QUAND un trio est formé ALORS LE Moteur_Jeu DOIT vérifier que les 3 cartes ont le même numéro
5. POUR TOUT état de jeu ALORS LE Système_3online DOIT maintenir la cohérence entre les données client et serveur