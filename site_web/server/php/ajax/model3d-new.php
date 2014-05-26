<?php
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

$model3d = new Model3d();
$model3d->membres_id = $_SESSION['id'];
$model3d->save();
echo $model3d->to_json();