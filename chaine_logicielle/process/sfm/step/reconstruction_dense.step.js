var Step = require('../../../Step');
var inherit = require('inherit');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var os = require('os');
var endOfLine = os.EOL;

var StepReconstructionDense = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        // contiendra la progression de l'étape
        this.internalProgress = 0;
        // le chemin vers le nuage de points généré
        this.pointCloudPath = null;
    },
    start: function(cb) {
        var self = this;
        // une étape qui était en état d'erreur peut être relancée plusieurs fois, c'est pour cela qu'on doit remettre la progression à 0 à chaque nouveau run
        this.internalProgress = 0;
        self.__base(function(err) {
            cb(err);
            self._process.processDeferred.promise.then(function() {
                self._process.socket.write('33471 ' + path.resolve(self._process._model3d.basePath) + path.sep + 'nvm\n');
            });
        });
    },
    pause: function(hurry, cb) {
        this.__base(hurry, cb);
        if(hurry)
            this.kill();
    },
    clean: function(cb) {
        cb();
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
        if(!self.pointCloudPath) {
            self.error('[Step] Pas de nuage de points en sortie...');
            remBase(cb);
        }
        else {
            fs.stat(self.pointCloudPath, function(err, stats) {
                if(err) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : impossible de récupérer la taille du fichier : ' + err + '.');
                    remBase(cb);
                    // on ne va pas plus loin
                    return;
                }
                self._process._model3d.file({code: 'pointCloud'}, function(err, file) {
                    if(err) {
                        self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération du nuage de points : ' + err + '.');
                        remBase(cb);
                        // on ne va pas plus loin
                        return;
                    }
                    if(!file || !file.pointCloud) {
                        self._process._model3d.createFile({code: 'pointCloud', path: self.pointCloudPath, size: stats.size}, function(err) {
                            if(err)
                                self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la création du nuage de points : ' + err + '.');
                            remBase(cb);
                        });
                    }
                    else {
                        file.pointCloud.update({path: self.pointCloudPath, size: stats.size}, function(err) {
                            if(err)
                                self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la mise à jour du chemin du nuage de points : ' + err + '.');
                            remBase(cb);
                        });
                    }
                });
            });
        }
    },
    processSocketLine: function(line) {
        var self = this;
        // TODO: progression :
        // PMVS génère des clusters d'au maximum x images
        // un cluster de x images prend en moyenne x secondes
        // rechercher et établir la progression grâce à ces données
        // faire une régression linéaire si le nb d'img dans le cluster est < au max
        var matches = /^\*command processed\*$/.exec(line);
        if(matches) {
            setTimeout(function() {
                self.done(function(err) {
                    if(err)
                        console.error('[Step] La step n\'a pas réussi à se terminer : ' + err + '.');
                });
            }, 1000);
        }
        else {
            matches = new RegExp('^Save (.*)(data(\\\\|/)' + self._process._model3d._attrs.id + '(\\\\|/)(.*)\.ply) ...done', 'i').exec(line);
            if(matches) {
                self.pointCloudPath = matches[2];
            }
            else {
                matches = /^ERROR:(.*)$/.exec(line);
                if(matches)
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : ' + matches[1] + '.');
            }
        }
    }
});

module.exports = StepReconstructionDense;