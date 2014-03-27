<?php
include("verif-cookies.php");
if(isset($_POST['email']) AND isset($_POST['motdepasse'])) {
    //connexion à la base de donnée
    include("connexion-bdd.php");

    $email = $_POST['email'];
    $pass_hache = sha1($_POST['motdepasse']);
    $connexion = $bdd->prepare('SELECT membres_id, motdepasse FROM membres WHERE email = :email AND motdepasse = :motdepasse');
    $connexion->execute(array(
                'email' => $email,
                'motdepasse' => $pass_hache)) or die(print_r($req->errorInfo()));

    $resultat = $connexion->fetch();

    if(!$resultat) {
        header("Location: connexion.php?msg=1");
    }
    else {
        if(isset($_POST['cookie'])) {
            setcookie('membre_id', $resultat['id'], time() + 365 * 24 * 3600);
            setcookie('membre_mdp', $resultat['password'], time() + 365 * 24 * 3600);
        }
        session_start();
        $_SESSION['id'] = $resultat['membres_id'];
        $_SESSION['email'] = $email;
        header("Location: index.php");
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
            echo "<div class=\"alert alert-danger\">Votre pseudo ou votre mot de passe est incorrect.</div>";
            break;

        case 2:
            echo "<div class=\"alert alert-success\"><strong>Inscription réussis.</strong><br /> Vous pouvez dès à présent vous connecter !</div>";
            break;

        default:
    }
}
?>
                    <div style="text-align:center; font-size: 15px; margin-top: 5px;">Formulaire de connexion</div>
                    <form action="connexion.php" method="post">
                        <div class="form-group" style="width: 80%; margin:auto; margin-top: 15px; margin-bottom: 20px;">
                            <div class="input-group">
                                <span class="input-group-addon">@</span>
                                <input type="text" class="form-control" name="email" placeholder="E-mail">
                            </div>
                            <br />
                            <div class="input-group">
                                <span class="input-group-addon">#</span>
                                <input type="password" class="form-control" name="motdepasse" placeholder="Mot de passe">
                            </div>
                            <br />
                            <div style="width: 100px; margin: auto;">
                                <button type="submit" class="btn btn-default">Se connecter</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
<?php include("ressources-js.php"); ?>
    </body>
</html>