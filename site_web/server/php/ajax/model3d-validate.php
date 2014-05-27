<?php
header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");
session_start();
if(!array_key_exists('id', $_SESSION))
    die;
require_once '../../../config.php';
require_once '../libs/loadActiveRecord.php';

$model3d = Model3d::find(intval($_REQUEST['id']), array('include' => array('processes' => array('include' => 'specProcess'), 'files')));
if($model3d->membres_id == $_SESSION['id']) {
    $processes = $model3d->processes;
    // trie des Process en fonction de leurs ordering
    usort($processes, function($a, $b) {
        return $a->specProcess->ordering - $b->specProcess->ordering;
    });
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
    $specFiles = SpecFile::find($deps);
    foreach($specFiles as $specFile) {
        if(!array_key_exists($specFile->id, $nbFiles))
            $nbFiles[$specFile->id] = 0;
        if($specFile->multiplicity_min && $nbFiles[$specFile->id] < $specFile->multiplicity_min)
            die(json_encode(array('error' => 1, 'message' => $specFile->multiplicity_min . " fichier(s) \"" . $specFile->name . "\" est(sont) nécessaire(s), mais vous n'en avez fourni que " . $nbFiles[$specFile->id] . " !")));
        elseif($specFile->multiplicity_max && $nbFiles[$specFile->id] > $specFile->multiplicity_max)
            die(json_encode(array('error' => 1, 'message' => "Au plus " . $specFile->multiplicity_max . " fichier(s) \"" . $specFile->name . "\" est(sont) nécessaire(s), mais vous en avez fourni " . $nbFiles[$specFile->id] . " !")));
    }
    // si on est arrivé jusque là, bonne nouvelle (à priori !)
    $model3d->configured = true;
    $model3d->save();
    echo json_encode(array('error' => 0));
}
else {
    die(json_encode(array('error' => 1, 'message' => "Vous n'avez pas les autorisations nécessaires !")));
}    