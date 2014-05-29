<?php

class Step extends ActiveRecord\Model
{
    public static $table_name = 'step';
    static $attr_protected = array('state', 'progress');
    static $belongs_to = array(
        array('process')
    );

}
