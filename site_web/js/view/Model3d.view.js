window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.View.Model3d = inherit({
    __constructor: function(model) {
        this.model = model;
        $('#model3d-list').prepend(tmpl("template-model3d-form", {id: model._attrs.id}));
        this.$el = $('.model3d-form-' + model._attrs.id);
        this.bindEvents();

        // on met un dollar devant le nom de la variable pour mettre en valeur le fait qu'elle est passée par jQuery
        /*this.$el = $('.uploader[data-id=' + model.id + ']');
         $('.fileupload', this.$el).fileupload({
         url: 'server/php/libs/UploadHandler/',
         // lorsqu'on uploadera un fichier, on enverra avec l'ID du Model3d associé au fichier
         formData: {mid: model.id},
         dropZone: $('.fileupload', this.$el),
         disableImagePreview: true,
         disableImageLoad: true,
         disableImageHead: true,
         disableExif: true,
         disableExifThumbnail: true,
         disableExifSub: true,
         disableExifGps: true,
         disableImageMetaDataLoad: true,
         disableImageMetaDataSave: true,
         disableAudioPreview: true,
         disableVideoPreview: true,
         maxChunkSize: 5000000, // 5 MB
         add: function(e, data) {
         var that = this;
         $.getJSON('server/php/libs/UploadHandler/', {file: data.files[0].name, mid: model.id}, function(result) {
         var file = result.file;
         data.uploadedBytes = file && file.size;
         $.blueimp.fileupload.prototype
         .options.add.call(that, e, data);
         });
         }
         });
         $('.fileupload', this.$el).fileupload('option', 'done').call($('.fileupload', this.$el), $.Event('done'), {result: {files: this.model.files}});
         this.bindEvents();
         
         this.params = new window.cnpao.View.Params(this.model.params, this);*/
    },
    bindEvents: function() {
        var self = this;
        $(document).on('process-hide', function(ev, specProcessId, model3dId) {
            if(model3dId !== self.model._attrs.id)
                return;
            window.cnpao.Model.Process.get(false, {model3d_id: model3dId, spec_process_id: specProcessId}, self.model, function(err, res) {
                if(res[0]) {
                    res[0].del();
                }
            });
        });
        $(document).on('process-show', function(ev, specProcessId, model3dId) {
            if(model3dId !== self.model._attrs.id)
                return;
            var proc = new window.cnpao.Model.Process({model3d_id: model3dId, spec_process_id: specProcessId}, self.model);
            proc.create();
        });
        $(document).on('param-change', function(ev, newValue, specParamId, model3dId) {
            if(model3dId !== self.model._attrs.id)
                return;
            window.cnpao.Model.Param.get(false, {model3d_id: model3dId, spec_param_id: specParamId}, self.model, function(err, res) {
                // TODO: si l'utilisateur change très vite la valeur, le Param pourrait ne pas encore être dans le tableau stockant les Params
                // autre problème : beaucoup d'update : certaines se réalisent avant d'autres => à la fin, mauvaise valeur
                if(res[0]) {
                    res[0].update({
                        value: newValue
                    });
                }
                else {
                    var param = new window.cnpao.Model.Param({model3d_id: model3dId, spec_process_id: specParamId, value: newValue}, self.model);
                    param.create();
                }
            });
        });
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
},
{
    create: function() {
        var model = new window.cnpao.Model.Model3d();
        model.create(function(err) {
            new window.cnpao.View.Model3d(model);
        });
    },
    loadView: function() {
        /*window.cnpao.Model.Model3d.loadAjax(function(err, models) {
         if(err) {
         // TODO: afficher un message d'erreur si le chargement a échoué
         return;
         }
         _.forEach(models, function(model) {
         new window.cnpao.View.Model3d(model);
         });
         });*/
    }
});

$(document).on('click', '.btn-add-model3d', window.cnpao.View.Model3d.create);