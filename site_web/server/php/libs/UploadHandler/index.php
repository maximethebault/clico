<?php
/*
 * jQuery File Upload Plugin PHP Example 5.14
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

error_reporting(E_ALL | E_STRICT);

session_start();
if(!array_key_exists('id', $_SESSION))
    die;
if(!array_key_exists('mid', $_REQUEST))
    die('Id du modèle manquant');

function get_full_url() {
    $https = !empty($_SERVER['HTTPS']) && strcasecmp($_SERVER['HTTPS'], 'on') === 0;
    return
            ($https ? 'https://' : 'http://') .
            (!empty($_SERVER['REMOTE_USER']) ? $_SERVER['REMOTE_USER'] . '@' : '') .
            (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : ($_SERVER['SERVER_NAME'] .
                    ($https && $_SERVER['SERVER_PORT'] === 443 ||
                    $_SERVER['SERVER_PORT'] === 80 ? '' : ':' . $_SERVER['SERVER_PORT']))) .
            substr($_SERVER['SCRIPT_NAME'], 0, strrpos($_SERVER['SCRIPT_NAME'], '/'));
}
require 'UploadHandler.php';
require_once '../../../../config.php';
require_once '../loadActiveRecord.php';
// TODO: vérifier si l'utilisateur a bien les droits sur ce modèle !
$modelDataPath = 'data/' . intval($_REQUEST['mid']) . '/';
@mkdir($modelDataPath, 0777);
$upload_handler = new UploadHandler(array('upload_dir' => '../../../../../' . $modelDataPath, 'upload_url' => '../' . $modelDataPath, 'script_url' => get_full_url() . '/?mid=' . intval($_REQUEST['mid'])));
if($filePath = $upload_handler->getFileResult()) {
    if($_SERVER['REQUEST_METHOD'] == 'DELETE') {
        $file = File::first(array('conditions' => array('model3d_id = ? AND path = ?', intval($_REQUEST['mid']), $modelDataPath . $filePath)));
        $file->delete();
    }
    elseif($_SERVER['REQUEST_METHOD'] == 'POST') {
        $file = new File();
        $file->model3d_id = intval($_REQUEST['mid']);
        $file->path = $modelDataPath . $filePath;
        $file->save();
    }
}