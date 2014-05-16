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
    start: function() {
        var self = this;
        console.log('Début de l\'etape ' + this.getName());
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
            self.process.on('error', function(err) {
                console.log('[ERREUR] SpatialSubsampling: ' + err);
            });
            self.watcher = fs.watch(outputFile, function(event) {
                if(event == 'change') {
                    // si la taille du fichier a changé, ou si sa date de dernière modification a changé, on reset le timer
                    clearTimeout(self.timeout);
                    self.timeout = setTimeout(self.processDone.bind(self), 1000);
                }
            });
        });
    },
    processDone: function() {
        console.log('finished');
        this.clean();
    },
    getName: function() {
        return "Subsampling";
    },
    clean: function() {
        this.watcher.close();
        this.process.kill();
    }
});

function test_unitaire() {
    var step = new StepSpatialSubsampling();
    step.start();
}
test_unitaire();
