<?php

header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

$param = Param::find(intval($_REQUEST['id']));
if($param->model3d->user_id != $_SESSION['id'])
    die(json_encode(array('error' => 1, 'message' => "Vous n'avez pas les autorisations nécessaires !")));
elseif($param->model3d->configured)
    die(json_encode(array('error' => 1, 'message' => "Ce modèle 3D n'est plus configurable !")));
else {
    if(array_key_exists('value', $_POST))
        $param->value = floatval($_POST['value']);
    $param->save();
    echo $param->to_json();
}