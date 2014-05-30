var Process = require('../../Process');
var spawn = require('child_process').spawn;
var net = require('net');
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var inherit = require('inherit');
var _ = require('underscore');
var path = require('path');
var deferred = require('deferred');
var os = require("os");
var endOfLine = os.EOL;

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
            // on teste si le processus n'est pas déjà lancé avant de le faire (il est déjà lancé si on avait mis en pause et qu'on reprend tout juste le script !)
            if(!self.process) {
                self.socket = null;
                var port = self.__self.globalPort++;
                if(self.__self.globalPort >= 32600)
                    self.__self.globalPort = 32500;
                self.process = spawn('VisualSFM', ['listen+log', port]);
                self.process.stdout.on('data', self.distributeStdout.bind(self));
                self.process.stderr.on('data', self.distributeStderr.bind(self));
                self.process.on('error', function(err) {
                    self.process = null;
                    // si on n'est pas en ignoreError, le message d'erreur sera pris en compte
                    self.error(err);
                });
                self.process.on('close', function() {
                    self.process = null;
                    self.socket = null;
                    // si on n'est pas en ignoreError, le message d'erreur sera pris en compte
                    self.error('[Process][SFM] Le processus VisualSFM a été fermé prématurément !');
                });
            }
            // on a aucune manière propre de savoir quand VisualSFM est chargé et prêt à l'emploi...
            // on opte donc pour une solution moche mais simple : on attend deux secondes.
            if(!self.socket) {
                self.processDeferred = deferred();
                setTimeout(function() {
                    if(!self.process)
                        return;
                    self.socket = net.connect({port: port}, function() {
                        readline.createInterface(self.socket, self.socket).on('line', self.distributeSocket.bind(self));
                        self.socket.on('close', function() {
                            self.socket = null;
                            // si on n'est pas en ignoreError, le message d'erreur sera pris en compte
                            self.error('[Process][SFM] Le socket a fermé la connexion prématurément !');
                        });
                        self.processDeferred.resolve();
                    });
                    self.socket.on('error', function(err) {
                        self.socket = null;
                        // si on n'est pas en ignoreError, le message d'erreur sera pris en compte
                        self.error(err);
                    });
                }, 5000);
            }
            cb(err);
        });
    },
    distributeSocket: function(data) {
        if(this._stepCurrent) {
            this._stepCurrent.processSocketLine(data);
        }
        else
            console.info('[Process][SFM][Socket] ' + data);
    },
    distributeStdout: function(data) {
        console.info('[Process][SFM][Stdout] ' + data);
    },
    distributeStderr: function(data) {
        console.info('[Process][SFM][Stderr] ' + data);
    },
    error: function(err) {
        console.error('[Process][SFM][Error] ' + err);
        // si l'erreur est juste une chaîne de caractères et non un véritable objet Error, on la transforme
        if(_.isString(err))
            err = new Error(err);
        if(err.fatal !== false)
            err.fatal = true;
        this.__base(err);
    },
    done: function() {
        var self = this;
        self.__base(function() {
            self.clean();
        });
    },
    clean: function() {
        var self = this;
        // il faut prendre l'initiative et fermer le Socket plutôt que de fermer brutalement le processus et tuer le Socket dans d'atroces souffrances :(
        var dfd = deferred();
        var promise;
        if(self.socket) {
            promise = dfd.promise;
            self.socket.end(function() {
                dfd.resolve();
            });
        }
        else
            promise = deferred(1);
        promise.then(function() {
            if(self.process)
                self.process.kill();
        });
    }
}, {
    // VisualSFM utilisera les ports 32500 à 32600
    globalPort: 32500
});

module.exports = ProcessSFM;