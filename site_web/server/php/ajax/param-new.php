<?php
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

try {
$param = new Param();
$param->model3d_id = intval($_POST['model3d_id']);
$param->spec_param_id = intval($_POST['spec_param_id']);
$param->value = intval($_POST['value']);
$model3d = Model3d::find(intval($_POST['model3d_id']));
if($model3d->membres_id == $_SESSION['id']) {
    $param->save();
    echo $param->to_json();
}
else
    die(json_encode(array('error' => 1, 'message' => "Vous n'avez pas les autorisations nécessaires !")));
}
catch(Exception $e) {
    die(json_encode(array('error' => 1, 'message' => "Erreur d'insertion en base de données !")));
}