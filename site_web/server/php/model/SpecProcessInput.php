<?php

//TODO: mettre tout en read-only
class SpecProcessInput extends ActiveRecord\Model {
    
    public static $table_name = 'spec_process_input';
    static $belongs_to = array(
        array('spec_process')
    );
}