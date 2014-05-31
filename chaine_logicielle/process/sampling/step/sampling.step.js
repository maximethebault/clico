var spawn = require('child_process').spawn;
var fs = require('fs');
var Step = require('../../../Step');
var Utils = require('../../../Utils');
var inherit = require('inherit');
var _ = require('underscore');

/**
 * Fonction qui crée un fichier vide, ou écrase un fichier déjà existant
 *
 * @param {string} file le chemin vers le fichier à créer
 * @param {Function} cb callback
 */
function create_file(file, cb) {
    fs.open(file, 'w', function(err1, fd) {
        fs.close(fd, function(err2) {
            cb(err1 || err2);
        });
    });
}

var StepSampling = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        // contiendra le timeout de surveillance du fichier de sortie : si pas de changement pendant un laps de temps (@see constante watcherTimeout), on supposera que cloudcompare a fini son travail
        this.timeout = null;
        // l'objet qui contiendra l'appel à cloudcompare
        this.process = null;
        // l'objet qui contiendra le watcher : comme son nom l'indique, il surveille un fichier et déclenche des évènements dès qu'il subit des mofications (taille, date de modification, etc.)
        this.watcher = null;
    },
    start: function(cb) {
        var self = this;
        self.__base(function(err) {
            cb(err);
            self._process._model3d.file({code: 'mesh'}, function(err, files) {
                if(err) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération des fichiers : ' + err + '.');
                    // on ne va pas plus loin
                    return;
                }
                if(!files || !files.mesh) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : aucun mesh disponible en entrée');
                    // on ne va pas plus loin
                    return;
                }
                var inputFile = files.mesh._attrs.path;

                self.outputFile = Utils.getReducedPath(inputFile) + '_SAMPLED_POINTS.asc';
                self.outputFileRenamed = Utils.getReducedPath(inputFile) + '.sampled.asc';

                self._process._model3d.param({code: 'samplingPointNumber'}, function(err, param) {
                    if(err) {
                        self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération du paramètre "nombre de points" : ' + err + '.');
                        // on ne va pas plus loin
                        return;
                    }
                    if(!param || !param.samplingPointNumber) {
                        self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : impossible de récupérer le paramètre de densité.');
                        // on ne va pas plus loin
                        return;
                    }

                    var samplingPointNumber = param.samplingPointNumber._attrs.id ? param.samplingPointNumber._attrs.value : param.samplingPointNumber._attrs.value_default;

                    // on force la création du fichier pour que fs.watch ne provoque pas d'erreur si le fichier n'existe pas
                    create_file(self.outputFile, function(err) {
                        if(err) {
                            self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : impossible de créer le fichier de sortie : ' + err + '.');
                            // on ne va pas plus loin
                            return;
                        }
                        self.process = spawn('cloudcompare', ['-NO_TIMESTAMP', '-C_EXPORT_FMT', 'ASC', '-PREC', '12', '-SEP', 'SPACE', '-O', inputFile, '-SAMPLE_MESH', 'POINTS', samplingPointNumber]);
                        self.process.on('error', self.error.bind(self));
                        self.process.on('close', function() {
                            self.done(function() {
                                self.clean();
                            });
                        });
                        // fonction appelé quand le fichier a été détecté comme complet
                        self.watcherFunction = function() {
                            // on essaie de déplacer le fichier
                            fs.rename(self.outputFile, self.outputFileRenamed, function(err) {
                                // s'il y a une erreur, c'est qu'il est encore locké par cloudcompare : on relance l'attente !
                                if(err)
                                    self.timeout = setTimeout(self.watcherFunction.bind(self), self.__self.watcherTimeout);
                                else
                                    self.process.kill();
                            });
                        };
                        self.watcher = fs.watch(self.outputFile, function(event) {
                            if(event == 'change') {
                                // si la taille du fichier a changé, ou si sa date de dernière modification a changé, on reset le timer
                                clearTimeout(self.timeout);
                                self.timeout = setTimeout(self.watcherFunction.bind(self), self.__self.watcherTimeout);
                            }
                        });
                        self.watcher.on('error', function(err) {
                            self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : le watcher a retourné une erreur : ' + err + '.');
                            if(self.timeout)
                                clearTimeout(self.timeout);
                        });
                    });
                });
            });
        });
    },
    pause: function(hurry, cb) {
        this.__base(hurry, cb);
        if(hurry)
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
        if(!self.outputFile) {
            self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : un des fichiers de sortie est manquant.');
            remBase(cb);
        }
        else {
            var outputToCheck = [];
            if(self.outputFileRenamed)
                outputToCheck.push({path: self.outputFileRenamed, code: 'pointCloud', name: 'nuage de point'});
            self.saveFiles(outputToCheck, function() {
                remBase(cb);
            });
        }
    },
    clean: function(cb) {
        if(this.watcher)
            this.watcher.close();
        if(this.timeout)
            clearTimeout(this.timeout);
        if(this.process)
            this.process.kill();
        if(cb)
            cb();
    }
}, {
    // si un fichier n'a pas bougé pendant ce laps de temps (en ms), on considérera que cloudcompare a fini de l'écrire et que son travail est terminé
    watcherTimeout: 1000
});

module.exports = StepSampling;