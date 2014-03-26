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
if(!array_key_exists('mid', $_POST))
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
// TODO: vérifier si l'utilisateur a bien les droits sur ce modèle !
$modelDataPath = '../../../../../data/' . intval($_POST['mid']) . '/';
@mkdir($modelDataPath, 0777);
$upload_handler = new UploadHandler(array('upload_dir' => $modelDataPath, 'upload_url' => $modelDataPath, 'script_url' => get_full_url() . '/?mid=' . intval($_POST['mid'])));
