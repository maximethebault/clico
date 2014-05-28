<div class="model3d-progress-{%=o.id%}" style="position: relative; border: #aaaaaa solid 1px; border-radius: 20px; margin: 20px; padding: 20px;">
    <div>
        <h3>Génération de modèle 3D</h3>
        <table class="model3d-selector-table">
            <tr>
                <td>
                    <?php
                    $processes = SpecProcess::find('all', array('include' => 'specParam', 'order' => 'ordering ASC'));
                    $order = -1;
                    foreach($processes as $process) {
                        if($order < $process->ordering && $order !== -1) {
                            echo '</td><td>';
                        }
                        echo '<span class="process{% if(o.process[' . $process->id . '] && o.process[' . $process->id . '].state == 0) { %} process-selected{% } else if(o.process[' . $process->id . '] && o.process[' . $process->id . '].state == 1) { %} process-loading{% } else if(o.process[' . $process->id . '] && o.process[' . $process->id . '].state == 2) { %} process-done{% } %}" data-process-id="' . $process->id . '" data-model3d-id="{%=o.id%}">' . $process->name . '</span>';
                        $order = $process->ordering;
                    }
                    ?>
                </td>
            </tr>
        </table>
        <div class="model3d-steps">
            <?php
            foreach($processes as $process) {
                echo '<div class="model3d-step model3d-step-' . $process->id . '{% if(!o.process[' . $process->id . ']) { %} hidden{% } %}">';
                echo '<h2>' . $process->name . '</h2>';
                $i = 1;
                foreach($process->specStep as $step) {
                    echo '<span class="step-name">' . $i . '. ' . $step->name . '</span>';
                    ?>
                    <div class="progress progress-striped{% if(o.step[<?php echo $step->id; ?>].state === 1) { %} active{% } %}">
                        <div class="progress-bar" role="progressbar" aria-valuenow="{%=o.step[<?php echo $step->id; ?>].progress%}" aria-valuemin="0" aria-valuemax="100" style="width: {%=o.step[<?php echo $step->id; ?>].progress%}%">
                        </div>
                    </div>
                    <?php
                    $i++;
                }
                echo '</div>';
            }
            ?>
        </div>
    </div>
</div>