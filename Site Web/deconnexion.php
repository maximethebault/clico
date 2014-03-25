<?php 
session_start();
 
// Suppression des variables de session et de la session
$_SESSION = array();
 foreach($_COOKIE as $cle => $element)
    {
        setcookie($cle, '', time()-3600);
    }
session_destroy();
 

header("Location: connexion.php");


?>