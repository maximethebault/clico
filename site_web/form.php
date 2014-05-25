<?php
session_start();
require_once 'config.php';
require 'server/php/libs/loadActiveRecord.php'
?>
<!DOCTYPE html>
<html>
    <?php include("header.php"); ?>
    <body>
        <div id="hc_bloc_page">
            <div id="hc_header">
            </div>
            <?php include("navbar.php"); ?>
            <div id="hc_corps">
                <div>
                    <h3>1. Sélection des étapes</h3>
                    <table class="model3d-selector-table model3d-form-selector">
                        <tr>
                            <td>
                                <?php
                                // TODO: replace 987654 by new model3d's actual ID
                                $processes = SpecProcess::find('all', array('include' => 'specParam', 'order' => 'ordering ASC'));
                                $order = -1;
                                foreach($processes as $process) {
                                    if($order < $process->ordering && $order !== -1) {
                                        echo '</td><td>';
                                    }
                                    echo '<span class="process" data-process-id="' . $process->id . '" data-model3d-id="987654">' . $process->name . '</span>';
                                    $order = $process->ordering;
                                }
                                ?>
                            </td>
                        </tr>
                    </table>
                </div>
                <div>
                    <h3>2. Paramétrage</h3>
                    <div class="model3d-form-params-panel-<?php echo 987654; ?> hidden">
                        <ul class="nav nav-tabs model3d-form-param-button-<?php echo 987654; ?>">
                            <?php
                            // TODO: replace 987654 by new model3d's actual ID
                            foreach($processes as $process) {
                                if(count($process->specParam)) {
                                    echo '<li class="hidden"><a href=".model3d-form-param-tab-' . $process->id . '-987654" class="model3d-form-param-button-' . $process->id . '-987654" data-toggle="tab">' . $process->name . '</a></li>';
                                }
                            }
                            ?>
                        </ul>
                        <div class="tab-content model3d-form-param-tab-<?php echo 987654; ?>">
                            <?php
                            foreach($processes as $process) {
                                $params = $process->specParam;
                                if(count($params)) {
                                    echo '<div class="tab-pane hidden fade model3d-form-param-tab-' . $process->id . '-987654">';
                                    foreach($params as $param) {
                                        echo '<h3>' . $param->name . '</h3>';
                                        echo '<span>Min : ' . $param->value_min . '</span><br />';
                                        echo '<span>Max : ' . $param->value_max . '</span><br />';
                                        echo '<span>Précision (= sensibilité du slider : si 0, passe d\'unité en unité, si 1, passe de x.1->x.2->x.3->etc.) : ' . $param->value_acc . '</span><br />';
                                        echo '<input type="number" class="model3d-form-param-' . $process->id . '-value"><br />';
                                    }
                                    echo '</div>';
                                }
                            }
                            ?>
                        </div>
                    </div>
                    <div class="model3d-form-params-message-<?php echo 987654; ?>">
                        Aucune étape à configurer !
                    </div>
                </div>
                <div>
                    <h3>3. Envoi des fichiers</h3>
                    <ul class="nav nav-tabs model3d-form-params">
                        <?php
                        // TODO: replace 987654 by new model3d's actual ID
                        $files = SpecFile::find('all');
                        foreach($files as $file) {
                            echo '<li><a href=".model3d-form-file-tab-' . $file->id . '-987654" class="model3d-form-file-button-' . $file->id . '-987654" data-toggle="tab">' . $file->name . '</a></li>';
                            // class="hidden"
                        }
                        ?>
                    </ul>
                    <div class="tab-content">
                        <?php
                        foreach($processes as $process) {
                            var_dump($process->specFileInput);
                            var_dump($process->specFileOutput);
                        }
                        ?>
                    </div>
                </div>
            </div>
        </div>
        <?php include("ressources-js.php"); ?>



        <!-- The template to display files available for upload -->
        <script id="template-upload" type="text/x-tmpl">
            {% for (var i=0, file; file=o.files[i]; i++) { %}
            <tr class="template-upload fade">
            <td>
            <span class="preview"></span>
            </td>
            <td>
            <p class="name">{%=file.name%}</p>
            <strong class="error text-danger"></strong>
            </td>
            <td>
            <p class="size">Traitement...</p>
            <div class="progress progress-striped active" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="progress-bar progress-bar-success" style="width:0%;"></div></div>
            </td>
            <td>
            {% if (!i && !o.options.autoUpload) { %}
            <button class="btn btn-primary start" disabled>
            <i class="glyphicon glyphicon-upload"></i>
            <span>Démarrer</span>
            </button>
            {% } %}
            {% if (!i) { %}
            <button class="btn btn-warning cancel">
            <i class="glyphicon glyphicon-ban-circle"></i>
            <span>Annuler</span>
            </button>
            {% } %}
            </td>
            </tr>
            {% } %}
        </script>

        <!-- The template to display files available for download -->
        <script id="template-download" type="text/x-tmpl">
            {% for (var i=0, file; file=o.files[i]; i++) { %}
            <tr class="template-download fade">
            <td>
            <span class="preview">
            {% if (file.thumbnailUrl) { %}
            <a href="{%=file.url%}" title="{%=file.name%}" download="{%=file.name%}" data-gallery><img src="{%=file.thumbnailUrl%}"></a>
            {% } %}
            </span>
            </td>
            <td>
            <p class="name">
            {% if (file.url) { %}
            <a href="{%=file.url%}" title="{%=file.name%}" download="{%=file.name%}" {%=file.thumbnailUrl?'data-gallery':''%}>{%=file.name%}</a>
            {% } else { %}
            <span>{%=file.name%}</span>
            {% } %}
            </p>
            {% if (file.error) { %}
            <div><span class="label label-danger">Erreur</span> {%=file.error%}</div>
            {% } %}
            </td>
            <td>
            <span class="size">{%=o.formatFileSize(file.size)%}</span>
            </td>
            <td>
            {% if (file.deleteUrl) { %}
            <button class="btn btn-danger delete" data-type="{%=file.deleteType%}" data-url="{%=file.deleteUrl%}"{% if (file.deleteWithCredentials) { %} data-xhr-fields='{"withCredentials":true}'{% } %}>
            <i class="glyphicon glyphicon-trash"></i>
            <span>Supprimer</span>
            </button>
            <input type="checkbox" name="delete" value="1" class="toggle">
            {% } else { %}
            <button class="btn btn-warning cancel">
            <i class="glyphicon glyphicon-ban-circle"></i>
            <span>Annuler</span>
            </button>
            {% } %}
            </td>
            </tr>
            {% } %}
        </script>

        <script id="template-params" type="text/x-tmpl">
            Paramètre de test : <input type="text" class="param" value="{% if (o.test) { %} {%=o.test.value%} {% } %}" data-name="test">
        </script>

        <!-- The template to display the upload form -->
        <script id="template-uploader" type="text/x-tmpl">
            <div data-id="{%=o.id%}" class="uploader">
            <blockquote>
            <div class="progress">
            <div class="progress-bar" id="3d_progress" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;">
            <span class="sr-only">0% Complete</span>
            </div>
            </div>
            <div style="text-align: center; margin-top: -20px; font-weight: bold;" id="3d_status">
            </div>
            <div style="text-align: center; font-weight: bold;" id="3d_state">
            </div>
            </blockquote>
            <form class="fileupload" action="/" method="POST" enctype="multipart/form-data">
            <!-- The fileupload-buttonbar contains buttons to add/delete files and start/cancel the upload -->
            <div class="row fileupload-buttonbar">
            <div class="col-lg-10">
            <button type="button" class="btn btn-info generate">
            <i class="glyphicon glyphicon-cloud-upload"></i>
            <span>Générer modèle 3D</span>
            </button>
            <button type="button" class="btn btn-danger delete-model3d">
            <i class="glyphicon glyphicon-trash"></i>
            <span>Supprimer le modèle 3D</span>
            </button>
            </div><br><br><br>
            <div class="col-lg-10 params">

            </div><br><br><br><br>
            <div class="col-lg-10">
            <!-- The fileinput-button span is used to style the file input field as button -->
            <span class="btn btn-success fileinput-button">
            <i class="glyphicon glyphicon-plus"></i>
            <span>Ajouter des fichiers...</span>
            <input type="file" name="files[]" multiple accept=".ply,image/*">
            </span>
            <button type="submit" class="btn btn-primary start">
            <i class="glyphicon glyphicon-upload"></i>
            <span>Démarrer l'envoi</span>
            </button>
            <button type="reset" class="btn btn-warning cancel">
            <i class="glyphicon glyphicon-ban-circle"></i>
            <span>Annuler l'envoi</span>
            </button>
            <button type="button" class="btn btn-danger delete">
            <i class="glyphicon glyphicon-trash"></i>
            <span>Supprimer</span>
            </button>
            <input type="checkbox" class="toggle">
            <!-- The global file processing state -->
            <span class="fileupload-process"></span>
            </div>
            <!-- The global progress state -->
            <div class="col-lg-5 fileupload-progress fade">
            <!-- The global progress bar -->
            <div class="progress progress-striped active" role="progressbar" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar progress-bar-success" style="width:0%;"></div>
            </div>
            <!-- The extended global progress state -->
            <div class="progress-extended">&nbsp;</div>
            </div>
            </div>
            <!-- The table listing the files available for upload/download -->
            <table role="presentation" class="table table-striped"><tbody class="files"></tbody></table>
            </form>
            </div>
        </script>

        <script src="js/underscore.js"></script>
        <script src="FileUpload/js/vendor/jquery.ui.widget.js"></script>
        <!-- The Templates plugin is included to render the upload/download listings -->
        <script src="FileUpload/js/tmpl.min.js"></script>
        <!-- The Load Image plugin is included for the preview images and image resizing functionality -->
        <script src="FileUpload/js/load-image.min.js"></script>
        <!-- The Canvas to Blob plugin is included for image resizing functionality -->
        <script src="FileUpload/js/canvas-to-blob.min.js"></script>
        <!-- blueimp Gallery script -->
        <script src="FileUpload/js/jquery.blueimp-gallery.min.js"></script>
        <!-- The Iframe Transport is required for browsers without support for XHR file uploads -->
        <script src="FileUpload/js/jquery.iframe-transport.js"></script>
        <!-- The basic File Upload plugin -->
        <script src="FileUpload/js/jquery.fileupload.js"></script>
        <!-- The File Upload processing plugin -->
        <script src="FileUpload/js/jquery.fileupload-process.js"></script>
        <!-- The File Upload image preview & resize plugin -->
        <script src="FileUpload/js/jquery.fileupload-image.js"></script>
        <!-- The File Upload audio preview plugin -->
        <script src="FileUpload/js/jquery.fileupload-audio.js"></script>
        <!-- The File Upload video preview plugin -->
        <script src="FileUpload/js/jquery.fileupload-video.js"></script>
        <!-- The File Upload validation plugin -->
        <script src="FileUpload/js/jquery.fileupload-validate.js"></script>
        <!-- The File Upload user interface plugin -->
        <script src="FileUpload/js/jquery.fileupload-ui.js"></script>

        <script>
            window.user_id = <?php echo intval($_SESSION['id']); ?>;</script>

        <script src="js/inherit.js"></script>
        <script src="js/node.js"></script>
        <script src="js/Socket.js"></script>
        <script src="js/ProgressManager.js"></script>
        <script src="js/model/Model3d.model.js"></script>
        <script src="js/model/Process.model.js"></script>
        <script src="js/model/SFM.model.js"></script>
        <script src="js/model/Param.model.js"></script>
        <script src="js/view/Params.view.js"></script>
        <script src="js/view/Model3d.view.js"></script>

        <script>
            $(document).on('change', '.btn-file :file', function() {
                var input = $(this);
                var numFiles = input.get(0).files ? input.get(0).files.length : 1;
                var label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
                input.trigger('fileselect', [numFiles, label]);
            });
            $(document).ready(function() {
                $('.btn-file :file').on('fileselect', function(event, numFiles, label) {
                    console.log(numFiles);
                    console.log(label);
                });
                //window.cnpao.View.Model3d.loadView();
            });</script>

        <script>
            $(document).ready(function() {
                $(".model3d-form-selector span.process").click(function() {
                    var hasClass = false;
                    if($(this).hasClass("process-selected"))
                        hasClass = true;
                    // on déselectionne tous les éléments de la cellule
                    $(this).parent().children('span.process').each(function() {
                        if($(this).hasClass("process-selected")) {
                            $(document).trigger('process-hide', [$(this).data('process-id'), $(this).data('model3d-id')]);
                            $(this).removeClass("process-selected");
                        }
                    });
                    // on (dé)sélectionne celui sur lequel on vient de cliquer
                    if(!hasClass) {
                        $(document).trigger('process-show', [$(this).data('process-id'), $(this).data('model3d-id')]);
                        $(this).addClass("process-selected");
                    }
                });
                $(document).on('process-hide', function(ev, processId, model3dId) {
                    $('.model3d-form-param-button-' + processId + '-' + model3dId).parent().addClass('hidden');
                    $('.model3d-form-param-tab-' + processId + '-' + model3dId).addClass('hidden');
                    // si tous les onglets sont cachés, on affiche un message spécial :
                    var toHide = true;
                    $('.model3d-form-param-button-' + model3dId + ' li').each(function() {
                        if(!$(this).hasClass('hidden')) {
                            toHide = false;
                            return false;
                        }
                    });
                    if(toHide) {
                        $('.model3d-form-params-panel-' + model3dId).addClass('hidden');
                        $('.model3d-form-params-message-' + model3dId).removeClass('hidden');
                    }
                });
                $(document).on('process-show', function(ev, processId, model3dId) {
                    $('.model3d-form-param-button-' + processId + '-' + model3dId).parent().removeClass('hidden');
                    $('.model3d-form-param-tab-' + processId + '-' + model3dId).removeClass('hidden');
                    // si tous les onglets sont cachés, on affiche un message spécial :
                    var toShow = false;
                    $('.model3d-form-param-button-' + model3dId + ' li').each(function() {
                        if(!$(this).hasClass('hidden')) {
                            toShow = true;
                            return false;
                        }
                    });
                    if(toShow) {
                        $('.model3d-form-params-panel-' + model3dId).removeClass('hidden');
                        $('.model3d-form-params-message-' + model3dId).addClass('hidden');
                    }
                });
            });
        </script>
    </body>
</html>