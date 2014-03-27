window.cnpao = window.cnpao || {};

function getUniqueTime() {
    var time = new Date().getTime();
    while(time == new Date().getTime())
        ;
    return new Date().getTime();
}

window.cnpao.Socket = inherit({
    __constructor: function() {
        var self = this;
        var hostname = window.location.host;
        this.sock = new WebSocket("ws://"+hostname+":8080/");
        var dfd = $.Deferred();
        this.sock.onopen = function(event) {
            // TODO: security: send username + password and check on node side
            self.sock.send(JSON.stringify({action: 'login', user_id: window.user_id}));
            dfd.resolve();
        };
        // grâce à bind, on s'assure que quand on appellera messageReceived, le this désignera bien l'objet courant (le socket courant)
        this.sock.onmessage = this.messageReceived.bind(this);
        this.sockOpenedPromise = dfd.promise();
        /**
         * Contient une liste de clients attendant les notifications de progression, erreurs, etc.
         * Chacun des clients dans ce tableau doit implanter l'interface SocketInterface
         
        this.listeners = [];*/
    },
    /*addListener: function(con) {
        this.listeners.push(con);
    },
    removeListener: function(con) {
        var index = this.listeners.indexOf(con);
        if(index > -1) {
            this.listeners.splice(index, 1);
        }
    },*/
    send: function(message) {
        var self = this;
        this.sockOpenedPromise.done(function() {
            self.sock.send(JSON.stringify({user_id: window.user_id}));
        });
    },
    messageReceived: function(event) {
        var message = JSON.parse(event.data);
        var modelId = message.mid;
        console.log(message);
         // on envoie un évènement de nom la valeur du champ type du message
        $('.uploader[data-id=' + modelId + ']').trigger(message.type, [message]);
    }
});
socket = new window.cnpao.Socket();