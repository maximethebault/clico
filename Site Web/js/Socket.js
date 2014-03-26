window.cnpao = window.cnpao || {};

window.cnpao.Socket = inherit({
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
socket = new window.cnpao.Socket();

/**
 * Classe implantée par tous les objets voulant communiquer par WebSocket, pour pouvoir se différencier les uns des autres
 */
window.cnpao.SocketInterface = inherit({
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