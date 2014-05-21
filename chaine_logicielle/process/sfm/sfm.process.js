var Process = require('../../Process');
var spawn = require('child_process').spawn;
var net = require('net');
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var inherit = require('inherit');
var path = require('path');
var deferred = require('deferred');
var os = require("os");
var endOfLine = os.EOL;
var globalPort = 9999;

var ProcessSFM = inherit(Process, {
    __constructor: function(attrs, model3d) {
        this.__base(attrs, model3d);
        /**
         * Le nombre d'images qui seront traitées
         */
        this.nbImages = 0;
        /**
         * Un deferred, ou promise, est un objet qui permettra de bloquer l'exécution d'un bout de code tant qu'il n'aura pas été "resolve"
         * C'est équivalent à un "join" dans une application multithreadée
         */
        this.processDeferred = deferred();
        /**
         * Contiendra le child_process VisualSFM
         */
        this.process = null;
        /**
         * Contiendra le socket pour diriger à distance l'interface graphique de VisualSFM
         */
        this.socket = null;
    },
    start: function(cb) {
        var self = this;
        self.__base(function(err) {
            cb(err);
            var port = globalPort++;
            self.process = spawn('VisualSFM', ['listen+log', port]);
            self.process.stdout.on('data', self.distributeStdout.bind(self));
            self.process.stderr.on('data', self.distributeStderr.bind(self));
            self.process.on('error', self.error.bind(self));
            self.process.on('close', self.done.bind(self));
            // on a aucune manière propre de savoir quand VisualSFM est chargé et prêt à l'emploi...
            // on opte donc pour une solution moche mais simple : on attend deux secondes.
            setTimeout(function() {
                self.socket = net.connect({port: port}, function() {
                    readline.createInterface(self.socket, self.socket).on('line', self.distributeSocket.bind(self));
                    self.vsfmSocket.on('error', self.error.bind(self));
                    self.processDeferred.resolve();
                });
            }, 2000);
        });
    },
    distributeSocket: function(data) {
        console.log('[Process][SFM][Socket] ' + data);
    },
    distributeStdout: function(data) {
        console.log('[Process][SFM][Stdout] ' + data);
    },
    distributeStderr: function(data) {
        console.log('[Process][SFM][Stderr] ' + data);
    },
    error: function(err) {
        // TODO: l'erreur peut provenir des Step mais aussi directement du processus VisualSFM !
        // si ça vient des Step => fermer le processus, socket, etc.
        // si ça vient du processus => s'assurer que les Step soient bien arrêtées
    },
    clean: function() {
        var self = this;
        // il faut prendre l'initiative et fermer le Socket plutôt que de fermer brutalement le processus et tuer le Socket dans d'atroces souffrances :(
        self.socket.end(function() {
            self.process.kill();
        });
    }
});

module.exports = ProcessSFM;