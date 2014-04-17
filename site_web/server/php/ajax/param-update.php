<?php
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

$param = Param::find(intval($_REQUEST['id']));
if($param->model3d->membres_id == $_SESSION['id']) {
    if(array_key_exists('name', $_POST))
        $param->name = $_POST['name'];
    if(array_key_exists('value', $_POST))
        $param->value = $_POST['value'];
    $param->save();
    echo $param->to_json();
}
else {
    die(json_encode(array('error' => 1, 'message' => "Vous n'avez pas les autorisations nécessaires !")));
}