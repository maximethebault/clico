<?php

//TODO: mettre tout en read-only
class SpecStep extends ActiveRecord\Model {
    
    public static $table_name = 'spec_step';
    static $belongs_to = array(
        array('spec_process')
    );
}