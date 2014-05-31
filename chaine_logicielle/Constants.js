var Constants = {
    COMMAND_PAUSE: 0,
    COMMAND_RUN: 1,
    COMMAND_STOP: 2,
    STATE_PAUSED: 0,
    STATE_RUNNING: 1,
    STATE_STOPPED: 2,
    // Le nombre de points au-desus duquel on arrêtera le traitement.
    // A adapter en fonction des capacités de la machine sur laquelle tourne la chaîne logicielle.
    MAX_POINT_LIMIT: 9000000
};

module.exports = Constants;