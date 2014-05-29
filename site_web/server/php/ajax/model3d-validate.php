<?php

header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

try {
    $model3d = Model3d::find(intval($_REQUEST['id']), array('include' => array('processes' => array('include' => 'specProcess'), 'files')));
    if($model3d->configured)
        die(json_encode(array('error' => 1, 'message' => "Modèle 3D déjà configuré !")));
    if($model3d->user_id == $_SESSION['id']) {
        $processes = $model3d->processes;
        if(!count($processes))
            die(json_encode(array('error' => 1, 'message' => "Aucune étape n'a été sélectionnée !")));
        // trie des Process en fonction de leurs ordering
        usort($processes, function($a, $b) {
            return $a->specProcess->ordering - $b->specProcess->ordering;
        });
        $specProcessIds = array();
        // contiendra la liste des dépendances à fournir par l'utilisateur, sous la forme d'une liste d'IDs de File
        $deps = array();
        // contiendra la liste des IDs de File rencontrés en output pendant le traitement
        $globalOutput = array();
        // l'algo est assez simple : dès qu'on n'a pas déjà rencontré l'input d'un Process en output d'un autre jusqu'alors, c'est que l'utilisateur doit le fournir !
        foreach($processes as $process) {
            foreach($process->specProcess->specFileInput as $file) {
                if(in_array($file->id, $globalOutput) === false) {
                    $deps[] = $file->id;
                    $globalOutput[] = $file->id;
                }
            }
            foreach($process->specProcess->specFileOutput as $file) {
                if(in_array($file->id, $globalOutput) === false) {
                    $globalOutput[] = $file->id;
                }
            }
            $specProcessIds[$process->id] = $process->spec_process_id;
        }
        // tableau associatif : spec_file_id => nbFilesUploaded
        $nbFiles = array();
        foreach($model3d->files as $file) {
            if($file->incomplete)
                continue;
            if(!array_key_exists($file->spec_file_id, $nbFiles))
                $nbFiles[$file->spec_file_id] = 1;
            else
                $nbFiles[$file->spec_file_id] ++;
        }
        if(!count($deps))
            die(json_encode(array('error' => 1, 'message' => "Aucune dépendance trouvée.")));
        $specFiles = SpecFile::find($deps);
        // s'il n'y a qu'un enregistrement, il sera retourné directement... on met tout le monde dans des arrays !
        if(!is_array($specFiles))
            $specFiles = array($specFiles);
        foreach($specFiles as $specFile) {
            if(!array_key_exists($specFile->id, $nbFiles))
                $nbFiles[$specFile->id] = 0;
            if($specFile->multiplicity_min && $nbFiles[$specFile->id] < $specFile->multiplicity_min)
                die(json_encode(array('error' => 1, 'message' => $specFile->multiplicity_min . " fichier(s) \"" . $specFile->name . "\" est(sont) nécessaire(s), mais vous n'en avez fourni que " . $nbFiles[$specFile->id] . " !")));
            elseif($specFile->multiplicity_max && $nbFiles[$specFile->id] > $specFile->multiplicity_max)
                die(json_encode(array('error' => 1, 'message' => "Au plus " . $specFile->multiplicity_max . " fichier(s) \"" . $specFile->name . "\" est(sont) nécessaire(s), mais vous en avez fourni " . $nbFiles[$specFile->id] . " !")));
        }
        /*
         *  Initialisation des Process & Step en fonction des spec & formulaire
         */
        // 1) On récupère toutes les Steps liés aux Process créés :
        $specSteps = SpecStep::find('all', array('conditions' => array('spec_process_id IN (?)', $specProcessIds)));
        // le tableau $specProcessIds a la forme suivante : process_id -> spec_process_id.
        // par la suite, on va vouloir trouver process_id à partir de spec_process_id,
        // il nous faudrait donc le tableau dans l'autre sens. Tada :
        $specProcessIds = array_flip($specProcessIds);
        foreach($specSteps as $specStep) {
            $stepNew = new Step();
            $stepNew->spec_step_id = $specStep->id;
            $stepNew->process_id = $specProcessIds[$specStep->spec_process_id];
            $stepNew->save();
        }
        // si on est arrivé jusque là, bonne nouvelle (à priori !)
        $model3d->command = 1;
        $model3d->configured = true;
        $model3d->save();
        echo json_encode(array('error' => 0));
    }
    else {
        die(json_encode(array('error' => 1, 'message' => "Vous n'avez pas les autorisations nécessaires !")));
    }
}
catch(Exception $e) {
    die(json_encode(array('error' => 1, 'message' => "Impossible de valider l'envoi du modèle !")));
}