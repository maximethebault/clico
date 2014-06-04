<?php

function affiche_menu_gauche() {
    // tableaux contenant les liens d'accès et le texte à afficher
    $tab_menu_lien = array("index.php", "inscription.php", "connexion.php", "generate.php");
    $tab_menu_texte = array("Accueil", "Inscription", "Connexion", "Génération");

    // informations sur la page
    $info = pathinfo($_SERVER['PHP_SELF']);
    $menuGauche = "";
    // boucle qui parcours les deux tableaux
    foreach($tab_menu_lien as $cle => $lien) {
        //si on est connecté, et que la page n'est utilise qu'aux personnes non connectés alors :
        if((isset($_SESSION['id']) && ( $lien == "inscription.php" || $lien == "connexion.php"))) {
            //on ne fait rien
        }
        //si on est pas connecté, on ne peut pas voir les pages réservées aux membres
        elseif((!isset($_SESSION['id'])) && ($lien == "generate.php")) {
            //on ne fait rien
        }
        else {
            $menuGauche .= "    <li";
            // si le nom du fichier correspond à celui pointé par l'indice, alors on l'active
            if($info['basename'] == $lien) {
                $menuGauche .= " class=\"active\"";
            }

            $menuGauche .= "><a href=\"" . $lien . "\">" . $tab_menu_texte[$cle] . "</a></li>\n";
        }
    }

    return $menuGauche;
}

function affiche_menu_droite() {
    $menuDroite = "";
    if(isset($_SESSION['id'])) {
        include("connexion-bdd.php");
        $query = $bdd->prepare('SELECT surname, name FROM user WHERE id= :user_id');
        $query->bindValue(':user_id', $_SESSION['id'], PDO::PARAM_INT);
        $query->execute();
        $data = $query->fetch();

        $menuDroite .= "<li class=\"dropdown\">
								<a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">" . $data['name'] . " " . $data['surname'] . "</a>";
        $menuDroite .= "<ul class=\"dropdown-menu\">
		                        <li><a href=\"deconnexion.php\">Déconnexion</a></li>
							</ul></li>";
    }

    return $menuDroite;
}
?>


<nav class="navbar navbar-default hc-navbar" role="navigation">
    <div class="container-fluid">
        <!-- Brand and toggle get grouped for better mobile display -->

        <div class="navbar-header">
            <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1"><span class="sr-only">Toggle navigation</span></button>
        </div><!-- Collect the nav links, forms, and other content for toggling -->

        <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
            <ul class="nav navbar-nav">
                <?php
                echo affiche_menu_gauche();
                ?>
            </ul>

            <ul class="nav navbar-nav navbar-right">
                <?php
                echo affiche_menu_droite();
                ?>
            </ul>
        </div><!-- /.navbar-collapse -->
    </div><!-- /.container-fluid -->
</nav>
