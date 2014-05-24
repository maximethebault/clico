var Step = require('../../../Step');
var inherit = require('inherit');
var _ = require('underscore');
var fs = require('fs');
var os = require('os');
var endOfLine = os.EOL;


var StepComputeMatch = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        // contiendra la progression de l'étape
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
        this.totalEvents = process.nbImages + ((process.nbImages * (process.nbImages - 1)) / 2);
    },
    start: function(cb) {
        var self = this;
        // une étape qui était en état d'erreur peut être relancée plusieurs fois, c'est pour cela qu'on doit remettre la progression à 0 à chaque nouveau run
        this.internalProgress = 0;
        self.__base(function(err) {
            cb(err);
            self._process.processDeferred.promise.then(function() {
                self._process.socket.write('33033\n');
            });
        });
    },
    pause: function(hurry, cb) {
        this.__base(hurry, cb);
        if(hurry) {
            if(this._process.socket)
                this._process.socket.write('32978\n');
            else
                this.kill();
        }
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
            setTimeout(function() {
                self.done(function(err) {
                    if(err)
                        console.error('[Step] La step n\'a pas réussi à se terminer : ' + err + '.');
                });
            }, 1000);
        }
        else {
            matches = /(^SIFT:|matches,)/.exec(line);
            if(matches)
                self.updateProgress(((++self.internalProgress) / self.totalEvents) * 100);
        }
    }
});

module.exports = StepComputeMatch;