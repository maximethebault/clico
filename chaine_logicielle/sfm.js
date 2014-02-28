var spawn = require('child_process').spawn;
var net = require('net');
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');
var inherit = require('inherit');
var endOfLine = require('os').EOL;
var path = require('path');
var WebSocketServer = require('websocket').server;
var http = require('http');


var Step = inherit({
    __constructor: function(vsfm) {
        /**
         * L'objet VisualSFM auquel la Step est associ�e
         */
        this.vsfm = vsfm;
    },
    /**
     * Traite une ligne du fichier de log.
     * Renvoie false si le traitement doit se terminer
     */
    processLine: function(line) {
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
        console.log('D�but de l\'�tape ' + this.getName());
        // une �tape qui �tait en �tat d'erreur peut �tre relanc�e plusieurs fois, c'est pour cela qu'on doit remettre la progression � 0 � chaque nouveau run
        this.internalProgress = 0;
        // VisualSFM ne peut ouvrir que les fichiers txt contenant les chemins vers toutes les images
        // Il va falloir cr�er ce fichier !
        fs.readdir(this.vsfm.pathToImages, function(err, files) {
            if(err) {
                self.vsfm.vsfmError(new Error("Impossible d'ouvrir le r�pertoire en entr�e " + err));
                // on ne va pas plus loin
                return;
            }
            if(!files) {
                // si aucun fichier JPEG a �t� trouv�, on donne � manger au gestionnaire d'erreurs de la classe m�re
                self.vsfm.vsfmError(new Error("Aucun fichier JPEG valide en entr�e"));
                // on ne va pas plus loin
                return;
            }
            // le contenu de notre futur fichier texte
            var dirToTxt = [];
            files.forEach(function(file) {
                // on r�cup�re l'extension du fichier
                var token = file.split('.');
                var ext = token[token.length - 1].toLowerCase();
                // on v�rifie qu'il fait partie de la famille des JPEG
                if(ext == 'jpg' || ext == 'jpeg') {
                    dirToTxt.push(file);
                }
            });
            if(!dirToTxt.length) {
                // si aucun fichier JPEG a �t� trouv�, on donne � manger au gestionnaire d'erreurs de la classe m�re
                self.vsfm.vsfmError(new Error("Aucun fichier JPEG valide en entr�e"));
                // on ne va pas plus loin
                return;
            }
            self.vsfm.nbImages = dirToTxt.length;
            // on �crit le fichier texte
            fs.writeFile(self.vsfm.pathToImages + 'list.txt', dirToTxt.join(endOfLine), function(err) {
                if(err) {
                    self.vsfm.vsfmError(err);
                    // on ne va pas plus loin
                    return;
                }
                // tout est pr�t : lan�ons le chargement des images dans VisualSFM !
                self.vsfm.vsfmSocket.write('33166 ' + self.vsfm.pathToImages + 'list.txt\n');
            });
        });
    },
    getName: function() {
        return "Ouverture des images";
    },
    processLine: function(line) {
        if(this.__base(line)) {
            // cherche un numero d'image dans le log (les lignes int�ressantes sont de la forme 0: NomImg (sans l'extension)
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
        console.log('D�but de l\'�tape ' + this.getName());
        // une �tape qui �tait en �tat d'erreur peut �tre relanc�e plusieurs fois, c'est pour cela qu'on doit remettre la progression � 0 � chaque nouveau run
        this.internalProgress = 0;
        /*
         * Cette �tape peut �tre divis�e en deux sous-�tapes :
         * - dans un premier temps, d�tection + extraction des features SIFT de toutes les images
         * - dans un second temps, comparaison une � une de toutes les paires d'images possibles
         * 
         * Pour �tablir la progression, il nous faut donc �tablir le nombre d'�v�nements qui surviendront durant l'ensemble de l'�tape :
         * - Premi�re sous-�tape : autant de d�tection + extraction que d'images
         * - Deuxi�me sous-�tape : n*(n+1)/2 (suite arithm�tique)
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
        console.log('D�but de l\'�tape ' + this.getName());
        // une �tape qui �tait en �tat d'erreur peut �tre relanc�e plusieurs fois, c'est pour cela qu'on doit remettre la progression � 0 � chaque nouveau run
        this.internalProgress = 0;
        /*
         * Cette �tape peut �tre divis�e en deux sous-�tapes :
         * - dans un premier temps, d�tection + extraction des features SIFT de toutes les images
         * - dans un second temps, comparaison une � une de toutes les paires d'images possibles
         * 
         * Pour �tablir la progression, il nous faut donc �tablir le nombre d'�v�nements qui surviendront durant l'ensemble de l'�tape :
         * - Premi�re sous-�tape : autant de d�tection + extraction que d'images
         * - Deuxi�me sous-�tape : n*(n+1)/2 (suite arithm�tique)
         */
        this.totalEvents = this.vsfm.nbImages;
        self.vsfm.vsfmSocket.write('33041\n');
    },
    getName: function() {
        return "Reconstruction simple du mod�le 3D";
    },
    processLine: function(line) {
        if(this.__base(line)) {
            var matches = /^(Initialization: Th|Initialize with|#[0-9]+:)/.exec(line);
            if(matches)
                this.vsfm.updateProgress(((++this.internalProgress) / this.totalEvents) * 100);
            return true;
        }
        return false;
    }
});

var VisualSFM = inherit({
    /**
     * Constructeur
     * 
     * @param pathToImages string le chemin vers le dossier contenant les images, avec le s�parateur � la fin (slash ou backslash)
     */
    __constructor: function(pathToImages) {
        /**
         * Le chemin vers les images, avec le s�parateur � la fin (slash ou backslash)
         */
        this.pathToImages = pathToImages;
        /**
         * Contient l'�tape en cours d'�x�cution
         */
        this.currentStep;
        /**
         * Contient l'index de l'�tape en cours d'�x�cution
         */
        this.currentStepIndex = -1;
        /**
         * Le nombre d'images qui seront trait�es
         */
        this.nbImages = 0;
        /**
         * Indique si le traitement est en pause
         */
        this.isPaused = false;
        /**
         * Quand on est en train de fermer le processus, on passe �a � true pour ignorer toutes les erreurs
         */
        this.closing = false;
    },
    /**
     * Met le traitement en pause
     */
    pause: function() {
        if(!this.isPaused) {
            this.isPaused = true;
            this.paused();
        }
    },
    /**
     * Appel�e quand le traitement a �t� mis en pause
     */
    paused: function() {
        console.log('Vsfm paused');
    },
    /**
     * Reprend l'�x�cution du traitement
     * 
     * @param restartStep boolean Indique s'il faut red�marrer l'�tape � laquelle le traitement c'�tait arr�t� o� s'il faut passer directement � la suivante
     *                            Par d�faut, vrai (recommence l'�tape)
     */
    resume: function(restartStep) {
        // restartStep par d�faut � vrai
        restartStep = restartStep || true;
        if(this.isPaused) {
            this.isPaused = false;
            if(restartStep)
                this.currentStep.run();
            else
                this.runNextStep();
        }
    },
    done: function() {

    },
    run: function() {
        /*
         * "this" est un mot cl� sp�cial de node d�signant la fonction dans laquelle on est actuellement et son environnement (on nomme tout �a le contexte)
         * Ici, le contexte est l'instance de l'objet VisualSFM (pour simplifier)
         * On sauvegarde le contexte dans une variable, car d�s qu'on entre dans une nouvelle fonction, le contexte (this) change et on perdrait l'acc�s aux propri�t�s/m�thodes de l'instance de VisualSFM
         */
        var self = this;
        this.vsfmProcess = spawn('VisualSFM', ['listen', '9999']);
        this.vsfmProcess.on('error', this.vsfmProcessError.bind(self));
        this.vsfmProcess.on('close', this.vsfmClosed.bind(self));
        setTimeout(function() {
            // mani�re moche de s'assurer que VisualSFM soit bien pr�t et en train d'�couter sur le port donn� avant de s'y connecter.
            self.vsfmSocket = net.connect({port: 9999}, function() {
                self.runNextStep();
                readline.createInterface(self.vsfmSocket, self.vsfmSocket).on('line', function(line) {
                    if(!self.currentStep.processLine(line)) {
                        // processLine renvoie false si l'�tape est termin�e et qu'il faut passer � la suivante
                        self.runNextStep();
                    }
                });
            });
            /*
             * La fonction associ�e � l'�v�nement est appel�e avec un contexte propre � cet �v�nement par d�faut.
             * On change ce comportement gr�ce � bind, le this repr�sentera d�s � pr�sent l'instance de l'objet.
             */
            self.vsfmSocket.on('error', self.vsfmSocketError.bind(self));
        }, 2000);
    },
    runNextStep: function() {
        // si le traitement est en pause, on emp�che l'�x�cution de cette fonction
        if(this.isPaused)
            return;
        // on commence par incr�menter l'index indiquant l'�tape courante, et ensuite on compare avec la taille du tableau des commandes
        if(++this.currentStepIndex == this.__self.tabCommands.length) {
            this.vsfmClose();
            this.done();
            return;
        }
        this.currentStep = new this.__self.tabCommands[this.currentStepIndex](this);
        this.currentStep.run();
    },
    updateProgress: function(newProgress) {
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
            this.pause();
        }
    },
    vsfmClose: function() {
        var self = this;
        console.log('closing');
        this.closing = true;
        // il faut prendre l'initiative et fermer le Socket plut�t que de fermer brutalement le processus et tuer le Socket dans d'atroces souffrances :(
        /*this.vsfmSocket.end(function() {
         self.vsfmProcess.kill();
         });*/
    },
    vsfmClosed: function() {
        console.log('Vsfm s\'est arr�t� !');
    }
},
{
    // propri�t�s & m�thodes statiques
    tabCommands: [
        //'33166 data\\list.txt\n', // Open+ Multi Images
        StepOpen,
        StepComputeMatch,
        StepReconstructionSparse
                //'33033\n', // Compute Missing Match
                //'33041\n', // Reconstruct Sparse
                //'33471 E:\\Mes documents\\GitHub\\cnpao\\chaine_logicielle\\data\\output.nvm\n'// Reconstruct Dense
    ]
});

var vs = new VisualSFM('data\\GreatWall_full\\');
vs.run();

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    // TODO: code pour v�rifier que l'origine est bien celle attendue (v�rification nom de domaine)
    return true;
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // On rejette les connexions depuis des origines inconnues
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept(null, request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            connection.sendUTF(message.utf8Data);
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});