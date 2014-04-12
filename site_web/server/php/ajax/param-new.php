<?php
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

$param = new Param();
$param->process_id = $_POST['process_id'];
$param->name = $_POST['name'];
$param->value = $_POST['value'];
$process = Process::find(intval($_POST['process_id']));
if($process->model3d->membres_id == $_SESSION['id']) {
    $param->save();
    echo $param->to_json();
}
else
    die('Vous n\'êtes pas autorisé à ajouter des paramètres à ce modèle.');