/**
 * Types pour la gestion des salles de jeu
 */
// Énumérations pour les salles
export var RoomStatus;
(function (RoomStatus) {
    RoomStatus["WAITING"] = "WAITING";
    RoomStatus["IN_GAME"] = "IN_GAME";
    RoomStatus["FINISHED"] = "FINISHED";
})(RoomStatus || (RoomStatus = {}));
export var GameMode;
(function (GameMode) {
    GameMode["SIMPLE"] = "SIMPLE";
    GameMode["PICANTE"] = "PICANTE";
    GameMode["TEAM"] = "TEAM";
})(GameMode || (GameMode = {}));
