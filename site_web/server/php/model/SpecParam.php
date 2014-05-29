<?php

class SpecParam extends ActiveRecord\Model
{
    public static $table_name = 'spec_param';
    static $belongs_to = array(
        array('spec_process')
    );

    public function is_readonly() {
        return true;
    }
}
