<?php

class SpecStep extends ActiveRecord\Model
{
    public static $table_name = 'spec_step';
    static $belongs_to = array(
        array('spec_process')
    );

    public function is_readonly() {
        return true;
    }
}
