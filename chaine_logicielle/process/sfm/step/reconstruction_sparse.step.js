var StepReconstructionSparse = inherit(Step, {
    run: function() {
        var self = this;
        console.log('Début de l\'etape ' + this.getName());
        // une étape qui était en état d'erreur peut être relancée plusieurs fois, c'est pour cela qu'on doit remettre la progression à 0 à chaque nouveau run
        this.internalProgress = 0;
        /**
         * Contient la liste des images composant le modèle
         */
        this.model = [];
        this.totalEvents = this.vsfm.nbImages;
        self.vsfm.vsfmSocket.write('33041\n');
    },
    getName: function() {
        return "Reconstruction simple du modèle 3D";
    },
    processLine: function(line) {
        if(this.__base(line)) {
            var matches = /^Initialize with (.*) and (.*)$/.exec(line);
            if(matches) {
                this.model = [matches[1], matches[2]];
                this.internalProgress += 2;
                this.vsfm.updateProgress((this.internalProgress / this.totalEvents) * 100);
            }
            else {
                var matches2 = /^(?:#|\+)[0-9]+: \[(.*)\]/.exec(line);
                if(matches2) {
                    // on évite les doublons dans le modèle
                    if(this.model.indexOf(matches2[1]) == -1)
                        this.model.push(matches2[1]);
                    this.vsfm.updateProgress(((++this.internalProgress) / this.totalEvents) * 100);
                }
                else {
                    if(line.substring(0, 21) == 'Resuming SfM finished') {
                        // TODO: remettre à 0.8
                        if(this.model.length / this.vsfm.nbImages < 0.1) {
                            // si moins de 80% des images ont été utilisées
                            var err = new Error("Moins de 80% des images ont été utilisées pour la génération du modèle 3D. Liste : " + this.model);
                            err.recoverable = false;
                            this.vsfm.vsfmError(err);
                            // pour que le traitement se mette en pause, on renvoit false pour indiquer que nous sommes "coincés" dans cette étape
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        return false;
    }
});