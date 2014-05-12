window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.Model.Process = inherit([window.cnpao.ProgressManager], {
    __constructor: function() {
        this.initProgressManager();
        this.model3d_id = 0;
        this.priority = 0;
        this.command = window.cnpao.Model.Model3d.RUN;
        //$(this).on('_record-id', this.setRecordId);
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
        });
    },
    toJSON: function() {
        return {
            name: this.name,
            model3d_id: this.model3d_id,
            command: this.command,
            priority: this.priority
        };
    }
},
{
    loadModels: function(models) {
        return _.map(models, function(process) {
            return new window.cnpao.Model.Process(process);
        });
    }
});