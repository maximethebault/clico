<?php

header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

try {
    $process = Process::find(intval($_GET['id']));
    if($process->model3d->user_id != $_SESSION['id'])
        die(json_encode(array('error' => 1, 'message' => "Vous n'avez pas les autorisations nécessaires !")));
    elseif($process->model3d->configured)
        die(json_encode(array('error' => 1, 'message' => "Ce modèle 3D n'est plus configurable !")));
    else {
        $process->delete();
        echo json_encode(array('error' => 0));
    }
}
catch(Exception $e) {
    die(json_encode(array('error' => 1, 'message' => "N'a pas pu supprimer le Process !")));
}