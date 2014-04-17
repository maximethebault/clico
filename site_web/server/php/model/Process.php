<?php

//TODO: restreindre l'accès aux propriéts comme state (empêcher écriture, autoriser lecture)
class Process extends ActiveRecord\Model {
    
    public static $table_name = 'process';
    static $belongs_to = array(
        array('model3d')
    );
    static $has_many = array(
        array('steps', 'class_name' => 'Step', 'foreign_key' => 'process_id')
    );
}