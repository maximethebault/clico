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

                <h1>{NOM}, du vestige archéologique au modèle 3D</h1>
                <p>Nous sommes quatre étudiants en première année Informatique à l'INSA de Rennes :</p>
                <ul>
                    <li> Hyukchan KWON </li>
                    <li> Guillaume ROY </li>
                    <li> Oana SUCIU </li>
                    <li> Maxime THEBAULT </li>
                </ul>
                <p>Dans le cadre des projets d'études pratiques de première année, nous avons travaillé sur l'élaboration d'une <b>Chaîne logicielle de génération de modèles 3D à partir de scans et de photos</b>. Suite à de nombreux tests, nous avons sélectionné les outils suivants : </p>
                <figure>
                    <a href="http://www.di.ens.fr/cmvs/" title="CMVS">CMVS</a><a href="http://meshlab.sourceforge.net/" title="MeshLab"><img src="http://upload.wikimedia.org/wikipedia/fr/e/e3/MeshLab_LOGO.png" height="64" width="64" alt="" /></a><a href="http://www.di.ens.fr/pmvs/" title="PMVS2">PMVS</a><a href="http://www.danielgm.net/cc/" title="CloudCompare"><img src="http://upload.wikimedia.org/wikipedia/commons/5/57/CloudCompareV2_logo.gif" height="64" width="64" alt="" /></a><a href="http://www.cs.jhu.edu/~misha/Code/PoissonRecon/Version5.71/" title="Screened Poisson Surface Reconstruction">PoissonRecon</a><a href="http://ccwu.me/vsfm/" title="VisualSFM"><img src="http://i1-win.softpedia-static.com/screenshots/icon-60/VisualSFM.png" height="64" width="64" alt="" /></a><a href="mailto:quentin.petit@insa-rennes.fr" title="Texturer">Texturer</a>
                </figure>
                <p><br />Cette chaîne logicielle est fonctionnelle, mais relativement complexe. C'est pourquoi nous avons décider de modifier notre cahier des charges et, au travers d'une <i>interface simple</i> et <i>ergonomique</i>, de <i>faciliter au maximum la numérisation de données archéologiques par un utilisateur</i> : {NOM}. </p>
                <p>Avec {NOM} <b>Chargez</b> vos photographies ou vos nuages de points, <b>paramétrez</b> en ligne les étapes de votre chaîne, <b>visualisez</b> en temps réel l'avancement du processus puis <b>téléchargez</b> votre modèle 3D !</p>

                <p><br />Pour de plus amples informations, nous vous invitons à consulter :</p>
                <ul>
                    <li> <a href="" title="CMVS">Notre dossier de projet</a> </li>
                    <li> <a href="DocUser.pdf" title="CMVS">La documentation utilisateur</a> </li>
                    <li> <a href="DocDeveloppeur.pdf" title="CMVS">La documentation développeur</a> </li>
                </ul>

                <h3 style="margin-bottom: 60px;">Génération de modèle 3D à partir de scans et de photos</h3>

                <div class="div-presentation">

                    <div class="presentation" style="width: 100%;">
                        <h4>La génération d'un modèle 3D n'a jamais été aussi simple</h4>
                        <p>Envoyez vos scans ou vos photos vers le serveur en quelques cliques, et la chaîne logicielle que nous avons conçu vous génère un modèle 3D automatiquement !</p>
                    </div>

                    <div class="presentation" style="width: 100%;">
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

                    <div class="presentation presentation-right" style="width: 55%;">
                        <img src="images/nodejs.png" />
                    </div>

                    <div class="hr" style="border: 0px;">
                    </div>
                </div>
            </div>

        </div>
        <?php include("ressources-js.php"); ?>
    </body>
</html>