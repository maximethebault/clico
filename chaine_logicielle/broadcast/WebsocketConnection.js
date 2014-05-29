var inherit = require('inherit');
var _ = require('underscore');
var User = require('../User');

var WebsocketConnection = inherit({
    __constructor: function(connection) {
        this.connection = connection;
        // l'utilisateur qui a initié cette connexion
        this.user = null;
        // booléen indiquant si on est en mode admin (si on reçoit des notifications pour TOUS les Model3d)
        this.adminMode = false;
        // on ajoute la connexion au tableau les recensant :
        this.__self.tabConnections.push(this);
        this.bindEvents();
    },
    login: function(data) {
        var self = this;
        if(!data.user_id) {
            console.error('[WebsocketConnection] User_id manquant lors d\'une tentative d\'identification.');
            self.connection.close();
            return;
        }
        User.get({id: data.user_id}, function(err, res) {
            if(err) {
                console.error('[WebsocketConnection] Mauvais user_id.');
                self.connection.close();
                return;
            }
            var user = res[0];
            if(!user.verify(data.password)) {
                console.error('[WebsocketConnection] Mauvais mot de passe.');
                self.connection.close();
                return;
            }
            self.user = user;
            self.sendNotification({
                ack: 'login'
            });
        });
    },
    admin: function() {
        if(this.user && this.user._attrs.admin)
            this.adminMode = true;
        else
            this.connection.close();
    },
    sendNotification: function(message) {
        this.connection.sendUTF(JSON.stringify(message));
    },
    bindEvents: function() {
        this.connection.on('message', this.onMessage.bind(this));
        this.connection.on('close', this.onClose.bind(this));
    },
    onMessage: function(message) {
        if(message.type === 'utf8') {
            var messageData = JSON.parse(message.utf8Data);
            // on va rediriger le message vers la bonne méthode en fonction de l'action
            if(messageData.action == 'login') {
                this.login(messageData);
            }
            else if(messageData.action == 'admin') {
                this.admin(messageData);
            }
            else
                console.error('[WebsocketConnection] Action inconnue : ' + messageData.action + '.');
        }
        else
            console.error('[WebsocketConnection] Format du message inconnu : ' + message.type + '.');
    },
    onClose: function(reasonCode, description) {
        this.__self.tabConnections.splice(this.__self.tabConnections.indexOf(this), 1);
    }
}, {
    tabConnections: [],
    sendNotification: function(user_id, message) {
        _.forEach(this.tabConnections, function(connection) {
            if((connection.user && connection.user._attrs.id === user_id) || connection.adminMode) {
                connection.sendNotification(message);
            }
        });
    }
});

module.exports = WebsocketConnection;