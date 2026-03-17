/**
 * Types de base pour le jeu 3online
 */
// Énumérations de base
export var CardLocation;
(function (CardLocation) {
    CardLocation["CENTER"] = "CENTER";
    CardLocation["PLAYER_HAND"] = "PLAYER_HAND";
    CardLocation["TRIO_PILE"] = "TRIO_PILE";
})(CardLocation || (CardLocation = {}));
export var ActionType;
(function (ActionType) {
    ActionType["REVEAL_CENTER_CARD"] = "REVEAL_CENTER_CARD";
    ActionType["REVEAL_PLAYER_SMALLEST"] = "REVEAL_PLAYER_SMALLEST";
    ActionType["REVEAL_PLAYER_LARGEST"] = "REVEAL_PLAYER_LARGEST";
    ActionType["END_TURN"] = "END_TURN";
})(ActionType || (ActionType = {}));
export var GameStatus;
(function (GameStatus) {
    GameStatus["WAITING"] = "WAITING";
    GameStatus["ACTIVE"] = "ACTIVE";
    GameStatus["FINISHED"] = "FINISHED";
    GameStatus["PAUSED"] = "PAUSED";
})(GameStatus || (GameStatus = {}));
export var TurnPhase;
(function (TurnPhase) {
    TurnPhase["WAITING_FOR_ACTION"] = "WAITING_FOR_ACTION";
    TurnPhase["REVEALING_CARDS"] = "REVEALING_CARDS";
    TurnPhase["TRIO_FORMED"] = "TRIO_FORMED";
    TurnPhase["TURN_ENDED"] = "TURN_ENDED";
})(TurnPhase || (TurnPhase = {}));
export var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus["CONNECTED"] = "CONNECTED";
    ConnectionStatus["DISCONNECTED"] = "DISCONNECTED";
    ConnectionStatus["RECONNECTING"] = "RECONNECTING";
})(ConnectionStatus || (ConnectionStatus = {}));
export var AIDifficulty;
(function (AIDifficulty) {
    AIDifficulty["EASY"] = "EASY";
    AIDifficulty["MEDIUM"] = "MEDIUM";
    AIDifficulty["HARD"] = "HARD";
})(AIDifficulty || (AIDifficulty = {}));
export var AvatarType;
(function (AvatarType) {
    AvatarType["GENERATED"] = "GENERATED";
    AvatarType["AVATAR_1"] = "AVATAR_1";
    AvatarType["AVATAR_2"] = "AVATAR_2";
    AvatarType["AVATAR_3"] = "AVATAR_3";
    AvatarType["AVATAR_4"] = "AVATAR_4";
    AvatarType["AVATAR_5"] = "AVATAR_5";
    AvatarType["AVATAR_6"] = "AVATAR_6";
    AvatarType["AVATAR_7"] = "AVATAR_7";
    AvatarType["AVATAR_8"] = "AVATAR_8";
    AvatarType["AVATAR_9"] = "AVATAR_9";
    AvatarType["AVATAR_10"] = "AVATAR_10";
    AvatarType["AVATAR_11"] = "AVATAR_11";
    AvatarType["AVATAR_12"] = "AVATAR_12";
})(AvatarType || (AvatarType = {}));
export var VictoryCondition;
(function (VictoryCondition) {
    VictoryCondition["NONE"] = "NONE";
    VictoryCondition["TRIO_SEVEN"] = "TRIO_SEVEN";
    VictoryCondition["THREE_TRIOS"] = "THREE_TRIOS";
    VictoryCondition["LINKED_TRIOS"] = "LINKED_TRIOS";
})(VictoryCondition || (VictoryCondition = {}));
// Types pour les résultats de tour
export var TurnResultType;
(function (TurnResultType) {
    TurnResultType["VICTORY"] = "VICTORY";
    TurnResultType["TRIO_SUCCESS"] = "TRIO_SUCCESS";
    TurnResultType["TURN_END"] = "TURN_END";
    TurnResultType["CONTINUE_TURN"] = "CONTINUE_TURN";
})(TurnResultType || (TurnResultType = {}));
// Types pour les salles de jeu
export var GameMode;
(function (GameMode) {
    GameMode["SIMPLE"] = "SIMPLE";
    GameMode["PICANTE"] = "PICANTE";
    GameMode["TEAM"] = "TEAM";
})(GameMode || (GameMode = {}));
export var RoomStatus;
(function (RoomStatus) {
    RoomStatus["WAITING"] = "WAITING";
    RoomStatus["IN_GAME"] = "IN_GAME";
    RoomStatus["FINISHED"] = "FINISHED";
})(RoomStatus || (RoomStatus = {}));
// Configuration IA par difficulté
export const AI_DIFFICULTY_CONFIGS = {
    [AIDifficulty.EASY]: {
        aggressiveness: 0.3,
        patience: 0.2,
        memory: 0.4,
        riskTolerance: 0.7,
    },
    [AIDifficulty.MEDIUM]: {
        aggressiveness: 0.6,
        patience: 0.5,
        memory: 0.7,
        riskTolerance: 0.4,
    },
    [AIDifficulty.HARD]: {
        aggressiveness: 0.8,
        patience: 0.8,
        memory: 0.95,
        riskTolerance: 0.2,
    },
};
