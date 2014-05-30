var spawn = require('child_process').spawn;
var fs = require('fs');
var Step = require('../../../Step');
var inherit = require('inherit');
var _ = require('underscore');

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
    },
    processMeshlab: function(data) {
        // il est possible que la progression ne marche pas pour Meshlab
        // fonctionnera quand ce patch sera appliqué : https://sourceforge.net/p/meshlab/bugs/393/
        var matches = data.match(/Fitting planes/g);
        if(matches) {
            this.updateProgress(((this.progress++) / 91) * 100);
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
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération des fichiers :' + err + '.');
                    // on ne va pas plus loin
                    return;
                }
                if(!files || !files.pointCloud) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : aucun nuage de points disponible en entrée');
                    // on ne va pas plus loin
                    return;
                }
                self.inputFile = files.pointCloud._attrs.path;
                /*
                 * Il nous faut le nom du fichier en sortie, qui est composé du nom du fichier en entrée + _NORMAL + la nouvelle extension
                 */
                var splitInput = self.inputFile.split('.');
                self.outputFile = splitInput[0] + '_NORMAL.ply';

                self.process = spawn('PoissonRecon.x64', ['--in', self.inputFile]);
                self.process.stdout.setEncoding('utf-8');
                self.process.stdout.on('data', self.processPoissonRecon.bind(self));
                self.process.on('error', self.error.bind(self));
                self.process.on('exit', function() {
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
        self.process = spawn('meshlabserver', ['-i', self.inputFile, '-o', self.outputFile, '-m', 'vn', '-s', 'script_normal.mlx']);

        self.process.stdout.setEncoding('utf-8');
        self.process.stdout.on('data', self.processMeshlab.bind(self));
        self.process.on('error', self.error.bind(self));
        self.process.on('exit', function() {
            self.process = null;
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
            fs.stat(self.outputFile, function(err, stats) {
                if(err) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : impossible de récupérer la taille du fichier :' + err + '.');
                    remBase(cb);
                    // on ne va pas plus loin
                    return;
                }
                self._process._model3d.file({code: 'pointCloud'}, function(err, file) {
                    if(err) {
                        self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération du nuage de points :' + err + '.');
                        remBase(cb);
                        // on ne va pas plus loin
                        return;
                    }
                    if(!file || !file.pointCloud) {
                        self._process._model3d.createFile({code: 'pointCloud', path: self.outputFile, size: stats.size}, function(err) {
                            if(err)
                                self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la création du nuage de points :' + err + '.');
                            remBase(cb);
                        });
                    }
                    else {
                        file.pointCloud.update({path: self.outputFile, size: stats.size}, function(err) {
                            if(err)
                                self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la mise à jour du chemin du nuage de points :' + err + '.');
                            remBase(cb);
                        });
                    }
                });
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