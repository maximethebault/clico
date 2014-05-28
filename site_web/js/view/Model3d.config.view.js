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
            var idToLook = [];
            _.forEach(res, function(process) {
                templateData.process[process._attrs.spec_process_id] = process._attrs;
                idToLook.push(process._attrs.id);
            });
            window.cnpao.Model.Step.get(false, {process_id: idToLook}, null, function(err, res) {
                _.forEach(res, function(step) {
                    templateData.step[step._attrs.spec_step_id] = step._attrs;
                    if(templateData.step[step._attrs.spec_step_id].progress === 0 && templateData.step[step._attrs.spec_step_id].state >= window.cnpao.Constants.STATE_RUNNING)
                        templateData.step[step._attrs.spec_step_id].progress = 100;
                });
                if(self.$el)
                    self.$el.replaceWith(tmpl("template-model3d-progress", templateData));
                else
                    $('#model3d-list').prepend(tmpl("template-model3d-progress", templateData));
                self.$el = $('.model3d-progress-' + self.model._attrs.id);
            });
        });
    },
    modelUpdate: function(e, id) {
        var self = this;
        if(id == self.model._attrs.id)
            self.updateView();
    },
    bindEvents: function() {
        $(document).on('model-update', this.modelUpdate.bind(this));
    },
    unbindEvents: function() {
        $(document).off('model-update', this.modelUpdate.bind(this));
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