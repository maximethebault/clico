<?php

header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

$model3d = Model3d::find(intval($_GET['id']));
if($model3d->user_id == $_SESSION['id']) {
    $model3d->delete_request = true;
    $model3d->save();
    echo json_encode(array('error' => 0));
}
else {
    die(json_encode(array('error' => 1, 'message' => "Vous n'avez pas les autorisations nécessaires !")));
}