var spawn = require('child_process').spawn;
var fs = require('fs');
var Step = require('../../../Step');
var inherit = require('inherit');

/**
 * Fonction qui crée un fichier vide, ou écrase un fichier déjà existant
 * 
 * @param {string} file le chemin vers le fichier à créer
 * @param {Function} cb callback
 */
function create_file(file, cb) {
    fs.open(file, 'w', function(err, fd) {
        fs.close(fd, function(err) {
            cb();
        });
    });
}

var StepSpatialSubsampling = inherit(Step, {
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
            var inputFile = 'input.ply';

            /*
             * Il nous faut le nom du fichier en sortie, qui est composé du nom du fichier en entrée + _SPATIAL_SUBSAMPLED + la nouvelle extension
             */
            var splitInput = inputFile.split('.');
            splitInput.pop();
            var outputFile = splitInput.join('.') + '_SPATIAL_SUBSAMPLED.asc';
            // TODO: passage des noms de fichiers entre Process
            // TODO: passage de la densité en paramètre modifiable par l'utilisateur

            // on force la création du fichier pour que fs.watch ne provoque pas d'erreur si le fichier n'existe pas
            create_file(outputFile, function() {
                self.process = spawn('cloudcompare', ['-NO_TIMESTAMP', '-C_EXPORT_FMT', 'ASC', '-PREC', '12', '-SEP', 'SPACE', '-O', inputFile, '-SS', 'SPATIAL', '0.1']);
                self.process.on('error', self.error.bind(self));
                self.watcher = fs.watch(outputFile, function(event) {
                    if(event == 'change') {
                        // si la taille du fichier a changé, ou si sa date de dernière modification a changé, on reset le timer
                        clearTimeout(self.timeout);
                        self.timeout = setTimeout(self.done.bind(self), self.__self.watcherTimeout);
                    }
                });
            });
        });
    },
    pause: function(hurry, cb) {
        var self = this;
        self.__base(hurry, cb);
        if(hurry) {
            self.kill();
        }
    },
    stop: function(cb) {
        var self = this;
        self.__base(cb);
        self.kill();
    },
    kill: function() {
        var self = this;
        self.clean(function() {
            self.done(function(err) {
                console.error('[Step] Etape "' + self._attrs.name + '" (ID = ' + self._attrs.id + ') ne s\'est pas terminée normalement : ' + err + '.');
            });
        });
    },
    error: function(err) {
        // si l'erreur est juste une chaîne de caractères et non un véritable objet Error, on la transforme
        if(typeof err === 'string')
            err = new Error(err);
        // toutes les erreurs de cette Step seront fatales (provoque l'arrêt de l'ensemble du traitement)
        err.fatal = true;
        this.__base(err);
    },
    done: function() {
        var self = this;
        self.__base(function() {
            self.clean();
        });
    },
    clean: function(cb) {
        var self = this;
        if(self.watcher)
            self.watcher.close();
        if(self.timeout)
            clearTimeout(self.timeout);
        if(self.process)
            self.process.kill(function() {
                if(cb)
                    cb();
            });
    }
}, {
    // si un fichier n'a pas bougé pendant ce laps de temps (en ms), on considérera que cloudcompare a fini de l'écrire et que son travail est terminé
    watcherTimeout: 1000
});