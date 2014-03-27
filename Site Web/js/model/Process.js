window.cnpao = window.cnpao || {};

/**
 * Array.map existe en JS, mais pas Object.map... D'où cette fonction
 */
function mapObject(obj, callback) {
    var result = {};
    Object.keys(obj).forEach(function (key) {
        result[key] = callback.call(obj, obj[key], key, obj);
    });
    return result;
}


/**
 * Classe abstraite
 */
window.cnpao.Process = inherit([window.cnpao.ProgressManager], {
    __constructor: function() {
        this.initProgressManager();
        this.model3d_id = 0;
        this.priority = 0;
        this.order = window.cnpao.Model3d.RUN;
        this.params = {};
        //$(this).on('_record-id', this.setRecordId);
    },
    addParam: function(param) {
        this.params[param.name] = param;
    },
    launch: function() {
        /*socket.send(this, {
            action: 'vsfm-new',
            images: images
        });*/
    },
    create: function() {
        var self = this;
        $.ajax({
            url: 'server/php/ajax/process-new.php',
            type: 'POST',
            data: this.toJSON()
        }).done(function(result) {
            var resParsed = JSON.parse(result);
            if(resParsed.hasOwnProperty('error') && resParsed.error != 0)
                alert(resParsed.message);
            else {
                self.id = resParsed.id;
                resParsed.params.forEach(function(param) {
                    if(self.params.hasOwnProperty(param.name)) {
                        self.params[param.name].id = param.id;
                    }
                });
            }
        });
    },
    toJSON: function() {
        return {
            name: this.name,
            model3d_id: this.model3d_id,
            order: this.order,
            priority: this.priority,
            params: mapObject(this.params, function(param) {
                return param.toJSON();
            })
        };
    }
});