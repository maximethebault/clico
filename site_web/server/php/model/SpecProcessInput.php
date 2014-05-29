<?php

class SpecProcessInput extends ActiveRecord\Model
{
    public static $table_name = 'spec_process_input';
    static $belongs_to = array(
        array('spec_process'),
        array('spec_file')
    );

    public function is_readonly() {
        return true;
    }
}
