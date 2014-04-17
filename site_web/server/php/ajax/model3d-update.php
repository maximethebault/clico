<?php
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

$model3d = Model3d::find(intval($_REQUEST['id']));
if($model3d->membres_id == $_SESSION['id']) {
    if(array_key_exists('name', $_POST))
        $model3d->name = $_POST['name'];
    if(array_key_exists('order', $_POST))
        $model3d->order = $_POST['order'];
    $model3d->save();
    if(array_key_exists('params', $_POST)) {
        foreach($_POST['params'] as $paramRaw) {
            $param = new Param();
            $param->model3d_id = $model3d->id;
            $param->name = $paramRaw['name'];
            $param->value = $paramRaw['value'];
            $param->save();
        }
    }
    echo $model3d->to_json(array('include' => 'params'));
}
else {
    die(json_encode(array('error' => 1, 'message' => "Vous n'avez pas les autorisations nécessaires !")));
}