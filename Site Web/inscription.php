<?php
	session_start();
	
	function verif_alpha($str){
    	preg_match("/([^A-Za-z])/",$str,$result);
		//On cherche tous les caractères autre que [A-z] 
		if(!empty($result)){//si on trouve des caractère autre que A-z
			return false;
		}
    	return true;
	}
	
	function verif_alphaNum($str){
		preg_match("/([^A-Za-z0-9])/",$str,$result);
		//On cherche tous les caractères autre que [A-Za-z] ou [0-9]
		if(!empty($result)){//si on trouve des caractère autre que A-Za-z ou 0-9
			return false;
		}
		return true;
	}
	
	function verif_email($str){
		preg_match("/([\w\-]+\@[\w\-]+\.[\w\-]+)/",$str, $result);
		
		if(empty($result)) {
			return false;
		}
		return true;
	}
	
	//envoyer un mail 
	function envoie_mail($email) {
		if (!preg_match("#^[a-z0-9._-]+@(hotmail|live|msn).[a-z]{2,4}$#", $mail))
		{
			$passage_ligne = "\r\n";
		}
		else
		{
			$passage_ligne = "\n";
		}
		
		//=====Déclaration des messages au format texte et au format HTML.
		$message_txt = "Salut à tous, voici un e-mail envoyé par un script PHP.";
		$message_html = "<html><head></head><body><b>Salut à tous</b>, voici un e-mail envoyé par un <i>script PHP</i>.</body></html>";
		//==========
		 
		//=====Création de la boundary
		$boundary = "-----=".md5(rand());
		//==========
		 
		//=====Définition du sujet.
		$sujet = "Hey mon ami !";
		//=========
		 
		//=====Création du header de l'e-mail
		$header = "From: \"Hyukchan Kwon\"<hkwon@insa-rennes.fr>".$passage_ligne;
		$header .= "Reply-to: \"Hyukchan Kwon\" <hkwon@insa-rennes.fr>".$passage_ligne;
		$header .= "MIME-Version: 1.0".$passage_ligne;
		$header .= "Content-Type: multipart/alternative;".$passage_ligne." boundary=\"$boundary\"".$passage_ligne;
		//==========
		 
		//=====Création du message.
		$message = $passage_ligne."--".$boundary.$passage_ligne;
		//=====Ajout du message au format texte.
		$message.= "Content-Type: text/plain; charset=\"ISO-8859-1\"".$passage_ligne;
		$message.= "Content-Transfer-Encoding: 8bit".$passage_ligne;
		$message.= $passage_ligne.$message_txt.$passage_ligne;
		//==========
		$message.= $passage_ligne."--".$boundary.$passage_ligne;
		//=====Ajout du message au format HTML
		$message.= "Content-Type: text/html; charset=\"ISO-8859-1\"".$passage_ligne;
		$message.= "Content-Transfer-Encoding: 8bit".$passage_ligne;
		$message.= $passage_ligne.$message_html.$passage_ligne;
		//==========
		$message.= $passage_ligne."--".$boundary."--".$passage_ligne;
		$message.= $passage_ligne."--".$boundary."--".$passage_ligne;
		//==========
		 
		//=====Envoi de l'e-mail.
		mail($email,$sujet,$message,$header);
		//==========
	}
	
	if(isset($_POST['prenom']) AND isset($_POST['nom']) AND isset($_POST['email']) AND isset($_POST['motdepasse']))
    { // si le formulaire a été envoyé
    	if($_POST['prenom'] !="" AND $_POST['nom'] !="" AND $_POST['email'] !="" AND $_POST['motdepasse'] !="")
    	{ //si le formulaire est au complet alors
			if(verif_alpha($_POST['prenom']) && verif_alpha($_POST['nom']))
			{ //si le prénom et nom sont bien alphabétiques alors
				if(verif_email($_POST['email']))
				{ //si le mail est bien valide
					
					//connexion à la base de donnée
					include("connexion-bdd.php");
					
					$recherchePersonne = $bdd->query('SELECT COUNT(*) FROM membres WHERE prenom=\''.$_POST['prenom'].'\' AND nom=\''.$_POST['nom'].'\'') or die(print_r($bdd->errorInfo()));
					if($recherchePersonne->fetchColumn() == 0)
					{
						$rechercheEmail = $bdd->query('SELECT COUNT(*) FROM membres WHERE email=\''.$_POST['email'].'\'') or die(print_r($bdd->errorInfo()));
						if($rechercheEmail->fetchColumn() == 0)
						{
							$pass_hache = sha1($_POST['motdepasse']);
							$email = $_POST['email'];
							$prenom = ucwords(strtolower($_POST['prenom'])); //strtolower permet de mettre en minuscules, ucwords permet de mettre la première lettre en majuscule
							$nom = ucwords(strtolower($_POST['nom']));
							$moment_inscription = time();
							$inscription = $bdd->prepare('INSERT INTO membres(email, motdepasse, prenom, nom, moment_inscription) VALUES(:email, :pass, :prenom, :nom, :moment_inscription)');
							$inscription->execute(array(
							'email' => $email,
							'pass' => $pass_hache,
							'prenom' => $prenom,
							'nom' => $nom,
							'moment_inscription' => $moment_inscription)) or die(print_r($req->errorInfo()));
							envoie_mail($email);
							header("Location: connexion.php?msg=222222");
						}
						else{ //email existe déjà
							header("Location: inscription.php?msg=1");
						}
					}
					else{ //nom et prénom déjà inscrits
						header("Location: inscription.php?msg=2");
					}
				}
				else{ //email non correct
					header("Location: inscription.php?msg=3");
				}
			}
			else{ //prenom et nom non alphabétique
				header("Location: inscription.php?msg=4");
			}
		}
		else{ //formulaire incomplète
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
							switch ($_GET['msg'])
							{ 
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
								<input type="text" class="form-control" name="nom" placeholder="Nom">
							</div>
							<br />
							<div class="input-group">
								<span class="input-group-addon">P</span>
								<input type="text" class="form-control" name="prenom" placeholder="Prénom">
							</div>
							<br />
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