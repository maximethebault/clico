<?php
session_start();

function verif_alpha($str) {
    preg_match("/([^a-záàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ])/i", $str, $result);
    //On cherche tous les caractères autre que [A-z]
    if(!empty($result)) {//si on trouve des caractère autre que A-z
        return false;
    }
    return true;
}

function verif_alphaNum($str) {
    preg_match("/([^a-záàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ0-9])/i", $str, $result);
    //On cherche tous les caractères autre que [A-Za-z] ou [0-9]
    if(!empty($result)) {//si on trouve des caractère autre que A-Za-z ou 0-9
        return false;
    }
    return true;
}

function verif_email($str) {
    preg_match("/([\w\-]+\@[\w\-]+\.[\w\-]+)/i", $str, $result);

    if(empty($result)) {
        return false;
    }
    return true;
}

if(isset($_POST['name']) || isset($_POST['surname']) || isset($_POST['email']) || isset($_POST['password'])) { // si le formulaire a été envoyé
    if($_POST['name'] != "" && $_POST['surname'] != "" && $_POST['email'] != "" && $_POST['password'] != "") { //si le formulaire est au complet alors
        if(verif_alpha($_POST['name']) && verif_alpha($_POST['surname'])) { //si le prénom et nom sont bien alphabétiques alors
            if(verif_email($_POST['email'])) { //si le mail est bien valide
                //connexion à la base de donnée
                include("connexion-bdd.php");

                $recherchePersonne = $bdd->query('SELECT COUNT(*) FROM user WHERE name=\'' . $_POST['name'] . '\' AND surname=\'' . $_POST['surname'] . '\'') or die(print_r($bdd->errorInfo()));
                if($recherchePersonne->fetchColumn() == 0) {
                    $rechercheEmail = $bdd->query('SELECT COUNT(*) FROM user WHERE email=\'' . $_POST['email'] . '\'') or die(print_r($bdd->errorInfo()));
                    if($rechercheEmail->fetchColumn() == 0) {
                        $password = sha1($_POST['password']);
                        $email = $_POST['email'];
                        $name = ucwords(strtolower($_POST['name'])); //strtolower permet de mettre en minuscules, ucwords permet de mettre la première lettre en majuscule
                        $surname = ucwords(strtolower($_POST['surname']));
                        $date_added = time();
                        $inscription = $bdd->prepare('INSERT INTO user(email, password, name, surname, date_added) VALUES(:email, :password, :name, :surname, :date_added)');
                        $inscription->execute(array(
                                    'email' => $email,
                                    'password' => $password,
                                    'name' => $name,
                                    'surname' => $surname,
                                    'date_added' => $date_added)) or die(print_r($req->errorInfo()));
                        header("Location: connexion.php?msg=222222");
                    }
                    else { //email existe déjà
                        header("Location: inscription.php?msg=1");
                    }
                }
                else { //nom et prénom déjà inscrits
                    header("Location: inscription.php?msg=2");
                }
            }
            else { //email non correct
                header("Location: inscription.php?msg=3");
            }
        }
        else { //prenom et nom non alphabétique
            header("Location: inscription.php?msg=4");
        }
    }
    else { //formulaire incomplète
        header("Location: inscription.php?msg=5");
    }
}
?>

<!DOCTYPE html>
<html>
    <?php include("header.php"); ?>
    <body>

        <div id="hc_bloc_page">
            <div id="hc_header">
            </div>
            <?php include("navbar.php"); ?>
            <div id="hc_corps">
                <div id="form_inscription">
                    <?php
                    if(isset($_GET['msg'])) {
                        switch($_GET['msg']) {
                            case 1:
                                echo "<div class=\"alert alert-danger\">Cette adresse mail est déjà utilisé !</div>";
                                break;

                            case 2:
                                echo "<div class=\"alert alert-danger\">Cette personne existe déjà dans la base de donnée !</div>";
                                break;

                            case 3:
                                echo "<div class=\"alert alert-danger\">Votre adresse mail est incorrect !</div>";
                                break;

                            case 4:
                                echo "<div class=\"alert alert-danger\">Prénom et Nom doivent contenir que des caractères alphabétiques !</div>";
                                break;

                            case 5:
                                echo "<div class=\"alert alert-danger\">Vous devez remplir toutes les cases !</div>";
                                break;

                            default:
                        }
                    }
                    ?>
                    <div style="text-align:center; font-size: 15px; margin-top: 5px;">Formulaire d'inscription</div>
                    <form action="inscription.php" method="post">
                        <div class="form-group" style="width: 80%; margin:auto; margin-top: 15px; margin-bottom: 20px;">
                            <div class="input-group">
                                <span class="input-group-addon">N</span>
                                <input type="text" class="form-control" name="surname" placeholder="Nom">
                            </div>
                            <br />
                            <div class="input-group">
                                <span class="input-group-addon">P</span>
                                <input type="text" class="form-control" name="name" placeholder="Prénom">
                            </div>
                            <br />
                            <div class="input-group">
                                <span class="input-group-addon">@</span>
                                <input type="text" class="form-control" name="email" placeholder="E-mail">
                            </div>
                            <br />
                            <div class="input-group">
                                <span class="input-group-addon">#</span>
                                <input type="password" class="form-control" name="password" placeholder="Mot de passe">
                            </div>
                            <br />
                            <div style="width: 100px; margin: auto;">
                                <button type="submit" class="btn btn-default">S'inscrire</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <?php include("ressources-js.php"); ?>
    </body>
</html>