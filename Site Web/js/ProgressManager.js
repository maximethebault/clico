window.cnpao = window.cnpao || {};

/**
 * Classe s'occupant de gérer la progression d'un processus découpé en étapes
 */
window.cnpao.ProgressManager = inherit({
    initProgressManager: function() {
        console.log('add progress');
        this.totalStepNb = 0;
        this.currentStepNb = 0;
        this.currentStepName = '';
        this.currentStepProgress = 0;
        this.currentError = '';
        /**
         * L'état actuelle du traitement
         * 0 : En attente
         * 1 : En cours
         * 2 : En pause
         * 3 : Arrêté
         */
        this.state = 0;
        $(this).on('_progress-update', this.progressUpdate.bind(this));
        $(this).on('_progress-error', this.progressError.bind(this));
        $(this).on('_progress-state', this.progressState.bind(this));
    },
    setTotalStepNb: function(totalStepNb) {
        if(totalStepNb != this.totalStepNb) {
            this.totalStepNb = totalStepNb;
            $(this).trigger('progress-update', this);
        }
    },
    setCurrentStepNb: function(currentStepNb) {
        if(currentStepNb != this.currentStepNb) {
            this.currentStepNb = currentStepNb;
            $(this).trigger('progress-update', this);
        }
    },
    setCurrentStepName: function(currentStepName) {
        if(currentStepName != this.currentStepName) {
            this.currentStepName = currentStepName;
            $(this).trigger('progress-update', this);
        }
    },
    setCurrentStepProgress: function(currentStepProgress) {
        if(currentStepProgress != this.currentStepProgress) {
            this.currentStepProgress = currentStepProgress;
            $(this).trigger('progress-update', this);
        }
    },
    setCurrentError: function(currentError) {
        this.currentError = currentError;
        $(this).trigger('progress-error', this);
    },
    setState: function(state) {
        if(state != this.state) {
            this.state = state;
            $(this).trigger('progress-state', this);
        }
    },
    progressUpdate: function(eventName, updateObject) {
        this.setTotalStepNb(updateObject.totalStepNb);
        this.setCurrentStepNb(updateObject.currentStepNb);
        this.setCurrentStepName(updateObject.currentStepName);
        this.setCurrentStepProgress(updateObject.currentStepProgress);
    },
    progressError: function(eventName, errorObject) {
        this.setCurrentError(errorObject.message);
    },
    progressState: function(eventName, stateObject) {
        this.setState(stateObject.state);
    }
},
{
    INIT: 0,
    QUEUED: 1,
    RUNNING: 2,
    PAUSED: 3,
    DONE: 4,
    CANCELED: 5
});