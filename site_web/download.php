<?php

set_time_limit(0);
session_start();

require_once 'config.php';
require_once 'server/php/libs/loadActiveRecord.php';

if(!array_key_exists('id', $_SESSION))
    die('La session a expiré. Veuillez vous reconnecter !');
if(!array_key_exists('file_id', $_REQUEST))
    die('Paramètre file_id manquant !');

$file = File::find(intval($_REQUEST['file_id']), array('include' => array('model3d')));
if($file->model3d->user_id != $_SESSION['id'])
    die('La session a expiré. Veuillez vous reconnecter !');

$filePath = '../' . $file->path;

if(file_exists($filePath)) {
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename=' . basename($filePath));
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($filePath));
    ob_clean();
    flush();
    readfile($filePath);
    exit;
}
