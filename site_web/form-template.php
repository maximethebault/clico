<div class="model3d-form-{%=o.id%} hc-model3d-form" style="position: relative; border: #aaaaaa solid 1px; border-radius: 20px; margin: 20px; padding: 20px;">
    <span class="hc-btn-delte model3d-delete-{%=o.id%}">
    	<img src="images/delete.png" alt="delete" title="delete"/>
    </span>
    <div>
        <h3>1. Sélection des étapes</h3>
        <table class="model3d-selector-table model3d-form-selector">
            <tr>
                <td>
                    <?php
                    $processes = SpecProcess::find('all', array('include' => 'specParam', 'order' => 'ordering ASC'));
                    $order = -1;
                    foreach($processes as $process) {
                        if($order < $process->ordering && $order !== -1) {
                            echo '</td><td>';
                        }
                        echo '<span class="process{% if(o.processSelected[' . $process->id . ']) { %} process-selected{% } %}" data-process-id="' . $process->id . '" data-model3d-id="{%=o.id%}" data-toggle="tooltip" data-placement="top">' . $process->name . '</span>';
                        $order = $process->ordering;
                    }
                    ?>
                </td>
            </tr>
        </table>
        <div class="sampling-warning{% if(!o.processSelected[4] || !o.processSelected[5]) { %}  hidden{% } %}" style="text-align: center;"><span class="label label-warning">Attention</span> Le sampling est incompatible avec le texturing</div>
    </div>
    <div>
        <h3>2. Paramétrage</h3>
        <div class="model3d-form-params-panel-{%=o.id%}{% if(!o.processAvailable) { %} hidden{% } %}">
            <ul class="nav nav-tabs model3d-form-param-button-{%=o.id%}">
                <?php
                foreach($processes as $process) {
                    if(count($process->specParam)) {
                        echo '<li class="{% if(!o.processSelected[' . $process->id . ']) { %}hidden{% } %}"><a href=".model3d-form-param-tab-' . $process->id . '-{%=o.id%}" class="model3d-form-param-button-' . $process->id . '-{%=o.id%}" data-toggle="tab">' . $process->name . '</a></li>';
                    }
                }
                ?>
            </ul>
            <div class="tab-content model3d-form-param-tab-{%=o.id%}">
                <?php
                foreach($processes as $process) {
                    $params = $process->specParam;
                    if(count($params)) {
                        echo '<div class="tab-pane{% if(!o.processSelected[' . $process->id . ']) { %} hidden{% } %} fade model3d-form-param-tab-' . $process->id . '-{%=o.id%}">';
                        foreach($params as $param) {
                            echo '<h4>' . $param->name . '</h4><br /><br />';
                            echo '<div data-spec-id="' . $param->id . '" data-default="' . $param->value_default . '" data-min="' . $param->value_min . '" data-max="' . $param->value_max . '" data-step="' . $param->value_step . '" data-acc="' . $param->value_acc . '" class="model3d-slide-{%=o.id%} model3d-form-param-value model3d-form-param-' . $process->id . '-value"></div><br /><br />';
                        }
                        echo '</div>';
                    }
                }
                ?>
            </div>
        </div>
        <div class="model3d-form-params-message-{%=o.id%}{% if(o.processAvailable) { %} hidden{% } %}">
            Aucune étape à configurer !
        </div>
    </div>
    <div>
        <h3>3. Envoi des fichiers</h3>
        <ul class="nav nav-tabs model3d-form-file-button-{%=o.id%}">
            <?php
            $files = SpecFile::find('all');
            foreach($files as $file) {
                echo '<li class="model3d-form-file-button hidden"><a href=".model3d-form-file-tab-' . $file->id . '-{%=o.id%}" class="model3d-form-file-button-' . $file->id . '-{%=o.id%}" data-toggle="tab">' . $file->name . '</a></li>';
            }
            ?>
        </ul>
        <div class="tab-content model3d-form-file-tab-{%=o.id%}">
            <?php
            foreach($files as $file) {
                echo '<div class="tab-pane hidden fade model3d-form-file-tab model3d-form-file-tab-' . $file->id . '-{%=o.id%}" data-max-file="' . $file->multiplicity_max . '" data-spec-file-id="' . $file->id . '">';
                ?>
                <form class="fileupload" action="/" method="POST" enctype="multipart/form-data">
                    <!-- The fileupload-buttonbar contains buttons to add/delete files and start/cancel the upload -->
                    <div class="row fileupload-buttonbar">
                        <div class="col-lg-10">
                            <!-- The fileinput-button span is used to style the file input field as button -->
                            <span class="btn btn-success fileinput-button">
                                <i class="glyphicon glyphicon-plus"></i>
                                <span>Ajouter des fichiers...</span>
                                <input type="file" name="files[]" multiple accept="<?php
                                $exts = explode(',', $file->extension);
                                foreach($exts as &$ext)
                                    $ext = '.' . $ext;
                                echo implode(',', $exts);
                                ?>">
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
                    <div class="hidden interrupt-warning"><span class="label label-warning">Attention</span> L'envoi de certains fichiers a été interrompu. Pour reprendre l'envoi, ajoutez les fichiers de nouveau.</div>
                </form>
                <?php
                echo '</div>';
            }
            ?>
        </div>
    </div>
    <div class="modal fade model3d-config-modal-{%=o.id%}" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">

                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                    <h4 class="modal-title">Lancement</h4>
                </div>

                <div class="modal-body">
                    <p>Vous êtes sur le point de lancer la génération d'un modèle.<br />
                        Une fois lancé, il ne sera plus configurable.</p>
                    <p>Voulez-vous continuer ?</p>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Non</button>
                    <button type="button" class="btn btn-primary primary model3d-config-modal-btn">Oui</button>
                </div>
            </div>
        </div>
    </div>
    <br /><br />
    <div class="model3d-validation-error hidden" style="position: absolute; margin-top: 7px;"><span class="label label-danger">Erreur</span> <span class="model3d-validation-error-message">Fichier non fourni.</span></div>
    <div style="text-align: center;">
	    <button type="button" class="btn btn-success btn-model3d-generate" data-toggle="modal" data-target=".model3d-config-modal-{%=o.id%}">
	        <i class="glyphicon glyphicon-cloud-upload"></i>
	        <span>Générer modèle 3D</span>
	    </button>
    </div>
    <br />
</div>