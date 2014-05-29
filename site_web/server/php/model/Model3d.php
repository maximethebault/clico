<?php

class Model3d extends ActiveRecord\Model
{
    public static $table_name = 'model3d';
    static $attr_protected = array('state');
    static $has_many = array(
        array('files', 'class_name' => 'File', 'foreign_key' => 'model3d_id'),
        array('processes', 'class_name' => 'Process', 'foreign_key' => 'model3d_id'),
        array('params', 'class_name' => 'Param', 'foreign_key' => 'model3d_id')
    );

}
