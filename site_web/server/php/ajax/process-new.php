<?php

header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
if(!array_key_exists('model3d_id', $_POST))
    die('Manque l\'id du modèle 3D');
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

$process = new Process();
$process->model3d_id = intval($_POST['model3d_id']);
$process->state = intval($_POST['state']);
$process->spec_process_id = intval($_POST['spec_process_id']);
$model3d = Model3d::find(intval($_POST['model3d_id']));
if($model3d->user_id != $_SESSION['id'])
    die(json_encode(array('error' => 1, 'message' => "Vous n'avez pas les autorisations nécessaires !")));
elseif($model3d->configured)
    die(json_encode(array('error' => 1, 'message' => "Ce modèle 3D n'est plus configurable !")));
else {
    try {
        // on va vérifier que la spec existe et qu'il n'existe pas déjà un Process avec le même order !
        $specProcess = SpecProcess::find(intval($_POST['spec_process_id']));
    }
    catch(Exception $e) {
        die(json_encode(array('error' => 1, 'message' => "Spécifications inconnues")));
    }
    try {
        $processesExisting = Process::find('all', array('include' => 'specProcess', 'conditions' => array('model3d_id = ?', intval($_POST['model3d_id']))));
        foreach($processesExisting as $processExisting) {
            if($processExisting->ordering == $specProcess->ordering)
                die(json_encode(array('error' => 1, 'message' => "Un Process avec le même ordering existe déjà !")));
        }
        $process->save();
        echo $process->to_json(array('include' => array('specProcess' => array('only' => array('id', 'name', 'ordering'), 'include' => array('specFileInput', 'specFileOutput')))));
    }
    catch(Exception $e) {
        die(json_encode(array('error' => 1, 'message' => "Erreur d'insertion en base de données ! (déjà un Process sous le même spec_process_id ?)")));
    }
}