<?php
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

$param = new Param();
$param->model3d_id = $_POST['model3d_id'];
$param->name = $_POST['name'];
$param->value = $_POST['value'];
$model3d = Model3d::find(intval($_POST['model3d_id']));
if($model3d->membres_id == $_SESSION['id']) {
    $param->save();
    echo $param->to_json();
}
else
    die('Vous n\'êtes pas autorisé à ajouter des paramètres à ce modèle.');