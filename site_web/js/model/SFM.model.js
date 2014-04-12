window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.Model.SFM = inherit(window.cnpao.Model.Process, {
    __constructor: function() {
        this.__base();
        // la SFM est le premier Process qui doit être éxécuté
        this.priority = 10;
        this.name = 'SFM';
    }
});