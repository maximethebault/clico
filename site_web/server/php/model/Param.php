<?php

class Param extends ActiveRecord\Model {
    
    public static $table_name = 'param';
    static $belongs_to = array(
        array('model3d')
    );
}