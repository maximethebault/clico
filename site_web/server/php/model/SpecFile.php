<?php

class SpecFile extends ActiveRecord\Model
{
    public static $table_name = 'spec_file';
    static $has_many = array(
        array('specProcessInput', 'class_name' => 'specProcessInput', 'foreign_key' => 'spec_file_id'),
        array('specProcessOutput', 'class_name' => 'specProcessoutput', 'foreign_key' => 'spec_file_id'),
        array('file', 'class_name' => 'File', 'foreign_key' => 'spec_file_id')
    );

    public function is_readonly() {
        return true;
    }
}
