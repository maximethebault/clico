<?php

class File extends ActiveRecord\Model {
    
    public static $table_name = 'file';
    static $belongs_to = array(
        array('model3d')
    );
}