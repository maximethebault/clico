window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.View.Params = inherit({
    __constructor: function(model, parentView) {
        this.model = model;
        this.parentView = parentView;
        // on met un dollar devant le nom de la variable pour mettre en valeur le fait qu'elle est passée par jQuery
        this.$el = $('.params', this.parentView.$el);
        this.$el.html(tmpl("template-params", model));
        this.bindEvents();
    },
    bindEvents: function() {
        $('.param', this.$el).on('keyup', {context: this}, this.changeValue);
    },
    unbindEvents: function() {
        $('.param', this.$el).off('keyup');
    },
    changeValue: function(event) {
        var viewContext = event.data.context;
        var name = $(this).data('name');
        if(viewContext.model.hasOwnProperty(name))
            viewContext.model[name].setValue($(this).val());
        else {
            viewContext.model[name] = new window.cnpao.Model.Param({name: name, value: $(this).val()});
            viewContext.model[name].create(viewContext.parentView.model.id);
        }
    }
},
{
});