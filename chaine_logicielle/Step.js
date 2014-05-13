var inherit = require('inherit');

var Step = inherit({
    __constructor: function(vsfm) {
        /**
         * L'objet VisualSFM auquel la Step est associée
         */
        this.vsfm = vsfm;
    },
    /**
     * Traite une ligne du fichier de log.
     * Renvoie false si le traitement doit se terminer
     * 
     * @param {String} line la ligne
     */
    processLine: function(line) {
        if(this.vsfm.state != VisualSFM.RUNNING)
            return false;
        if(line.indexOf('*command processed*') > -1) {
            this.vsfm.updateProgress(100);
            return false;
        }
        return true;
    },
    /**
     * Fonction qui mettra à jour le progrès de l'étape en base de données, et qui s'occupe de le transmettre à l'utilisateur
     * 
     * @param {float} newProgress le nouveau progrès
     */
    updateProgress: function(newProgress) {
        // TODO
        console.log('[PROGRESS UPDATE] ' + newProgress);
    }
});

module.exports = Step;