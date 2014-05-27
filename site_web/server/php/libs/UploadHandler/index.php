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

require 'UploadHandler.php';
require_once '../../../../config.php';
require_once '../loadActiveRecord.php';

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
if(!array_key_exists('id', $_SESSION))
    die('{"files":[{"error":"Paramètre ID manquant !"}]}');
if(!array_key_exists('model3d_id', $_REQUEST))
    die('{"files":[{"error":"Paramètre MID manquant !"}]}');
if(!array_key_exists('spec_file_id', $_REQUEST))
    die('{"files":[{"error":"Paramètre SFID manquant !"}]}');

try {
    $model3d = Model3d::find(intval($_REQUEST['model3d_id']));
    if($model3d->membres_id != $_SESSION['id'])
        die('{"files":[{"error":"La session a expiré. Veuillez vous reconnecter"}]}');
    elseif($model3d->configured)
        die('{"files":[{"error":"Ce modèle 3D n\'est plus configurable !"}]}');
    $specFile = SpecFile::find(intval($_REQUEST['spec_file_id']));
}
catch(Exception $e) {
    die('{"files":[{"error":"Le modèle 3D n\'existe plus."}]}');
}

$modelDataPath = 'data/' . intval($_REQUEST['model3d_id']) . '/';
@mkdir($modelDataPath, 0777);

$options = array(
    'upload_dir' => '../../../../../' . $modelDataPath,
    'upload_url' => '../' . $modelDataPath,
    'script_url' => get_full_url() . '/?model3d_id=' . intval($_REQUEST['model3d_id']) . '&spec_file_id=' . intval($_REQUEST['spec_file_id'])
);

if($specFile->multiplicity_max)
    $options['max_number_of_files'] = $specFile->multiplicity_max;

$options['accept_file_types'] = '`(\.|\/)(' . implode('|', explode(',', $specFile->extension)) . ')$`';

if(array_key_exists('file', $_GET)) {
    $file = File::first(array('conditions' => array('model3d_id = ? AND path = ?', intval($_REQUEST['model3d_id']), $modelDataPath . $_GET['file'])));
    if($_SERVER['REQUEST_METHOD'] == 'DELETE') {
        if($file)
            $file->delete();
        else
            die;
    }
}
$upload_handler = new UploadHandler($options);
if($filePath = $upload_handler->getFileResult()) {
    if($_SERVER['REQUEST_METHOD'] == 'POST') {
        $file = File::first(array('conditions' => array('model3d_id = ? AND path = ?', intval($_REQUEST['model3d_id']), $modelDataPath . $filePath)));
        if(!$file) {
            $file = new File();
            $file->model3d_id = intval($_REQUEST['model3d_id']);
            $file->path = $modelDataPath . $filePath;
            $file->incomplete = $upload_handler->getFileIncomplete();
            $file->size = $upload_handler->getFileSize();
            $file->save();
        }
        elseif($file && $file->incomplete) {
            $file->incomplete = $upload_handler->getFileIncomplete();
            $file->size = $upload_handler->getFileSize();
            $file->save();
        }
    }
}