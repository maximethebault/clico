var nodemailer = require("nodemailer");

var Constants = {
    COMMAND_PAUSE: 0,
    COMMAND_RUN: 1,
    COMMAND_STOP: 2,
    STATE_PAUSED: 0,
    STATE_RUNNING: 1,
    STATE_STOPPED: 2,
    // Le nombre de points au-desus duquel on arrêtera le traitement.
    // A adapter en fonction des capacités de la machine sur laquelle tourne la chaîne logicielle.
    MAX_POINT_LIMIT: 9000000,
    WEBSOCKET_HOST: 'localhost',
    MYSQL_HOST: 'localhost',
    MYSQL_USER: 'root',
    MYSQL_PASSWORD: '',
    MYSQL_DB: 'cnpao',
    // Les mails seront livrés directement au MTA des destinataires - à changer
    // les différents transports configurables sont disponibles à cette adresse :
    // http://www.nodemailer.com/docs/transports
    TRANSPORT: nodemailer.createTransport("Direct"),
    // à configurer pour que l'envoi des mails soit effectif
    ADMIN_ADRESS: '',
    // le message envoyé à l'utilisateur à la fin de la génération d'un modèle
    GENERATION_END_MESSAGE: "<html><body>Bonjour,<br /><br />La génération de votre modèle 3D est terminée et est dès à présent téléchargeable sur le site de cliCo !<br /><br />Cordialement,<br /><br />L'équipe cliCo</body></html>",
    GENERATION_ERR_MESSAGE: "<html><body>Bonjour,<br /><br />La génération d'un modèle 3D a echoué et votre intervention est requise.<br /><br />Cordialement,<br /><br />L'équipe cliCo</body></html>"
};

module.exports = Constants;