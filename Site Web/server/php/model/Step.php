<?php

class Step extends ActiveRecord\Model {
    
    public static $table_name = 'step';
    static $belongs_to = array(
        array('process')
    );
}