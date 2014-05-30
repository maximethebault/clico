var Step = require('../../../Step');
var inherit = require('inherit');
var _ = require('underscore');
var fs = require('fs');
var os = require('os');
var endOfLine = os.EOL;

var StepReconstructionSparse = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        // contiendra la progression de l'étape
        this.internalProgress = 0;
        /**
         * Contient la liste des images composant le modèle
         */
        this.model = [];
        this.totalEvents = 0;
    },
    start: function(cb) {
        var self = this;
        // une étape qui était en état d'erreur peut être relancée plusieurs fois, c'est pour cela qu'on doit remettre la progression à 0 à chaque nouveau run
        this.internalProgress = 0;

        this.totalEvents = self._process.nbImages;
        self.__base(function(err) {
            cb(err);
            self._process.processDeferred.promise.then(function() {
                self._process.socket.write('33041\n');
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
            matches = /^Initialize with (.*) and (.*)$/.exec(line);
            if(matches) {
                self.model = [matches[1], matches[2]];
                self.internalProgress += 2;
                self.updateProgress((self.internalProgress / self.totalEvents) * 100);
            }
            else {
                matches = /^(?:#|\+)[0-9]+: \[(.*)\]/.exec(line);
                if(matches) {
                    // on évite les doublons dans le modèle
                    if(self.model.indexOf(matches[1]) == -1)
                        self.model.push(matches[1]);
                    self.updateProgress(((++self.internalProgress) / self.totalEvents) * 100);
                }
                else {
                    if(line.substring(0, 21) == 'Resuming SfM finished') {
                        if(self.model.length / self._process.nbImages < 0.8) {
                            // si moins de 80% des images ont été utilisées
                            var err = new Error("Moins de 80% des images ont été utilisées pour la génération du modèle 3D. Liste : " + self.model);
                            err.fatal = false;
                            self.error(err);
                        }
                    }
                }
            }
        }
    }
});

module.exports = StepReconstructionSparse;