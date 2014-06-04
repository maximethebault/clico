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
                <h3 style="margin-bottom: 60px; font-size: 18px; color: #ff6200;"><img src="images/clico.png" /><br />du vestige archéologique au modèle 3D</h3>
				
                <div class="div-presentation">
                    
                    <div class="presentation" style="width: 100%;">
                        <h4>La génération d'un modèle 3D n'a jamais été aussi simple !</h4>
                        <br />
                        <p>Avec cliCo, <b>chargez</b> vos photographies ou vos nuages de points, <b>paramétrez</b> en ligne les étapes de votre chaîne, <b>visualisez</b> en temps réel l'avancement du processus puis <b>téléchargez</b> votre modèle 3D !</p>
                        <p><center><i>"Au travers d'une interface simple et ergonomique, nous facilitons au maximum la numérisation de vos données archéologiques."</i></center></p>
                    </div>

                    <div class="presentation" style="width: 100%; text-align:center;">
                        <img src="images/chaine_logicielle.png" />
                    </div>

                    <div class="hr">
                    </div>

                    <div class="presentation presentation-left"  style="width: 33%; text-align: center;">
                        <a href="http://ccwu.me/vsfm/" class="lien-logiciel">Visual SFM</a>
                        <a href="http://www.danielgm.net/cc/" class="lien-logiciel">CloudCompare</a>
                        <a href="http://www.cs.jhu.edu/~misha/Code/PoissonRecon/Version5.71/" class="lien-logiciel">PoissonRecon</a>
                        <a href="http://meshlab.sourceforge.net" class="lien-logiciel">MeshLab</a>
                        <a href="mailto:quentin.petit@insa-rennes.fr" class="lien-logiciel">Texturer</a>
                        <a href="http://www.di.ens.fr/cmvs/" class="lien-logiciel">CMVS/PMVS</a>
                    </div>

                    <div class="presentation presentation-left"  style="width: 60%;">
                        <br />
                        <h4>Logiciels performants, libres ou gratuits</h4>
                        <br />
                        <p>Nous avons testé et sélectionné les meilleures application permettant de générer un modèle 3D. Cette variété logicielle vous permet une importante modularité et couvre de nombreux processus, de la reconstruction dense au plaquage de textures.<br /></p>
                    </div>

                    <div class="hr">
                    </div>

                    <div class="presentation presentation-left"  style="width: 45%;">
                        <h4>Suivi en temps réel</h4>
                        <br />
                        <p>Grâce à l'utilisation de Node.JS, un puissant outil de programmation orienté événements, nous vous garantissons un suivi de la progression en temps réel !</p>
                    </div>

                    <div class="presentation presentation-right" style="width: 55%; text-align: center;">
                        <img src="images/nodejs.png" />
                    </div>

                    <div class="hr">
                    </div>
                    
                    <div class="presentation presentation-left" style="width: 50%; text-align: center;">
                    	<br />
                    	<img src="images/mail.png"/>
                    </div>
                    
                    <div class="presentation presentation-right" style="width:50%;">
                    	<h4>Notification par mail</h4>
                    	<br />
                    	<p>N'attendez plus devant votre ordinateur pour savoir quand se terminera votre numérisation : cliCo vous envoie un mail une fois le processus terminé.</p>
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
