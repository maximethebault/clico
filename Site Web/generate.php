<?php
session_start();
?>
<!DOCTYPE html>
<html>
    <?php include("header.php"); ?>
    <link rel="stylesheet" href="FileUpload/css/jquery.fileupload.css" type="text/css">
    <link rel="stylesheet" href="FileUpload/css/jquery.fileupload-ui.css" type="text/css">
    <body>

        <div id="hc_bloc_page">
            <div id="hc_header">
            </div>
            <?php include("navbar.php"); ?>
            <div id="hc_corps">
                <ul class="nav nav-tabs" id="myTab">
                    <li class="active"><a href="#nuages" data-toggle="tab">J'ai des nuages de points</a></li>
                    <li><a href="#photos" data-toggle="tab">J'ai des photos</a></li>
                </ul>

                <div class="tab-content">
                    <div class="tab-pane active" id="nuages">
                        <br />
                        <div style="width: 40%; min-height: 100px;">
                            <div class="input-group">

                                <span class="input-group-btn">
                                    <span class="btn btn-primary btn-file">
                                        Browse...
                                        <input type="file" multiple>
                                    </span>
                                </span>
                                <input type="text" class="form-control" readonly="">
                            </div>
                        </div>
                    </div>
                    <div class="tab-pane" id="photos">
                        <button type="button" class="btn btn-info add-model3d">
                            <i class="glyphicon glyphicon-cloud-upload"></i>
                            <span>Ajouter un nouveau modèle 3D</span>
                        </button>
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
            <button type="button" class="btn btn-danger delete-model3d">
            <i class="glyphicon glyphicon-trash"></i>
            <span>Supprimer le modèle 3D</span>
            </button>
            </div>
            <div class="col-lg-10">
            <!-- The fileinput-button span is used to style the file input field as button -->
            <span class="btn btn-success fileinput-button">
            <i class="glyphicon glyphicon-plus"></i>
            <span>Ajouter des fichiers...</span>
            <input type="file" name="files[]" multiple>
            </span>
            <button type="submit" class="btn btn-primary start">
            <i class="glyphicon glyphicon-upload"></i>
            <span>Démarrer l'envoi</span>
            </button>
            <button type="button" class="btn btn-info generate">
            <i class="glyphicon glyphicon-cloud-upload"></i>
            <span>Générer modèle 3D</span>
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


        <script src="FileUpload/js/vendor/jquery.ui.widget.js"></script>
        <!-- The Templates plugin is included to render the upload/download listings -->
        <script src="http://blueimp.github.io/JavaScript-Templates/js/tmpl.min.js"></script>
        <!-- The Load Image plugin is included for the preview images and image resizing functionality -->
        <script src="http://blueimp.github.io/JavaScript-Load-Image/js/load-image.min.js"></script>
        <!-- The Canvas to Blob plugin is included for image resizing functionality -->
        <script src="http://blueimp.github.io/JavaScript-Canvas-to-Blob/js/canvas-to-blob.min.js"></script>
        <!-- blueimp Gallery script -->
        <script src="http://blueimp.github.io/Gallery/js/jquery.blueimp-gallery.min.js"></script>
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
        <!-- The main application script
        <script src="FileUpload/js/main.js"></script>
        // TODO: ré-implémenter les mêmes fonctionnalités : charger les fichiers déjà uploadés
        -->
        <script>
            window.user_id = <?php echo intval($_SESSION['id']); ?>;
        </script>

        <script src="js/inherit.js"></script>
        <script src="js/node.js"></script>
        <script src="js/Socket.js"></script>
        <script src="js/ProgressManager.js"></script>
        <script src="js/model/Model3d.js"></script>
        <script src="js/model/Process.js"></script>
        <script src="js/model/SFM.js"></script>
        <script src="js/view/model3d.js"></script>

        <script>
            $(document)
            .on('change', '.btn-file :file', function() {
            var input = $(this),
            numFiles = input.get(0).files ? input.get(0).files.length : 1,
            label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
            input.trigger('fileselect', [numFiles, label]);
            });

            $(document).ready( function() {
            $('.btn-file :file').on('fileselect', function(event, numFiles, label) {
            console.log(numFiles);
            console.log(label);
            });
            });
        </script>
    </body>
</html>