<?php
session_start();
if(isset($_COOKIE['membre_id']) && isset($_COOKIE['membre_mdp'])) //S'il en manque un, pas de session.
{
	if(intval($_COOKIE['membre_id']) != 0)
	{
		//idem qu'avec les $_SESSION
		include("identifiants.php");
		$query=$bdd->prepare('SELECT id, email, password FROM membres WHERE id= :membre_id');
		$query->bindValue(':membre_id',intval($_COOKIE['membre_id']),PDO::PARAM_INT);
		$query->execute();
		$data=$query->fetch();
	
		if(isset($data['email']) && $data['email'] != '')
		{
			if($_COOKIE['membre_mdp'] == $data['password'])
			{
				//Bienvenue :D
				$_SESSION['id'] = $data['id'];
			}
		}
	
		$query ->closeCursor();
	}
}
?>