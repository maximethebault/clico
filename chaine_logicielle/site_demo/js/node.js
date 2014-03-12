var Socket = inherit({
    __constructor: function() {
        var hostname = window.location.host;
        this.sock = new WebSocket("ws://"+hostname+":8080/");
        var dfd = $.Deferred();
        this.sock.onopen = function(event) {
            dfd.resolve();
        };
        // grâce à bind, on s'assure que quand on appellera messageReceived, le this désignera bien l'objet courant (le socket courant)
        this.sock.onmessage = this.messageReceived.bind(this);
        this.sockOpenedPromise = dfd.promise();
        /**
         * Contient une liste de clients attendant les notifications de progression, erreurs, etc.
         * Chacun des clients dans ce tableau doit implanter l'interface SocketInterface
         */
        this.listeners = [];
    },
    addListener: function(con) {
        this.listeners.push(con);
    },
    removeListener: function(con) {
        var index = this.listeners.indexOf(con);
        if(index > -1) {
            this.listeners.splice(index, 1);
        }
    },
    send: function(con, message) {
        message.socketId = con.getSocketId();
        var that = this;
        this.sockOpenedPromise.done(function() {
            that.sock.send(JSON.stringify(message));
        });
    },
    messageReceived: function(event) {
        var message = JSON.parse(event.data);
        console.log(message);
        // on itère dans la liste des possibles destinataires jusqu'à ce que l'identifiant unique corresponde
        this.listeners.forEach(function(con) {
            if(con.getSocketId() == message.socketId) {
                // on a trouvé le bon : on envoie un évènement de nom la valeur du champ type du message
                $(con).trigger(message.type, [message]);
                // pas la peine d'aller plus loin, puisque les identifiants sont uniques
                // return false est équivalent à un break
                return false;
            }
        });
    }
});
var socket = new Socket();

/**
 * Sorte d'interface implantée par tous les objets voulant communiquer par WebSocket, pour pouvoir se différentier les uns des autres
 */
var SocketInterface = inherit({
    initSocketInterface: function() {
        /**
         * Plusieurs génération de modèles peuvent tourner en même temps
         * Il faut un identifiant unique pour pouvoir différencier les destinataires d'un message
         */
        this.socketId = getUniqueTime();
        console.log('add listener');
        socket.addListener(this);
    },
    /**
     * Renvoit l'identifiant unique qui permit de distinguer les destinataires des messages
     */
    getSocketId: function() {
        return this.socketId;
    }
});

/**
 * Classe s'occupant de gérer la progression d'un processus découpé en étapes
 */
var ProgressManager = inherit({
    initProgressManager: function() {
        console.log('add progrezss');
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
    WAITING: 0,
    RUNNING: 1,
    PAUSED: 2,
    DONE: 3
});

var SFM = inherit([SocketInterface, ProgressManager], {
    __constructor: function() {
        this.initSocketInterface();
        this.initProgressManager();
    },
    launch: function(images) {
        socket.send(this, {
            action: 'vsfm-new',
            images: images
        });
    }
});

/**
 * Moyen d'obtenir un identifiant unique, se basant sur le temps
 * 
 * @returns {Number} l'identifiant unique
 */
function getUniqueTime() {
    var time = new Date().getTime();
    while(time == new Date().getTime())
        ;
    return new Date().getTime();
}

$('body').on('click', '.generate', function(e) {
    e.preventDefault();
    var arrayFiles = [];
    $('.template-download').find('.toggle:checked').closest('.template-download').find('.name').each(function() {
        arrayFiles.push($(this).text().trim());
    });
    $('.generate').prop('checked', false);
    var sfm = new SFM();
    sfm.launch(arrayFiles);
    $(sfm).on('progress-update', function(eventName, progressManager) {
        $('#3d_status').text('Etape ' + progressManager.currentStepNb + '/' + progressManager.totalStepNb + ' : ' + progressManager.currentStepName);
        $('#3d_progress').css('width', progressManager.currentStepProgress + '%');
    });
    $(sfm).on('progress-error', function(eventName, progressManager) {
        $('#3d_status').text('Erreur : ' + progressManager.currentError);
    });
    $(sfm).on('progress-state', function(eventName, progressManager) {
        if(progressManager.state == ProgressManager.PAUSED)
            $('#3d_progress').addClass('progress-bar-danger').removeClass('progress-bar-info').removeClass('progress-bar-success');
        else if(progressManager.state == ProgressManager.DONE) {
            $('#3d_progress').addClass('progress-bar-success').removeClass('progress-bar-info');
            //nvm.0.ply
            $('#3d_status').text('Fini ! <a href="../data/1/nvm.0.ply">Télécharger</a>');
        }
        else
            $('#3d_progress').addClass('progress-bar-info').removeClass('progress-bar-danger').removeClass('progress-bar-success');
        //$('#3d_state').text('State : ' + progressManager.state);
    });
});