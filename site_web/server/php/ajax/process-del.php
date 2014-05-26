<?php
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

try {
    $process = Process::find(intval($_GET['id']));
    if($process->model3d->membres_id == $_SESSION['id']) {
        // TODO: supprimer tout ce qui est associé : files, process & leurs propres Step, etc.
        $process->delete();
        echo json_encode(array('error' => 0));
    }
    else {
        die(json_encode(array('error' => 1, 'message' => "Vous n'avez pas les autorisations nécessaires !")));
    }
}
catch(Exception $e) {
    die(json_encode(array('error' => 1, 'message' => "N'a pas pu supprimer le Process !")));
}