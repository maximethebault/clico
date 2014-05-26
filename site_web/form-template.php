<div class="model3d-form-{%=o.id%}">
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
                        echo '<span class="process" data-process-id="' . $process->id . '" data-model3d-id="{%=o.id%}">' . $process->name . '</span>';
                        $order = $process->ordering;
                    }
                    ?>
                </td>
            </tr>
        </table>
    </div>
    <div>
        <h3>2. Paramétrage</h3>
        <div class="model3d-form-params-panel-{%=o.id%} hidden">
            <ul class="nav nav-tabs model3d-form-param-button-{%=o.id%}">
                <?php
                foreach($processes as $process) {
                    if(count($process->specParam)) {
                        echo '<li class="hidden"><a href=".model3d-form-param-tab-' . $process->id . '-{%=o.id%}" class="model3d-form-param-button-' . $process->id . '-{%=o.id%}" data-toggle="tab">' . $process->name . '</a></li>';
                    }
                }
                ?>
            </ul>
            <div class="tab-content model3d-form-param-tab-{%=o.id%}">
                <?php
                foreach($processes as $process) {
                    $params = $process->specParam;
                    if(count($params)) {
                        echo '<div class="tab-pane hidden fade model3d-form-param-tab-' . $process->id . '-{%=o.id%}">';
                        foreach($params as $param) {
                            echo '<h3>' . $param->name . '</h3>';
                            echo '<span>Min : ' . $param->value_min . '</span><br />';
                            echo '<span>Max : ' . $param->value_max . '</span><br />';
                            echo '<span>Précision (= sensibilité du slider : si 0, passe d\'unité en unité, si 1, passe de x.1->x.2->x.3->etc.) : ' . $param->value_acc . '</span><br />';
                            echo '<input type="number" class="model3d-form-param-value model3d-form-param-' . $process->id . '-value" data-model3d-id="{%=o.id%}" data-param-id="' . $param->id . '"><br />';
                        }
                        echo '</div>';
                    }
                }
                ?>
            </div>
        </div>
        <div class="model3d-form-params-message-{%=o.id%}">
            Aucune étape à configurer !
        </div>
    </div>
    <div>
        <h3>3. Envoi des fichiers</h3>
        <ul class="nav nav-tabs model3d-form-params">
            <?php
            $files = SpecFile::find('all');
            foreach($files as $file) {
                echo '<li><a href=".model3d-form-file-tab-' . $file->id . '-{%=o.id%}" class="model3d-form-file-button-' . $file->id . '-{%=o.id%}" data-toggle="tab">' . $file->name . '</a></li>';
                // class="hidden"
            }
            ?>
        </ul>
        <div class="tab-content">
            <?php
            foreach($processes as $process) {
                //var_dump($process->specFileInput);
                //var_dump($process->specFileOutput);
            }
            ?>
        </div>
    </div>
</div>