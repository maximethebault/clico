var StepOpen = inherit(Step, {
    run: function() {
        var self = this;
        console.log('Debut de l\'etape ' + this.getName());
        // une étape qui était en état d'erreur peut être relancée plusieurs fois, c'est pour cela qu'on doit remettre la progression à 0 à chaque nouveau run
        this.internalProgress = 0;
        // VisualSFM ne peut ouvrir que les fichiers txt contenant les chemins vers toutes les images
        // Il va falloir créer ce fichier !
        fs.readdir(this.vsfm.pathToImages, function(err, files) {
            if(err) {
                self.vsfm.vsfmError(new Error("Impossible d'ouvrir le répertoire en entrée " + err));
                // on ne va pas plus loin
                return;
            }
            if(!files) {
                // si aucun fichier JPEG a été trouvé, on donne à manger au gestionnaire d'erreurs de la classe mère
                self.vsfm.vsfmError(new Error("Aucun fichier JPEG valide en entrée"));
                // on ne va pas plus loin
                return;
            }
            // le contenu de notre futur fichier texte
            var dirToTxt = [];
            files.forEach(function(file) {
                // on récupère l'extension du fichier
                var token = file.split('.');
                var ext = token[token.length - 1].toLowerCase();
                // on vérifie qu'il fait partie de la famille des JPEG
                if(ext == 'jpg' || ext == 'jpeg') {
                    dirToTxt.push(file);
                }
            });
            if(!dirToTxt.length) {
                // si aucun fichier JPEG a été trouvé, on donne à manger au gestionnaire d'erreurs de la classe mère
                self.vsfm.vsfmError(new Error("Aucun fichier JPEG valide en entrée"));
                // on ne va pas plus loin
                return;
            }
            self.vsfm.nbImages = dirToTxt.length;
            // on écrit le fichier texte
            fs.writeFile(self.vsfm.pathToImages + 'list.txt', dirToTxt.join(endOfLine), function(err) {
                if(err) {
                    self.vsfm.vsfmError(err);
                    // on ne va pas plus loin
                    return;
                }
                // tout est prêt : lançons le chargement des images dans VisualSFM !
                self.vsfm.vsfmSocket.write('33166 ' + self.vsfm.pathToImages + 'list.txt\n');
            });
        });
    },
    getName: function() {
        return "Ouverture des images";
    },
    processLine: function(line) {
        if(this.__base(line)) {
            // cherche un numero d'image dans le log (les lignes intéressantes sont de la forme 0: NomImg (sans l'extension)
            var matches = /^\d+:/.exec(line);
            if(matches)
                this.vsfm.updateProgress(((++this.internalProgress) / this.vsfm.nbImages) * 100);
            return true;
        }
        return false;
    }
});