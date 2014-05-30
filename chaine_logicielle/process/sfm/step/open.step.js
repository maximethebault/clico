var Step = require('../../../Step');
var inherit = require('inherit');
var _ = require('underscore');
var fs = require('fs');
var os = require('os');
var endOfLine = os.EOL;


var StepOpen = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        // contiendra la progression de l'étape
        this.internalProgress = 0;
    },
    start: function(cb) {
        var self = this;
        // une étape qui était en état d'erreur peut être relancée plusieurs fois, c'est pour cela qu'on doit remettre la progression à 0 à chaque nouveau run
        this.internalProgress = 0;
        self.__base(function(err) {
            cb(err);
            // VisualSFM ne peut ouvrir que les fichiers txt contenant les chemins vers toutes les images
            // Il va falloir créer ce fichier !
            self._process._model3d.file({code: 'sfmImages'}, function(err, files) {
                if(err) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de la récupération des fichiers : ' + err + '.');
                    // on ne va pas plus loin
                    return;
                }
                if(_.isEmpty(files.sfmImages)) {
                    self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : aucune image disponible en entrée');
                    // on ne va pas plus loin
                    return;
                }
                self._process.nbImages = files.sfmImages.length;
                fs.writeFile(
                        self._process._model3d.basePath + 'list.txt',
                        _.map(files.sfmImages, function(file) {
                            return file.getName();
                        }).join(endOfLine),
                        function(err) {
                            if(err) {
                                self.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') : erreur lors de l\'écriture de la liste des images : ' + err + '.');
                                // on ne va pas plus loin
                                return;
                            }
                            // tout est prêt : lançons le chargement des images dans VisualSFM !
                            self._process.processDeferred.promise.then(function() {
                                self._process.socket.write('33166 ' + self._process._model3d.basePath + 'list.txt\n');
                            });
                        }
                );
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
    processSocketLine: function(line) {
        var self = this;
        var matches = /^\*command processed\*$/.exec(line);
        if(matches) {
            self.updateProgress(100);
            setTimeout(function() {
                self.done(function(err) {
                    if(err)
                        console.error('[Step] La step n\'a pas réussi à se terminer : ' + err + '.');
                });
            }, 1000);
        }
        else {
            // cherche un numero d'image dans le log (les lignes intéressantes sont de la forme 0: NomImg (sans l'extension)
            matches = /^\d+:/.exec(line);
            if(matches)
                self.updateProgress(((++self.internalProgress) / self._process.nbImages) * 100);
        }
    }
});

module.exports = StepOpen;