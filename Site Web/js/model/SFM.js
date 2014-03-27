window.cnpao = window.cnpao || {};

window.cnpao.SFM = inherit(window.cnpao.Process, {
    __constructor: function() {
        this.__base();
        // la SFM est le premier Process qui doit être éxécuté
        this.priority = 10;
        this.name = 'SFM';
    }
});