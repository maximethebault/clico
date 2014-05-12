var StepComputeMatch = inherit(Step, {
    run: function() {
        var self = this;
        console.log('Début de l\'etape ' + this.getName());
        // une étape qui était en état d'erreur peut être relancée plusieurs fois, c'est pour cela qu'on doit remettre la progression à 0 à chaque nouveau run
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
        this.totalEvents = this.vsfm.nbImages + ((this.vsfm.nbImages * (this.vsfm.nbImages - 1)) / 2);
        self.vsfm.vsfmSocket.write('33033\n');
    },
    getName: function() {
        return "Comparaison des images";
    },
    processLine: function(line) {
        if(this.__base(line)) {
            var matches = /(^SIFT:|matches,)/.exec(line);
            if(matches)
                this.vsfm.updateProgress(((++this.internalProgress) / this.totalEvents) * 100);
            return true;
        }
        return false;
    }
});