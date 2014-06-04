<?php
session_start();
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
                <h3 style="margin-bottom: 60px;">cliCo, du vestige archéologique au modèle 3D</h3>

                <div class="div-presentation">

                    <div class="presentation" style="width: 100%;">
                        <h4>La génération d'un modèle 3D n'a jamais été aussi simple</h4>
                        <br />
                        <p>Avec cliCo, <b>chargez</b> vos photographies ou vos nuages de points, <b>paramétrez</b> en ligne les étapes de votre chaîne, <b>visualisez</b> en temps réel l'avancement du processus puis <b>téléchargez</b> votre modèle 3D !</p>
                        <p><i>Au travers d'une interface simple et ergonomique, nous facilitons au maximum la numérisation de données archéologiques pour l'utilisateur.</i></p>
                    </div>

                    <div class="presentation" style="width: 100%; text-align:center;">
                        <img src="images/chaine_logicielle.png" />
                    </div>

                    <div class="hr">
                    </div>

                    <div class="presentation presentation-left"  style="width: 33%;">
                        <img src="images/logiciels.png" />
                    </div>

                    <div class="presentation presentation-left"  style="width: 60%;">
                        <br />
                        <h4>Logiciels performants, libres ou gratuits</h4>
                        <br />
                        <p>Nous avons choisi les meilleurs logiciels qui permettent de générer un modèle 3D.<br />
                            Grâce à ces logiciels, le rendu final est époustouflant !</p>
                    </div>

                    <div class="hr">
                    </div>

                    <div class="presentation presentation-left"  style="width: 45%;">
                        <h4>Suivi en temps réel</h4>
                        <br />
                        <p>Grâce à l'utilisation de Node.JS, un langage de programmation asynchrone, vous aurez un suivi sur la progression en temps réel !</p>
                    </div>

                    <div class="presentation presentation-right" style="width: 55%; text-align: center;">
                        <img src="images/nodejs.png" />
                    </div>

                    <div class="hr">
                    </div>
                    
                    <div class="presentation">
						<p>Pour de plus amples informations, nous vous invitons à consulter :</p>
						<ul>
							<li><a href="https://github.com/maximethebault/clico" title="Répertoire Github">Le répertoire Github</a></li>
							<li><a href="DocUser.pdf" title="Documentation utilisateur">La documentation utilisateur</a></li>
						</ul>
                    </div>
                </div>
            </div>
        </div>
        <?php include("ressources-js.php"); ?>
    </body>
</html>
