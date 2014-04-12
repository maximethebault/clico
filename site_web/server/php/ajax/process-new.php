<?php
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
if(!array_key_exists('model3d_id', $_POST))
    die('Manque l\'id du modèle 3D');
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

error_reporting(E_ALL ^ E_NOTICE);

$process = new Process();
$process->name = (!empty($_POST['name'])) ? $_POST['name'] : '';
$process->model3d_id = intval($_POST['model3d_id']);
$model3d = Model3d::find(intval($_POST['model3d_id']));
if($model3d->membres_id == $_SESSION['id']) {
    $process->save();
    $process_id = $process->id;
    if(array_key_exists('params', $_POST)) {
        foreach($_POST['params'] as $paramRaw) {
            $param = new Param();
            $param->process_id = $process_id;
            $param->name = $paramRaw['name'];
            $param->value = $paramRaw['value'];
            $param->save();
        }
    }
    echo $process->to_json(array('include' => 'params'));
}
else {
    die(json_encode(array('error' => 1, 'message' => "Vous n'avez pas les autorisations nécessaires !")));
}