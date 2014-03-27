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

var Step = inherit({
    __constructor: function(vsfm) {
        /**
         * L'objet VisualSFM auquel la Step est associée
         */
        this.vsfm = vsfm;
    },
    /**
     * Traite une ligne du fichier de log.
     * Renvoie false si le traitement doit se terminer
     */
    processLine: function(line) {
        if(this.vsfm.state != VisualSFM.RUNNING)
            return false;
        if(line.indexOf('*command processed*') > -1) {
            this.vsfm.updateProgress(100);
            return false;
        }
        return true;
    }
});

var StepOpen = inherit(Step, {
    run: function() {
        var self = this;
        console.log('Debut de l\'etape ' + this.getName());
        // une étape qui était en état d'erreur peut être relancée plusieurs fois, c'est pour cela qu'on doit remettre la progression à 0 à chaque nouveau run
        this.internalProgress = 0;
        // VisualSFM ne peut ouvrir que les fichiers txt contenant les chemins vers toutes les images
        // Il va falloir créer ce fichier !
        fs.readdir(this.vsfm.pathToImages, function(err, files) {
            if(err) {
                self.vsfm.vsfmError(new Error("Impossible d'ouvrir le répertoire en entrée " + err));
                // on ne va pas plus loin
                return;
            }
            if(!files) {
                // si aucun fichier JPEG a été trouvé, on donne à manger au gestionnaire d'erreurs de la classe mère
                self.vsfm.vsfmError(new Error("Aucun fichier JPEG valide en entrée"));
                // on ne va pas plus loin
                return;
            }
            // le contenu de notre futur fichier texte
            var dirToTxt = [];
            files.forEach(function(file) {
                // on récupère l'extension du fichier
                var token = file.split('.');
                var ext = token[token.length - 1].toLowerCase();
                // on vérifie qu'il fait partie de la famille des JPEG
                if(ext == 'jpg' || ext == 'jpeg') {
                    dirToTxt.push(file);
                }
            });
            if(!dirToTxt.length) {
                // si aucun fichier JPEG a été trouvé, on donne à manger au gestionnaire d'erreurs de la classe mère
                self.vsfm.vsfmError(new Error("Aucun fichier JPEG valide en entrée"));
                // on ne va pas plus loin
                return;
            }
            self.vsfm.nbImages = dirToTxt.length;
            // on écrit le fichier texte
            fs.writeFile(self.vsfm.pathToImages + 'list.txt', dirToTxt.join(endOfLine), function(err) {
                if(err) {
                    self.vsfm.vsfmError(err);
                    // on ne va pas plus loin
                    return;
                }
                // tout est prêt : lançons le chargement des images dans VisualSFM !
                self.vsfm.vsfmSocket.write('33166 ' + self.vsfm.pathToImages + 'list.txt\n');
            });
        });
    },
    getName: function() {
        return "Ouverture des images";
    },
    processLine: function(line) {
        if(this.__base(line)) {
            // cherche un numero d'image dans le log (les lignes intéressantes sont de la forme 0: NomImg (sans l'extension)
            var matches = /^\d+:/.exec(line);
            if(matches)
                this.vsfm.updateProgress(((++this.internalProgress) / this.vsfm.nbImages) * 100);
            return true;
        }
        return false;
    }
});

var StepComputeMatch = inherit(Step, {
    run: function() {
        var self = this;
        console.log('Début de l\'etape ' + this.getName());
        // une étape qui était en état d'erreur peut être relancée plusieurs fois, c'est pour cela qu'on doit remettre la progression à 0 à chaque nouveau run
        this.internalProgress = 0;
        /*
         * Cette étape peut être divisée en deux sous-étapes :
         * - dans un premier temps, détection + extraction des features SIFT de toutes les images
         * - dans un second temps, comparaison une à une de toutes les paires d'images possibles
         * 
         * Pour établir la progression, il nous faut donc établir le nombre d'évènements qui surviendront durant l'ensemble de l'étape :
         * - Première sous-étape : autant de détection + extraction que d'images
         * - Deuxième sous-étape : n*(n+1)/2 (suite arithmétique)
         */
        this.totalEvents = this.vsfm.nbImages + ((this.vsfm.nbImages * (this.vsfm.nbImages - 1)) / 2);
        self.vsfm.vsfmSocket.write('33033\n');
    },
    getName: function() {
        return "Comparaison des images";
    },
    processLine: function(line) {
        if(this.__base(line)) {
            var matches = /(^SIFT:|matches,)/.exec(line);
            if(matches)
                this.vsfm.updateProgress(((++this.internalProgress) / this.totalEvents) * 100);
            return true;
        }
        return false;
    }
});

var StepReconstructionSparse = inherit(Step, {
    run: function() {
        var self = this;
        console.log('Début de l\'etape ' + this.getName());
        // une étape qui était en état d'erreur peut être relancée plusieurs fois, c'est pour cela qu'on doit remettre la progression à 0 à chaque nouveau run
        this.internalProgress = 0;
        /**
         * Contient la liste des images composant le modèle
         */
        this.model = [];
        this.totalEvents = this.vsfm.nbImages;
        self.vsfm.vsfmSocket.write('33041\n');
    },
    getName: function() {
        return "Reconstruction simple du modèle 3D";
    },
    processLine: function(line) {
        if(this.__base(line)) {
            var matches = /^Initialize with (.*) and (.*)$/.exec(line);
            if(matches) {
                this.model = [matches[1], matches[2]];
                this.internalProgress += 2;
                this.vsfm.updateProgress((this.internalProgress / this.totalEvents) * 100);
            }
            else {
                var matches2 = /^(?:#|\+)[0-9]+: \[(.*)\]/.exec(line);
                if(matches2) {
                    // on évite les doublons dans le modèle
                    if(this.model.indexOf(matches2[1]) == -1)
                        this.model.push(matches2[1]);
                    this.vsfm.updateProgress(((++this.internalProgress) / this.totalEvents) * 100);
                }
                else {
                    if(line.substring(0, 21) == 'Resuming SfM finished') {
                        // TODO: remettre à 0.8
                        if(this.model.length / this.vsfm.nbImages < 0.1) {
                            // si moins de 80% des images ont été utilisées
                            var err = new Error("Moins de 80% des images ont été utilisées pour la génération du modèle 3D. Liste : " + this.model);
                            err.recoverable = false;
                            this.vsfm.vsfmError(err);
                            // pour que le traitement se mette en pause, on renvoit false pour indiquer que nous sommes "coincés" dans cette étape
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        return false;
    }
});

var StepReconstructionDense = inherit(Step, {
    run: function() {
        var self = this;
        console.log('Début de l\'etape ' + this.getName());
        // une étape qui était en état d'erreur peut être relancée plusieurs fois, c'est pour cela qu'on doit remettre la progression à 0 à chaque nouveau run
        this.internalProgress = 0;
        this.totalEvents = 0;
        self.vsfm.vsfmSocket.write('33471 ' + path.resolve(self.vsfm.pathToImages) + '\\nvm\n');
    },
    getName: function() {
        return "Reconstruction dense du modèle 3D";
    },
    processLine: function(line) {
        if(this.__base(line)) {
            // TODO: progression
            // PMVS génère des clusters d'au maximum x images
            // un cluster de x images prend en moyenne x secondes
            // rechercher et établir la progression grâce à ces données
            // faire une régression linéaire si le nb d'img dans le cluster est < au max
            var matches = /^Undistorting ([0-9]+) images/.exec(line);
            if(matches) {
                // TODO: rajouter un poids suivant le nombre de clusters prévus à partir du nombre d'images
                this.totalEvents = matches[1];
                this.vsfm.updateProgress((this.internalProgress / this.totalEvents) * 100);
            }
            else {
                var matches2 = /^#[0-9]+: /.exec(line);
                if(matches2) {
                    this.internalProgress++;
                    this.vsfm.updateProgress((this.internalProgress / this.totalEvents) * 100);
                }
            }
            return true;
        }
        return false;
    }
});

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
    //SELECT m.id FROM process p LEFT JOIN model3d m ON p.model3d_id=m.id WHERE m.order=1 AND (m.state=0 OR m.state=3) AND p.priority=(SELECT MIN(priority) FROM process p2 WHERE p2.id=p.model3d_id GROUP BY p2.model3d_id) GROUP BY p.model3d_id
    pool.query('SELECT m.id AS model_id, p.id AS process_id, m.membres_id AS membres_id FROM process p LEFT JOIN model3d m ON p.model3d_id=m.id WHERE m.order=1 AND (m.state=0 OR m.state=3)', function(err, rows) {
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