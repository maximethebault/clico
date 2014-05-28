window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.View.Model3dConfigured = inherit({
    __constructor: function(model) {
        this.model = model;
        this.updateView();
    },
    updateView: function() {
        var self = this;
        var templateData = {
            id: self.model._attrs.id,
            process: {},
            step: {}
        };
        window.cnpao.Model.Process.get(false, {model3d_id: self.model._attrs.id}, self.model, function(err, res) {
            _.forEach(res, function(process) {
                templateData.process[process._attrs.spec_process_id] = process._attrs;
            });
            window.cnpao.Model.Step.get(false, {process_id: _.keys(templateData.process)}, null, function(err, res) {
                _.forEach(res, function(step) {
                    templateData.step[step._attrs.spec_step_id] = step._attrs;
                });
                if(self.$el)
                    self.$el.replaceWith(tmpl("template-model3d-progress", templateData));
                else
                    $('#model3d-list').prepend(tmpl("template-model3d-progress", templateData));
                self.$el = $('.model3d-progress-' + self.model._attrs.id);
            });
        });
    },
    bindEvents: function() {

    },
    unbindEvents: function() {

    },
    destroy: function() {
        this.unbindEvents();
        this.$el.remove();
    },
    deleteModel: function() {
        this.model.del(function(err) {
            if(err === 0) {
                this.$el.remove();
            }
            else {
                //TODO: échec lors de la suppression du modèle, gérer l'erreur
            }
        }.bind(this));
    }
});