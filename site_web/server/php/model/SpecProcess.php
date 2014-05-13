<?php

//TODO: mettre tout en read-only
class SpecProcess extends ActiveRecord\Model {
    
    public static $table_name = 'spec_process';
    static $has_many = array(
        array('specProcessInput', 'class_name' => 'SpecProcessInput', 'foreign_key' => 'spec_process_id'),
        array('specStep', 'class_name' => 'SpecStep', 'foreign_key' => 'spec_process_id'),
    );
}