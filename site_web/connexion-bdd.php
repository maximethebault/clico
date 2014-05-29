<?php

require 'config.php';
try {
    $bdd = new PDO('mysql:host=' . $conInfo['host'] . ';dbname=' . $conInfo['database'] . '', $conInfo['user'], $conInfo['password'], array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES \'UTF8\''));
}
catch(Exception $e) {
    die('Erreur : ' . $e->getMessage());
}