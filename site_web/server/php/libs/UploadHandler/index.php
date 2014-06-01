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

function rename_file($name) {
    if(!preg_match('`^(.*)\.[a-z0-9]{2,5}$`i', $name))
        die('{"files":[{"error":"Extension non valide"}]}');
    if(!preg_match('`^[a-z0-9_\-]{1,20}\.[a-z0-9]{2,5}$`i', $name)) {
        // on renomme le fichier sans demander l'avis de personne
        // il faut qu'un même nom d'entrée donne toujours le même nom de sortie, hi sha1
        $filenameParts = explode('.', $name);
        $ext = array_pop($filenameParts);
        $name = substr(sha1(implode('.', $filenameParts)), 0, 10) . '.' . $ext;
        // maintenant que le nom est bien déguelasse comme il faut, on peut passer aux choses sérieuses !
    }
    return $name;
}
if(!array_key_exists('id', $_SESSION))
    die('{"files":[{"error":"Paramètre ID manquant !"}]}');
if(!array_key_exists('model3d_id', $_REQUEST))
    die('{"files":[{"error":"Paramètre MID manquant !"}]}');
if(!array_key_exists('spec_file_id', $_REQUEST))
    die('{"files":[{"error":"Paramètre SFID manquant !"}]}');
// on veut interdire l'upload de plusieurs fichiers à la fois.
// si plusieurs fichiers, $_FILES ressemble à :
/*
 * array(1) {
  ["files"]=>array(5) {
  ["name"]=>array(3) {
  [0]=>string(9)"file0.txt"
  [1]=>string(9)"file1.txt"
  [2]=>string(9)"file2.txt"
  }
  ...
  }
  }
 */
if(count($_FILES) && count($_FILES['files']['name']) > 1)
    die('{"files":[{"error":"Multi-upload non pris en charge"}]}');

$original_name = null;

// avant tout utilisation des fichiers, on regarde s'ils n'ont pas de noms trop bizarres ; si c'est le cas, on renomme !
if(count($_FILES) && $_FILES['files']['name'][0]) {
    if(!$original_name)
        $original_name = $_FILES['files']['name'][0];
    $_FILES['files']['name'][0] = rename_file($_FILES['files']['name'][0]);
}
if(array_key_exists('HTTP_CONTENT_DISPOSITION', $_SERVER)) {
    $nom = rawurldecode(preg_replace('/(^[^"]+")|("$)/', '', $_SERVER['HTTP_CONTENT_DISPOSITION']));
    if(!$original_name)
        $original_name = $nom;
    $_SERVER['HTTP_CONTENT_DISPOSITION'] = 'attachment; filename="' . rename_file($nom) . '"';
}
if(array_key_exists('file', $_GET)) {
    if(!$original_name)
        $original_name = $_GET['file'];
    $_GET['file'] = rename_file($_GET['file']);
}

try {
    $model3d = Model3d::find(intval($_REQUEST['model3d_id']), array('include' => array('files')));
    if($model3d->user_id != $_SESSION['id'])
        die(json_encode(array('files' => array(array('name' => $original_name, 'error' => 'La session a expiré. Veuillez vous reconnecter')))));
    elseif($model3d->configured)
        die(json_encode(array('files' => array(array('name' => $original_name, 'error' => 'Ce modèle 3D n\'est plus configurable !')))));
    $specFile = SpecFile::find(intval($_REQUEST['spec_file_id']));
}
catch(Exception $e) {
    die(json_encode(array('files' => array(array('name' => $original_name, 'error' => 'Le modèle 3D n\'existe plus')))));
}

$modelDataPath = 'data/' . intval($_REQUEST['model3d_id']) . '/';
@mkdir($modelDataPath, 0777);


if(array_key_exists('file', $_GET) || count($_FILES)) {
    $filePath = count($_FILES) ? $_FILES['files']['name'][0] : $_GET['file'];
    $file = File::first(array('conditions' => array('model3d_id = ? AND path = ?', intval($_REQUEST['model3d_id']), $modelDataPath . $filePath)));
    // TODO: faire en sorte que l'erreur suivante apparaisse plus tôt, dès le premier chunk uploadé... car sinon l'utilisateur attend TOUT l'upload avant de la voir apparaitre. Pas cool !
    if($file && $file->spec_file_id != intval($_REQUEST['spec_file_id']))
        die(json_encode(array('files' => array(array('name' => $original_name, 'size' => $file->size, 'error' => 'Un fichier avec le même nom a déjà été uploadé pour ce modèle, veuillez renommer le fichier.')))));
}

$options = array(
    'upload_dir' => '../../../../../' . $modelDataPath,
    'upload_url' => '../' . $modelDataPath,
    'script_url' => get_full_url() . '/?model3d_id=' . intval($_REQUEST['model3d_id']) . '&spec_file_id=' . intval($_REQUEST['spec_file_id'])
);

if(count($_FILES) && !$file && $specFile->multiplicity_max) {
    $count = 0;
    foreach($model3d->files as $file) {
        if($file->spec_file_id == intval($_REQUEST['spec_file_id']))
            $count++;
    }
    if($count >= $specFile->multiplicity_max)
        die(json_encode(array('files' => array(array('name' => $original_name, 'error' => 'Nombre maximum de fichiers atteint')))));
}

$options['accept_file_types'] = '`(\.|\/)(' . implode('|', explode(',', $specFile->extension)) . ')$`i';

if(array_key_exists('file', $_GET)) {
    $file = File::first(array('conditions' => array('model3d_id = ? AND path = ?', intval($_REQUEST['model3d_id']), $modelDataPath . $_GET['file'])));
    if($_SERVER['REQUEST_METHOD'] == 'DELETE') {
        if($file) {
            $file->delete();
            @unlink($options['upload_dir'] . $_GET['file']);
        }
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
            $file->spec_file_id = intval($_REQUEST['spec_file_id']);
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