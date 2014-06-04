var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');
var Step = require('../../../Step');
var Utils = require('../../../Utils');
var inherit = require('inherit');
var _ = require('underscore');
var Constants = require('../../../Constants');

var StepNormalCalculation = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        // l'objet qui contiendra l'appel à cloudcompare
        this.process = null;
        // va nous permettre de suivre la progression
        this.progress = 0;
        // indique s'il faut calculer les normales
        this.needNormalCalculation = false;
    },
    processPoissonRecon: function(data) {
        var matches = data.match(/Failed to find property/g);
        if(matches) {
            this.needNormalCalculation = true;
        }
        else {
            matches = /Input Points: ([0-9]+)/g.exec(data);
            if(matches) {
                if(matches[1] > Constants.MAX_POINT_LIMIT) {
                    this.error('[Step] Etape "' + this._attrs.name + '" (ID = ' + this._attrs.id + ') : le nuage de points en entrée est trop volumineux ! ' + matches[2] + ' points détectés, limite fixée à ' + Constants.MAX_POINT_LIMIT + '.');
                }
            }
        }
    },
    processMeshlab: function(data) {
        // il est possible que la progression marche mal pas pour Meshlab
        // fonctionnera quand ce patch sera appliqué : https://sourceforge.net/p/meshlab/bugs/393/ (il faudra peut-être rajouter un readline ici)
        // Résumé du bug : les données sur stdout sont bufferisées, elles arrivent donc tout en bloc quand le buffer est plein ou tout à la fin du processus.
        // Note sur le critère de progression _en temps réel_ : 0/20
        var matches = data.match(/Fitting planes/g);
        if(matches) {
            this.progress += matches.length;
            this.updateProgress((this.progress / 91) * 100);
        }
        else {
            matches = /Mesh (.*) loaded has ([0-9]+) vn/g.exec(data);
            if(matches) {
                if(matches[2] > Constants.MAX_POINT_LIMIT) {
                    this.error('[Step] Etape "' + this._attrs.name + '" (ID = ' + this._attrs.id + ') : le nuage de points en entrée est trop volumineux ! ' + matches[2] + ' points détectés, limite fixée à ' + Constants.MAX_POINT_LIMIT + '.');
                }
            }
        }
    },
    start: function(cb) {
        var self = this;
        self.__base(function(err) {
            cb(err);
            // au (re)démarrage, on réinitialise le compteur (on reset la progression)
            self.progress = 0;
            self._process._model3d.file({code: 'pointCloud'}, function(err, files) {
                if(err) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération des fichiers : ' + err + '.');
                    // on ne va pas plus loin
                    return;
                }
                if(!files || !files.pointCloud) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : aucun nuage de points disponible en entrée');
                    // on ne va pas plus loin
                    return;
                }
                self.inputFile = files.pointCloud._attrs.path;
                self.outputFile = Utils.getReducedPath(self.inputFile) + '.normal.ply';
                // grâce à la commande suivante, on teste le fichier en entrée
                self.process = spawn('PoissonRecon.x64', ['--in', self.inputFile, '--depth', '0', '--verbose']);
                self.process.stdout.setEncoding('utf-8');
                self.process.stderr.setEncoding('utf-8');
                self.process.stdout.on('data', self.processPoissonRecon.bind(self));
                self.process.stderr.on('data', self.processPoissonRecon.bind(self));
                self.process.on('error', self.error.bind(self));
                self.process.on('close', function() {
                    self.process = null;
                    self.runNormal();
                });

            });
        });
    },
    runNormal: function() {
        var self = this;
        if(!self.needNormalCalculation) {
            self.done(function() {
                self.clean();
            });
            return;
        }
        self.process = spawn('meshlabserver', ['-i', self.inputFile, '-o', self.outputFile, '-m', 'vc', 'vn', '-s', path.join(__dirname, 'meshlab_normal.mlx')]);
        self.process.stdout.setEncoding('utf-8');
        self.process.stderr.setEncoding('utf-8');
        self.process.stdout.on('data', self.processMeshlab.bind(self));
        self.process.stderr.on('data', self.processMeshlab.bind(self));
        self.process.on('error', self.error.bind(self));
        self.process.on('close', function() {
            self.process = null;
            self.updateProgress(100);
            self.done(function() {
                self.clean();
            });
        });
    },
    pause: function(hurry, cb) {
        this.__base(hurry, cb);
        if(hurry)
            this.kill();
    },
    stop: function(cb) {
        this.__base(cb);
        this.kill();
    },
    error: function(err) {
        // si l'erreur est juste une chaîne de caractères et non un véritable objet Error, on la transforme
        if(_.isString(err))
            err = new Error(err);
        // toutes les erreurs de cette Step seront fatales (provoque l'arrêt de l'ensemble du traitement)
        err.fatal = true;
        this.__base(err);
    },
    done: function(cb) {
        var self = this;
        // l'appel de self.__base n'est pas supporté trop loin dans le code, on contourne le problème
        var remBase = self.__base.bind(self);
        if(!self.needNormalCalculation) {
            // au final, il ne s'est rien passé...
            remBase(cb);
        }
        else {
            var outputToCheck = [];
            if(self.outputFile)
                outputToCheck.push({path: self.outputFile, code: 'pointCloud', name: 'nuage de point'});
            self.saveFiles(outputToCheck, function() {
                remBase(cb);
            });
        }
    },
    clean: function(cb) {
        if(this.process)
            this.process.kill();
        if(cb)
            cb();
    }
});

module.exports = StepNormalCalculation;