<?php

//TODO: mettre tout en read-only
class SpecProcessOutput extends ActiveRecord\Model
{
    public static $table_name = 'spec_process_output';
    static $belongs_to = array(
        array('spec_process'),
        array('spec_file')
    );

}
