-- phpMyAdmin SQL Dump
-- version 4.2.6
-- http://www.phpmyadmin.net
--
-- Client :  localhost
-- Généré le :  Jeu 12 Février 2015 à 20:04
-- Version du serveur :  5.5.24-log
-- Version de PHP :  5.4.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Base de données :  `cnpao`
--

-- --------------------------------------------------------

--
-- Structure de la table `file`
--

CREATE TABLE IF NOT EXISTS `file` (
`id` int(11) NOT NULL,
  `model3d_id` int(11) NOT NULL,
  `spec_file_id` int(11) NOT NULL,
  `path` varchar(255) NOT NULL,
  `user_upload` tinyint(1) NOT NULL COMMENT 'Indique si ce fichier est un upload de l''utilisateur',
  `user_downloadable` tinyint(1) NOT NULL COMMENT 'Indique si ce fichier peut être téléchargé par l''utilisateur',
  `incomplete` tinyint(1) NOT NULL,
  `size` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `model3d`
--

CREATE TABLE IF NOT EXISTS `model3d` (
`id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `configured` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Indique si la phase de configuration/upload est passée',
  `command` int(11) NOT NULL DEFAULT '0' COMMENT 'Un ordre qui sera pris en compte par la chaîne logicielle. 0 : pause, 1 : continue, 2 : stop',
  `state` int(11) NOT NULL DEFAULT '0',
  `error` varchar(255) NOT NULL DEFAULT '',
  `delete_request` tinyint(1) NOT NULL COMMENT 'Passe à 1 quand le modèle 3D doit être supprimé'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `param`
--

CREATE TABLE IF NOT EXISTS `param` (
`id` int(11) NOT NULL,
  `model3d_id` int(11) NOT NULL,
  `spec_param_id` int(11) NOT NULL,
  `value` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `process`
--

CREATE TABLE IF NOT EXISTS `process` (
`id` int(11) NOT NULL,
  `model3d_id` int(11) NOT NULL,
  `spec_process_id` int(11) NOT NULL,
  `state` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `spec_file`
--

CREATE TABLE IF NOT EXISTS `spec_file` (
`id` int(11) NOT NULL,
  `code` varchar(255) NOT NULL COMMENT 'Servira à nommer les variables dans le code',
  `name` varchar(255) NOT NULL,
  `extension` varchar(255) NOT NULL,
  `multiplicity_min` int(11) NOT NULL COMMENT 'Le nombre minimum de fichiers à uploader (0 = pas de contraintes)',
  `multiplicity_max` int(11) NOT NULL COMMENT 'Le nombre maximum de fichiers à uploader (0 = pas de contraintes)'
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=7 ;

--
-- Contenu de la table `spec_file`
--

INSERT INTO `spec_file` (`id`, `code`, `name`, `extension`, `multiplicity_min`, `multiplicity_max`) VALUES
(1, 'sfmImages', 'Images SFM', 'jpg,jpeg,ppm,pgm', 3, 0),
(2, 'pointCloud', 'Nuage de points', 'ply,obj', 1, 1),
(3, 'mesh', 'Mesh', 'ply,obj', 1, 1),
(4, 'textureObj', 'Mesh texturé', 'obj', 1, 1),
(5, 'texturePng', 'Texture', 'png', 1, 1),
(6, 'textureMtl', 'Matériel pour la texture', 'mtl', 1, 1);

-- --------------------------------------------------------

--
-- Structure de la table `spec_param`
--

CREATE TABLE IF NOT EXISTS `spec_param` (
`id` int(11) NOT NULL,
  `spec_process_id` int(11) NOT NULL,
  `code` varchar(255) NOT NULL COMMENT 'Servira à nommer les variables dans le code',
  `name` varchar(255) NOT NULL,
  `value_min` int(11) DEFAULT NULL COMMENT 'null = pas de contraintes su le min',
  `value_max` int(11) DEFAULT NULL COMMENT 'null = pas de contraintes su le max',
  `value_acc` int(11) NOT NULL COMMENT 'Nombre de chiffres après la virgule pour le slider de sélection',
  `value_step` int(11) NOT NULL COMMENT 'Définit l''unité de déplacement dans le slider',
  `value_default` varchar(255) NOT NULL,
  `intern` tinyint(1) NOT NULL COMMENT 'Indique si ce paramètre est utilisé uniquement en interne par la chaîne logicielle (pas requis auprès de l''utilisateur)'
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=7 ;

--
-- Contenu de la table `spec_param`
--

INSERT INTO `spec_param` (`id`, `spec_process_id`, `code`, `name`, `value_min`, `value_max`, `value_acc`, `value_step`, `value_default`, `intern`) VALUES
(1, 2, 'subsamplingDensity', 'Densité', 0, 1, 2, 0, '0.01', 0),
(2, 3, 'poissonDepth', 'Profondeur', 8, 12, 0, 1, '10', 0),
(3, 3, 'poissonWeight', 'Poids', 0, 2, 0, 1, '1', 0),
(4, 4, 'samplingPointNumber', 'Nombre de points à retenir', 0, 80000000, 0, 100, '8000000', 0),
(5, 5, 'texturingBorder', 'Bordure', 0, 5, 0, 1, '5', 0),
(6, 5, 'texturingResolution', 'Résolution de la texture', 100, 20000, 0, 2, '4096', 0);

-- --------------------------------------------------------

--
-- Structure de la table `spec_process`
--

CREATE TABLE IF NOT EXISTS `spec_process` (
`id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `library_directory` varchar(255) NOT NULL,
  `library_name` varchar(255) NOT NULL,
  `ordering` decimal(10,0) NOT NULL,
  `description` text NOT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=6 ;

--
-- Contenu de la table `spec_process`
--

INSERT INTO `spec_process` (`id`, `name`, `library_directory`, `library_name`, `ordering`, `description`) VALUES
(1, 'SFM', 'sfm', 'sfm', '5', 'Construit un nuage de points à partir d''une séquence d''images d''un objet'),
(2, 'Subsampling', 'subsampling', 'subsampling', '10', 'Diminue la densité d''un nuage de points, de façon à minimiser le temps d''exécution de la numérisation'),
(3, 'Reconstruction de Poisson', 'reconstruction', 'poisson', '15', 'Génère un maillage à partir d''un nuage de points'),
(5, 'Texturing', 'texturing', 'texturing', '25', 'Applique la texture obtenue par un nuage de points sur un maillage');

-- --------------------------------------------------------

--
-- Structure de la table `spec_process_input`
--

CREATE TABLE IF NOT EXISTS `spec_process_input` (
`id` int(11) NOT NULL,
  `spec_process_id` int(11) NOT NULL,
  `spec_file_id` int(11) NOT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 COMMENT='Décrit les entrées nécessaires pour chaque Process' AUTO_INCREMENT=7 ;

--
-- Contenu de la table `spec_process_input`
--

INSERT INTO `spec_process_input` (`id`, `spec_process_id`, `spec_file_id`) VALUES
(1, 1, 1),
(2, 2, 2),
(3, 3, 2),
(4, 4, 3),
(5, 5, 2),
(6, 5, 3);

-- --------------------------------------------------------

--
-- Structure de la table `spec_process_output`
--

CREATE TABLE IF NOT EXISTS `spec_process_output` (
`id` int(11) NOT NULL,
  `spec_process_id` int(11) NOT NULL,
  `spec_file_id` int(11) NOT NULL
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 COMMENT='Décrit les sorties nécessaires pour chaque Process' AUTO_INCREMENT=8 ;

--
-- Contenu de la table `spec_process_output`
--

INSERT INTO `spec_process_output` (`id`, `spec_process_id`, `spec_file_id`) VALUES
(1, 1, 2),
(2, 2, 2),
(3, 3, 3),
(4, 4, 2),
(5, 5, 4),
(6, 5, 5),
(7, 5, 6);

-- --------------------------------------------------------

--
-- Structure de la table `spec_step`
--

CREATE TABLE IF NOT EXISTS `spec_step` (
`id` int(11) NOT NULL,
  `spec_process_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `library_name` varchar(255) NOT NULL,
  `ordering` decimal(10,0) NOT NULL,
  `timeout_run` int(11) NOT NULL DEFAULT '0' COMMENT 'Lors de l''utilisation de logiciels instables, nombre de secondes avant de mettre fin à la Step et remonter une erreur. 0 = pas de timeout. (en ms)',
  `timeout_pause` int(11) NOT NULL DEFAULT '0' COMMENT 'Lors de l''utilisation de logiciels instables, et après une demande de mise en pause non forcée, nombre de secondes avant de forcer la fermeture du logiciel. 0 = pas de timeout. (en ms)'
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=13 ;

--
-- Contenu de la table `spec_step`
--

INSERT INTO `spec_step` (`id`, `spec_process_id`, `name`, `library_name`, `ordering`, `timeout_run`, `timeout_pause`) VALUES
(1, 1, 'Ouverture des fichiers', 'open', '5', 0, 0),
(2, 1, 'Comparaison des images', 'compute_match', '10', 0, 0),
(3, 1, 'Reconstruction simple', 'reconstruction_sparse', '15', 0, 0),
(4, 1, 'Reconstruction dense', 'reconstruction_dense', '20', 0, 0),
(5, 2, 'Réduction du nuage de points', 'subsampling', '5', 0, 0),
(6, 3, 'Vérification de la taille', 'size', '5', 0, 0),
(7, 3, 'Calcul des normales', 'normal', '10', 7200000, 30000),
(8, 3, 'Reconstruction de Poisson', 'poisson', '15', 0, 0),
(9, 3, 'Suppression des défauts', 'delete_edges', '20', 600000, 30000),
(10, 4, 'Sampling', 'sampling', '5', 0, 0),
(11, 5, 'Conversion des données d''entrée', 'convert', '5', 0, 0),
(12, 5, 'Génération de la texture', 'texturing', '10', 0, 0);

-- --------------------------------------------------------

--
-- Structure de la table `step`
--

CREATE TABLE IF NOT EXISTS `step` (
`id` int(11) NOT NULL,
  `spec_step_id` int(11) NOT NULL,
  `process_id` int(11) NOT NULL,
  `state` int(11) NOT NULL,
  `progress` int(5) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Structure de la table `user`
--

CREATE TABLE IF NOT EXISTS `user` (
`id` int(11) NOT NULL,
  `surname` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `date_added` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  `admin` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Contenu de la table `user`
--

INSERT INTO `user` (`id`, `surname`, `name`, `email`, `password`, `date_added`, `status`, `admin`) VALUES
(4, 'Thébault', 'Maxime', 'maxime.thebault@insa-rennes.fr', '362ba2c239f0e37a2ce500fdc17f0cb4dbdb9746', 1395784730, 0, 0);

--
-- Index pour les tables exportées
--

--
-- Index pour la table `file`
--
ALTER TABLE `file`
 ADD PRIMARY KEY (`id`), ADD KEY `model3d_id` (`model3d_id`);

--
-- Index pour la table `model3d`
--
ALTER TABLE `model3d`
 ADD PRIMARY KEY (`id`), ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `param`
--
ALTER TABLE `param`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `model3d_id` (`model3d_id`,`spec_param_id`), ADD KEY `model3d_id_2` (`model3d_id`);

--
-- Index pour la table `process`
--
ALTER TABLE `process`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `spec_process_id` (`spec_process_id`,`model3d_id`), ADD KEY `model3d_id` (`model3d_id`);

--
-- Index pour la table `spec_file`
--
ALTER TABLE `spec_file`
 ADD PRIMARY KEY (`id`);

--
-- Index pour la table `spec_param`
--
ALTER TABLE `spec_param`
 ADD PRIMARY KEY (`id`);

--
-- Index pour la table `spec_process`
--
ALTER TABLE `spec_process`
 ADD PRIMARY KEY (`id`);

--
-- Index pour la table `spec_process_input`
--
ALTER TABLE `spec_process_input`
 ADD PRIMARY KEY (`id`);

--
-- Index pour la table `spec_process_output`
--
ALTER TABLE `spec_process_output`
 ADD PRIMARY KEY (`id`);

--
-- Index pour la table `spec_step`
--
ALTER TABLE `spec_step`
 ADD PRIMARY KEY (`id`);

--
-- Index pour la table `step`
--
ALTER TABLE `step`
 ADD PRIMARY KEY (`id`), ADD UNIQUE KEY `spec_step_id` (`spec_step_id`,`process_id`), ADD KEY `process_id` (`process_id`);

--
-- Index pour la table `user`
--
ALTER TABLE `user`
 ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT pour les tables exportées
--

--
-- AUTO_INCREMENT pour la table `file`
--
ALTER TABLE `file`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT pour la table `model3d`
--
ALTER TABLE `model3d`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT pour la table `param`
--
ALTER TABLE `param`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT pour la table `process`
--
ALTER TABLE `process`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT pour la table `spec_file`
--
ALTER TABLE `spec_file`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT pour la table `spec_param`
--
ALTER TABLE `spec_param`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT pour la table `spec_process`
--
ALTER TABLE `spec_process`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=6;
--
-- AUTO_INCREMENT pour la table `spec_process_input`
--
ALTER TABLE `spec_process_input`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=7;
--
-- AUTO_INCREMENT pour la table `spec_process_output`
--
ALTER TABLE `spec_process_output`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=8;
--
-- AUTO_INCREMENT pour la table `spec_step`
--
ALTER TABLE `spec_step`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=13;
--
-- AUTO_INCREMENT pour la table `step`
--
ALTER TABLE `step`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT pour la table `user`
--
ALTER TABLE `user`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=5;
