window.cnpao = window.cnpao || {Model: {}, View: {}};

window.cnpao.View.Model3d = inherit({
    __constructor: function(model) {
        var self = this;
        self.model = model;
        var templateData = {
            id: model._attrs.id,
            processSelected: {},
            paramSelected: {},
            paramValue: {}
        };
        window.cnpao.Model.Process.get(false, {model3d_id: self.model._attrs.id}, self.model, function(err, res) {
            if(_.size(res))
                templateData.processAvailable = true;
            _.forEach(res, function(process) {
                templateData.processSelected[process._attrs.spec_process_id] = true;
            });
            window.cnpao.Model.Param.get(false, {model3d_id: self.model._attrs.id}, self.model, function(err, res) {
                _.forEach(res, function(param) {
                    templateData.paramSelected[param._attrs.spec_file_id] = true;
                    templateData.paramValue[param._attrs.spec_param_id] = param._attrs.value;
                });
                $('#model3d-list').prepend(tmpl("template-model3d-form", templateData));
                self.hideAndSeekFiles();
                self.$el = $('.model3d-form-' + model._attrs.id);
                self.bindEvents();
                $('.model3d-form-file-tab-' + self.model._attrs.id + '>div').each(function() {
                    var maxFile = $(this).data('max-file');
                    var sfid = $(this).data('spec-file-id');
                    var $this = $(this);
                    _.defer(function() {
                        $('.fileupload', $this).fileupload({
                            url: 'server/php/libs/UploadHandler/',
                            // lorsqu'on uploadera un fichier, on enverra avec l'ID du Model3d associé au fichier
                            formData: {model3d_id: self.model._attrs.id, spec_file_id: sfid},
                            dropZone: $('.fileupload', $this),
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
                            acceptFileTypes: new RegExp('(\.|\/)(' + (window.specFiles[sfid].extension.split(',')).join('|') + ')$', 'i'),
                            maxChunkSize: 5000000, // 5 MB
                            maxNumberOfFiles: (maxFile !== 0) ? maxFile : undefined,
                            add: function(e, data) {
                                var that = this;
                                $.getJSON('server/php/libs/UploadHandler/', {file: data.files[0].name, model3d_id: self.model._attrs.id, spec_file_id: sfid}, function(result) {
                                    var file = result.file;
                                    data.uploadedBytes = file && file.size;
                                    $.blueimp.fileupload.prototype.options.add.call(that, e, data);
                                });
                            }
                        }).on('fileuploadchunkfail', function() {
                            $('.interrupt-warning', $this).removeClass('hidden');
                        });
                        var filesToShow = [];
                        var incompleteFile = false;
                        _.forEach(self.model._attrs.files, function(file) {
                            if(!file.incomplete)
                                filesToShow.push(file);
                            else
                                incompleteFile = true;
                        });
                        $('.fileupload', $this).fileupload('option', 'done').call($('.fileupload', $this), $.Event('done'), {result: {files: filesToShow}});
                        if(incompleteFile)
                            $('.interrupt-warning', $this).removeClass('hidden');
                    });
                });
            });
        });
    },
    bindEvents: function() {
        var self = this;
        $(document).on('process-hide', function(ev, specProcessId, model3dId) {
            if(model3dId !== self.model._attrs.id)
                return;
            window.cnpao.Model.Process.get(false, {model3d_id: model3dId, spec_process_id: specProcessId}, self.model, function(err, res) {
                if(res[0]) {
                    res[0].del(function(err) {
                        if(!err)
                            self.hideAndSeekFiles();
                    });
                }
            });
        });
        $(document).on('process-show', function(ev, specProcessId, model3dId) {
            if(model3dId !== self.model._attrs.id)
                return;
            var proc = new window.cnpao.Model.Process({model3d_id: model3dId, spec_process_id: specProcessId}, self.model);
            proc.create(function(err) {
                if(!err)
                    self.hideAndSeekFiles();
            });
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
                    var param = new window.cnpao.Model.Param({model3d_id: model3dId, spec_param_id: specParamId, value: newValue}, self.model);
                    param.create();
                }
            });
        });
        $('.btn-model3d-generate', self.$el).on('click', function() {
            
        });
    },
    unbindEvents: function() {
        
    },
    /**
     * Montre/cache les File s'ils sont nécessaires
     */
    hideAndSeekFiles: function() {
        var self = this;
        self.model.calculateFileDeps(function(err, toShow) {
            $('.model3d-form-file-button-' + self.model._attrs.id + '>li').each(function() {
                $(this).addClass('hidden');
            });
            $('.model3d-form-file-tab-' + self.model._attrs.id + '>div').each(function() {
                $(this).addClass('hidden');
            });
            _.forEach(toShow, function(id) {
                $('.model3d-form-file-button-' + id + '-' + self.model._attrs.id).parent().removeClass('hidden');
                $('.model3d-form-file-tab-' + id + '-' + self.model._attrs.id).removeClass('hidden');
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
        window.cnpao.Model.Model3d.get(true, null, function(err, models) {
            if(err) {
                // TODO: afficher un message d'erreur si le chargement a échoué
                return;
            }
            _.forEach(models, function(model) {
                new window.cnpao.View.Model3d(model);
            });
        });
    }
});

$(document).on('click', '.btn-add-model3d', window.cnpao.View.Model3d.create);