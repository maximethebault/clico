<?php

class SpecParam extends ActiveRecord\Model
{
    public static $table_name = 'spec_param';
    static $belongs_to = array(
        array('spec_process')
    );
    static $has_many = array(
        array('param', 'class_name' => 'Param', 'foreign_key' => 'spec_param_id')
    );

    public function is_readonly() {
        return true;
    }
}
