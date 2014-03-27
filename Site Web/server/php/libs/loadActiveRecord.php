<?php
require_once 'ActiveRecord/ActiveRecord.php';

$cfg = ActiveRecord\Config::instance();
$cfg->set_model_directory(dirname(__FILE__) . '/../model');
$cfg->set_connections(array('production' => 'mysql://'.$conInfo['user'].':'.$conInfo['password'].'@'.$conInfo['host'].'/'.$conInfo['database'].';charset='.$conInfo['charset'].''));
$cfg->set_default_connection('production');