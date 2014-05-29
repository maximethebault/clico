<?php

session_start();
if(isset($_COOKIE['user_id']) && isset($_COOKIE['password'])) { //S'il en manque un, pas de session.
    if(intval($_COOKIE['user_id']) != 0) {
        //idem qu'avec les $_SESSION
        include("identifiants.php");
        $query = $bdd->prepare('SELECT id, email, password FROM user WHERE id= :user_id');
        $query->bindValue(':user_id', intval($_COOKIE['uid']), PDO::PARAM_INT);
        $query->execute();
        $data = $query->fetch();

        if(isset($data['email']) && $data['email'] != '') {
            if($_COOKIE['password'] == $data['password']) {
                //Bienvenue :D
                $_SESSION['id'] = $data['id'];
            }
        }

        $query->closeCursor();
    }
}
?>