var WebSocketServer = require('websocket').server;
var http = require('http');
var inherit = require('inherit');
var Constants = require('../Constants');
var WebsocketConnection = require('./WebsocketConnection');

var WebsocketManager = inherit({
    __constructor: function() {
        var server = http.createServer(function(request, response) {
            console.log((new Date()) + ' Received request for ' + request.url);
            response.writeHead(404);
            response.end();
        });
        server.listen(8080, Constants.WEBSOCKET_HOST);

        this.wsServer = new WebSocketServer({
            httpServer: server,
            autoAcceptConnections: false
        });
        this.bindEvents();
    },
    bindEvents: function() {
        this.wsServer.on('request', this.onRequest.bind(this));
    },
    onRequest: function(request) {
        if(!this.__self.originIsAllowed(request.origin)) {
            // On rejette les connexions depuis des origines inconnues
            request.reject();
            console.log('[WebsocketServer] Connexion depuis ' + request.origin + ' rejetée.');
            return;
        }
        new WebsocketConnection(request.accept(null, request.origin));
    }
}, {
    originIsAllowed: function(origin) {
        // TODO: code pour vérifier que l'origine est bien celle attendue (vérification nom de domaine)
        return true;
    }
});

module.exports = WebsocketManager;