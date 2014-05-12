var spawn = require('child_process').spawn;
var net = require('net');
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var inherit = require('inherit');
var path = require('path');
var WebSocketServer = require('websocket').server;
var http = require('http');
var deferred = require('deferred');
var os = require("os");
var endOfLine = os.EOL;
var mysql = require('mysql');
var pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cnpao',
    connectionLimit: 1
});
var globalPort = 9999;

var VisualSFM = inherit({
    /**
     * Constructeur
     * 
     * @param pathToImages string le chemin vers le dossier contenant les images, avec le séparateur à la fin (slash ou backslash)
     */
    __constructor: function(model_id, process_id, membres_id) {
        this.model_id = model_id;
        this.id = process_id;
        this.membres_id = membres_id;
        this.pathToImages = '../data/' + model_id + '/';
        // TODO: supprimer cette var.
        this.listeners = [];
        /**
         * Contient l'étape en cours d'éxécution
         */
        this.currentStep;
        /**
         * Contient l'index de l'étape en cours d'éxécution
         */
        this.currentStepIndex = -1;
        /**
         * Le nombre d'images qui seront traitées
         */
        this.nbImages = 0;
        /**
         * Quand on est en train de fermer le processus, on passe ça à true pour ignorer toutes les erreurs
         */
        this.closing = false;
        this.state = this.__self.WAITING;
    },
    addListener: function(con) {
        this.listeners.push(con);
    },
    removeListener: function(con) {
        var index = this.listeners.indexOf(con);
        if(index > -1) {
            this.listeners.splice(index, 1);
        }
    },
    sendMessage: function(message) {
        message.mid = this.model_id;
        sendTo(this.membres_id, message);
    },
    /**
     * Met toutes les images contenues dans le tableau arrayOfImages dans un répertoire unique
     */
    imagesIntoDir: function(cb) {
        /*var self = this;
         this.pathToImages = 'data/' + this.id + '/';
         fs.mkdir(this.pathToImages, function(err) {
         if(err)
         console.log('Impossible de creer le repertoire : ' + err);
         deferred.map(self.arrayOfImages, function(oldFile) {
         var dfd = deferred();
         fs.rename('site_demo/server/php/files/' + path.basename(oldFile), self.pathToImages + path.basename(oldFile), function(err) {
         if(err)
         console.log('Impossible de deplacer le fichier ' + oldFile + ' : ' + err);
         dfd.resolve();
         });
         return dfd.promise;
         }).done(function() {
         cb();
         });
         });*/
        cb();
    },
    /**
     * Met le traitement en pause
     */
    pause: function() {
        this.setState(this.__self.PAUSED);
    },
    /**
     * Reprend l'éxécution du traitement
     * 
     * @param restartStep boolean Indique s'il faut redémarrer l'étape à laquelle le traitement c'était arrêté où s'il faut passer directement à la suivante
     *                            Par défaut, vrai (recommence l'étape)
     */
    resume: function(restartStep) {
        // restartStep par défaut à vrai
        restartStep = restartStep || true;
        if(this.state != this.__self.RUNNING) {
            this.setState(this.__self.RUNNING);
            if(restartStep)
                this.currentStep.run();
            else
                this.runNextStep();
        }
    },
    done: function() {
        this.setState(this.__self.DONE);
    },
    run: function() {
        /*
         * "this" est un mot clé spécial de node désignant la fonction dans laquelle on est actuellement et son environnement (on nomme tout ça le contexte)
         * Ici, le contexte est l'instance de l'objet VisualSFM (pour simplifier)
         * On sauvegarde le contexte dans une variable, car dès qu'on entre dans une nouvelle fonction, le contexte (this) change et on perdrait l'accès aux propriétés/méthodes de l'instance de VisualSFM
         */
        var self = this;
        var port = globalPort++;
        this.vsfmProcess = spawn('VisualSFM', ['listen+log', port]);
        this.vsfmProcess.stdout.on('data', function(data) {
            console.log('[STDOUT] ' + data);
        });
        this.vsfmProcess.stderr.on('data', function(data) {
            console.log('[STDERR] ' + data);
        });
        this.vsfmProcess.on('error', this.vsfmProcessError.bind(self));
        this.vsfmProcess.on('close', this.vsfmClosed.bind(self));
        this.setState(this.__self.RUNNING);
        /*
         * On laisse un peu de temps à VisualSFM pour se lancer.
         * Pendant ce temps là, on créé l'enregistrement en BDD et on réunit tous les fichiers dans un même dossier
         */
        self.imagesIntoDir(function() {
            setTimeout(function() {
                // manière moche de s'assurer que VisualSFM soit bien prêt et en train d'écouter sur le port donné avant de s'y connecter.
                self.vsfmSocket = net.connect({port: port}, function() {
                    self.runNextStep();
                    readline.createInterface(self.vsfmSocket, self.vsfmSocket).on('line', function(line) {
                        console.log('[LINE] ' + line);
                        if(!self.currentStep.processLine(line)) {
                            // processLine renvoie false si l'étape est terminée et qu'il faut passer à la suivante
                            self.runNextStep();
                        }
                    });
                });
                /*
                 * La fonction associée à l'évènement est appelée avec un contexte propre à cet évènement par défaut.
                 * On change ce comportement grâce à bind, le this représentera dès à présent l'instance de l'objet.
                 */
                self.vsfmSocket.on('error', self.vsfmSocketError.bind(self));
            }, 2000);
        });
    },
    runNextStep: function() {
        // si le traitement est en pause, on empêche l'éxécution de cette fonction
        if(this.state != this.__self.RUNNING)
            return;
        // on commence par incrémenter l'index indiquant l'étape courante, et ensuite on compare avec la taille du tableau des commandes
        if(++this.currentStepIndex == this.__self.tabCommands.length) {
            this.vsfmClose();
            this.done();
            return;
        }
        this.setState(this.__self.RUNNING);
        this.currentStep = new this.__self.tabCommands[this.currentStepIndex](this);
        this.currentStep.run();
    },
    setState: function(state) {
        if(state != this.state) {
            pool.query('UPDATE model3d SET state=? WHERE id=?', [state, this.id], function(err) {
                if(err)
                    throw err;
            });
            this.state = state;
            var stateObject = {
                type: 'progress-state',
                state: state
            };
            this.sendMessage(stateObject);
        }
    },
    updateProgress: function(newProgress) {
        var progressObject = {
            type: 'progress-update',
            currentStepNb: this.currentStepIndex + 1,
            totalStepNb: this.__self.tabCommands.length,
            currentStepName: this.currentStep.getName(),
            currentStepProgress: newProgress
        };
        this.sendMessage(progressObject);
        console.log('Progression ' + newProgress);
    },
    vsfmSocketError: function(err) {
        if(this.closing)
            return;
        console.log('Erreur avec le socket : ' + err);
    },
    vsfmProcessError: function(err) {
        if(this.closing)
            return;
        console.log('Erreur avec VisualSFM : ' + err);
    },
    vsfmError: function(err) {
        if(this.closing)
            return;
        console.log('Erreur avec le traitement : ' + err);
        if(!err.recoverable) {
            console.log('pausing');
            var errorObject = {
                type: 'progress-error',
                message: err.message
            };
            this.sendMessage(errorObject);
            this.pause();
        }
    },
    vsfmClose: function() {
        var self = this;
        console.log('closing');
        this.closing = true;
        // il faut prendre l'initiative et fermer le Socket plutôt que de fermer brutalement le processus et tuer le Socket dans d'atroces souffrances :(
        this.vsfmSocket.end(function() {
            self.vsfmProcess.kill();
        });
    },
    vsfmClosed: function() {
        console.log('Vsfm s\'est arrete !');
    }
},
{
    // propriétés & méthodes statiques
    tabCommands: [
        //'33166 data\\list.txt\n', // Open+ Multi Images
        StepOpen,
        StepComputeMatch,
        StepReconstructionSparse,
        StepReconstructionDense
    ],
    INIT: 0,
    QUEUED: 1,
    RUNNING: 2,
    PAUSED: 3,
    DONE: 4,
    CANCELED: 5
});

function checkForWaiting() {
    //SELECT m.id FROM process p LEFT JOIN model3d m ON p.model3d_id=m.id WHERE m.command=1 AND (m.state=0 OR m.state=3) AND p.priority=(SELECT MIN(priority) FROM process p2 WHERE p2.id=p.model3d_id GROUP BY p2.model3d_id) GROUP BY p.model3d_id
    pool.query('SELECT m.id AS model_id, p.id AS process_id, m.membres_id AS membres_id FROM process p LEFT JOIN model3d m ON p.model3d_id=m.id WHERE m.command=1 AND (m.state=0 OR m.state=3)', function(err, rows) {
        if(err)
            throw err;
        rows.forEach(function(row) {
            pool.query('UPDATE model3d SET state=? WHERE id=?', [VisualSFM.QUEUED, row['model_id']], function(err) {
                if(err)
                    throw err;
            });
            var vs = new VisualSFM(row['model_id'], row['process_id'], row['membres_id']);
            vs.run();
        })
        setTimeout(function() {
            checkForWaiting();
        }, 5000);
    });
}
checkForWaiting();

/*var vs = new VisualSFM('data\\GreatWall_full\\');
 vs.run();*/

/*
 * Controller
 */

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
var hostname = 'localhost';
if(os.networkInterfaces().hasOwnProperty('eth0:0')) {
    hostname = os.networkInterfaces()['eth0:0'].address;
}
server.listen(8080, hostname, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    // TODO: code pour vérifier que l'origine est bien celle attendue (vérification nom de domaine)
    return true;
}

var listener = {};
function sendTo(membres_id, message) {
    if(listener.hasOwnProperty(membres_id)) {
        listener[membres_id].forEach(function(con) {
            con.sendUTF(JSON.stringify(message));
        });
    }
}

wsServer.on('request', function(request) {
    if(!originIsAllowed(request.origin)) {
        // On rejette les connexions depuis des origines inconnues
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    var connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if(message.type === 'utf8') {
            var messageData = JSON.parse(message.utf8Data);
            if(messageData.action == 'login') {
                connection.user_id = messageData.user_id;
                if(listener.hasOwnProperty(messageData.user_id)) {
                    listener[messageData.user_id].push(connection);
                }
                else
                    listener[messageData.user_id] = [connection];
            }
        }
    });
    connection.on('close', function(reasonCode, description) {
        listener[connection.user_id].splice(listener[connection.user_id].indexOf(connection), 1);
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});