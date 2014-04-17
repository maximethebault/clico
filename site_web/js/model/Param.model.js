window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.Model.Param = inherit({
    __constructor: function(attrs) {
        this.id = (attrs && attrs.id) ? attrs.id : 0;
        this.name = (attrs && attrs.name) ? attrs.name : '';
        this.value = (attrs && attrs.value) ? attrs.value : '';
    },
    create: function(model3d_id, cb) {
        var self = this;
        var obj = this.toJSON();
        obj['model3d_id'] = model3d_id;
        $.ajax({
            url: 'server/php/ajax/param-new.php',
            type: 'POST',
            data: obj
        }).done(function(result) {
            var resParsed = JSON.parse(result);
            self.id = resParsed.id;
            if(cb)
                cb();
        });
    },
    setValue: function(value) {
        var self = this;
        this.value = value;
        if(this.id) {
            // le param existe en base : il faut le sauvegarder
            $.ajax({
                url: 'server/php/ajax/param-update.php',
                type: 'POST',
                data: {id: self.id, value: value}
            }).done(function(result) {
                var resParsed = JSON.parse(result);
                if(resParsed.hasOwnProperty('error') && resParsed.error != 0)
                    alert(resParsed.message);
            });
        }
    },
    toJSON: function() {
        return {
            name: this.name,
            value: this.value
        };
    }
},
{
    loadModels: function(models) {
        var obj = {};
        _.forEach(models, function(param) {
            obj[param.name] = new window.cnpao.Model.Param(param);
        });
        return obj;
    }
});