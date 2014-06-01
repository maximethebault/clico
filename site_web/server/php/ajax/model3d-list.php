<?php

header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

if(!intval($_SESSION['id']))
    die;
$arrayCond = array('delete_request=0 AND user_id=?', intval($_SESSION['id']));
if(intval($_GET['id'])) {
    $arrayCond[0] .= ' AND id=?';
    $arrayCond[] = intval($_GET['id']);
}
$model3ds = Model3d::all(array('order' => 'id ASC', 'conditions' => $arrayCond, 'include' => array('processes' => array('include' => 'steps'), 'params', 'files')));
echo '[' . implode(',', array_map(
                function($model3d) {
            return $model3d->to_json(array('include' => array('processes' => array('include' => 'steps'), 'params', 'files' => array('only' => array('spec_file_id', 'size', 'incomplete'), 'methods' => array('name', 'url', 'thumbnailUrl', 'deleteUrl', 'deleteType')))));
        }, $model3ds)) . ']';
