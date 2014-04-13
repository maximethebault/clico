window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.Model.Process = inherit([window.cnpao.ProgressManager], {
    __constructor: function() {
        this.initProgressManager();
        this.model3d_id = 0;
        this.priority = 0;
        this.order = window.cnpao.Model.Model3d.RUN;
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
            params: _.map(this.params, function(param) {
                return param.toJSON();
            })
        };
    }
},
{
    loadModels: function(models) {
        return _.map(models, function(process) {
            if(process.params)
                process.params = window.cnpao.Model.Param.loadModels(process.params);
            return new window.cnpao.Model.Process(process);
        });
    }
});