var spawn = require('child_process').spawn;
var fs = require('fs');
var Step = require('../../../Step');
var inherit = require('inherit');

var StepDeleteEdges = inherit(Step, {
    __constructor: function(attrs, process) {
        this.__base(attrs, process);
        // l'objet qui contiendra l'appel à cloudcompare
        this.process = null;
		var border = 5;
		// TODO: permettre le choix de la border par l'utilisateur.
    },
	
	
    start: function() {
        var self = this;

        // TODO: passage des noms de fichiers entre Process
        var inputCloud = 'input.ply';
	var inputMesh = 'input_mesh.ply';

        // nom du fichier en sortie, composé du nom du fichier en entrée + _TEXTURED.obj
        var splitInput = inputCloud.split('.');
        splitInput.pop();
        var outputFile = splitInput.join('.') + '_TEXTURED.obj';

        self.process = spawn('MeshTexturer', ['-ccloud', inputCloud, '-mesh', inputMesh, '-tmesh', outputFile, '-width', '4096', '-height', '4096', '-k', '5', '-border', border, '-v']);

        self.process.on('error', self.error.bind(self));
        self.process.on('exit', function() {
            self.process = null;
            self.done();
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
        if(self.process)
            self.process.kill(function() {
                if(cb)
                    cb();
            });
    }
	

	// vérifie que le paramètre border entré par l'utilisateur ne va pas faire planter la commande
	// c'est le cas quand la console affiche "1 * 1 triangle edge"

	processLine: function(line) {
	var self = this;
        if(this.__base(line)) {
            var matches = /1 * 1 triangle/.exec(line);
            if(matches) {
                self.border--;
                if(border >= 0) {
					self.process.kill();
				}
				else {
					// TODO: gérer le cas où border<0 (pas possible
					self.process.error("error: border<0");
				}
            }
            return true;
        }
        return false;
    }
});

