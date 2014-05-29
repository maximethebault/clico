<?php

class SpecProcess extends ActiveRecord\Model
{
    public static $table_name = 'spec_process';
    static $has_many = array(
        array('specParam', 'class_name' => 'SpecParam', 'foreign_key' => 'spec_process_id'),
        array('specProcessInput', 'class_name' => 'SpecProcessInput', 'foreign_key' => 'spec_process_id'),
        array('specFileInput', 'class_name' => 'SpecFile', 'through' => 'specProcessInput'),
        array('specProcessOutput', 'class_name' => 'SpecProcessOutput', 'foreign_key' => 'spec_process_id'),
        array('specFileOutput', 'class_name' => 'SpecFile', 'through' => 'specProcessOutput'),
        array('specStep', 'class_name' => 'SpecStep', 'foreign_key' => 'spec_process_id', 'order' => 'ordering ASC'),
        array('process', 'class_name' => 'Process', 'foreign_key' => 'spec_process_id')
    );

    public function is_readonly() {
        return true;
    }
}
