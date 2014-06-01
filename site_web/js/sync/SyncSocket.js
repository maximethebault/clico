window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.SyncSocket = inherit({
    __constructor: function() {
        // on laisse à l'utilisateur le temps d'installer son callback pour onClose avant de lancer le Websocket
        setTimeout(this.start.bind(this), 0);

        this.deferred = $.Deferred();

        this.throttledRefresh = _.throttle(this.refreshModel3d.bind(this), 500);
    },
    start: function() {
        var hostname = window.location.host;
        this.socket = new WebSocket("ws://" + hostname + ":8080/");
        // grâce à bind, on s'assure que quand on appellera messageReceived, le this désignera bien l'objet courant (le socket courant)
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onmessage = this.onMessage.bind(this);
        this.socket.onerror = this.onError.bind(this);
        this.socket.onclose = this.onClose.bind(this);
    },
    refreshModel3d: function(id) {
        window.cnpao.Model.Model3d.get(true, {id: id}, function(err) {
        });
    },
    sendMessage: function(message) {
        var self = this;
        self.deferred.promise().then(function() {
            self.socket.send(JSON.stringify(message));
        });
    },
    onOpen: function() {
        this.socket.send(JSON.stringify({
            action: 'login',
            user_id: $.cookie('uid'),
            password: $.cookie('password')
        }));
    },
    onMessage: function(message) {
        var data = JSON.parse(message.data);
        if(data.ack) {
            if(data.ack === 'login') {
                this.deferred.resolve();
            }
        }
        else {
            if(data.uiUpdate)
                this.throttledRefresh(data.model3d_id);
            else if(data.progress) {
                window.cnpao.Model.Step.get(false, {id: data.step_id}, null, function(err, res) {
                    if(!err && res) {
                        var step = res[0];
                        if(step) {
                            step._attrs.progress = data.progress;
                            $(document).trigger('ui-progress', [data.model3d_id, data.process_id, data.step_id, data.progress]);
                        }
                    }
                });
            }
        }
    },
    onError: function() {
        // on ferme la connexion avant qu'il y ait plus de dégâts !
        this.socket.close();
    },
    onClose: function() {
        console.warn('[Websocket] Cette méthode devrait être redéfinie !');
    }
});