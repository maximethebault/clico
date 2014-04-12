window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.Model.Param = inherit({
    __constructor: function(id, name, value) {
        this.__base();
        this.id = id;
        this.name = name;
        this.value = value;
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
                if(resParsed.error != 0)
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
});