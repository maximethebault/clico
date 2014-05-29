<?php

class Process extends ActiveRecord\Model
{
    public static $table_name = 'process';
    static $attr_protected = array('state');
    static $belongs_to = array(
        array('model3d'),
        array('specProcess')
    );
    static $has_many = array(
        array('steps', 'class_name' => 'Step', 'foreign_key' => 'process_id')
    );

}
